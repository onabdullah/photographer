<?php

namespace App\Http\Traits;

use Illuminate\Http\Request;

trait UsesShopifyTokenExchange
{
    /**
     * Get access token via session token exchange. Use when stored token has failed.
     */
    protected function getAccessTokenForRequest($shop, Request $request): ?string
    {
        $sessionToken = $request->bearerToken() ?: $request->query('token');
        return $sessionToken ? $this->exchangeSessionToken($shop->name, $sessionToken) : null;
    }

    protected function exchangeSessionToken(string $shopDomain, string $sessionToken): ?string
    {
        $apiKey = config('shopify-app.api_key');
        $apiSecret = config('shopify-app.api_secret');
        if (empty($apiKey) || empty($apiSecret)) {
            return null;
        }
        try {
            $client = new \GuzzleHttp\Client();
            $resp = $client->post("https://{$shopDomain}/admin/oauth/access_token", [
                'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
                'form_params' => [
                    'client_id' => $apiKey,
                    'client_secret' => $apiSecret,
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:token-exchange',
                    'subject_token' => $sessionToken,
                    'subject_token_type' => 'urn:ietf:params:oauth:token-type:id_token',
                    'requested_token_type' => 'urn:shopify:params:oauth:token-type:online-access-token',
                ],
            ]);
            $body = json_decode($resp->getBody()->getContents(), true);
            return $body['access_token'] ?? null;
        } catch (\Throwable $e) {
            \Log::debug('Token exchange failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $params
     * @param  int  $timeout  Timeout in seconds (default 30; use 60+ for large payloads e.g. base64 images)
     */
    protected function restWithToken(string $shopDomain, string $accessToken, string $method, string $path, array $params = [], int $timeout = 30): array
    {
        $version = config('shopify-app.api_version', '2024-04');
        $pathClean = preg_replace('#^/admin/api/[^/]+/#', '/', $path);
        $pathClean = ltrim(preg_replace('#^/admin/#', '', $pathClean), '/');
        $url = "https://{$shopDomain}/admin/api/{$version}/{$pathClean}";

        try {
            $client = new \GuzzleHttp\Client(['timeout' => $timeout]);
            $options = [
                'headers' => [
                    'X-Shopify-Access-Token' => $accessToken,
                    'Content-Type' => 'application/json',
                ],
            ];
            if (strtoupper($method) === 'GET' && !empty($params)) {
                $options['query'] = $params;
            } elseif (!empty($params)) {
                $options['json'] = $params;
            }
            $resp = $client->request($method, $url, $options);
            $body = json_decode($resp->getBody()->getContents(), false); // false = return objects for consistent access
            $link = $resp->hasHeader('Link') ? $resp->getHeaderLine('Link') : null;
            return ['errors' => false, 'status' => $resp->getStatusCode(), 'body' => $body ?? (object) [], 'response' => $resp, 'link' => $link];
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $resp = $e->getResponse();
            $rawBody = $resp ? $resp->getBody()->getContents() : $e->getMessage();
            $body = $rawBody;
            if (is_string($rawBody) && trim($rawBody) !== '') {
                $decoded = json_decode($rawBody, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $body = $decoded;
                }
            }
            return ['errors' => true, 'status' => $resp ? $resp->getStatusCode() : null, 'body' => $body];
        }
    }
}
