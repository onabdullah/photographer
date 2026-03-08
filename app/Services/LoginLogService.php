<?php

namespace App\Services;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Jenssegers\Agent\Agent;

class LoginLogService
{
    /**
     * Resolve location info from IP. Returns ['location', 'country', 'city'].
     */
    private static function locationFromIp(string $ip): array
    {
        if (in_array($ip, ['127.0.0.1', '::1'], true)) {
            return ['location' => 'Local', 'country' => null, 'city' => null];
        }
        try {
            // ipapi.co supports both IPv4 and IPv6 natively over HTTPS (free tier: 30k/day)
            $response = Http::timeout(3)
                ->withHeaders(['Accept' => 'application/json'])
                ->get("https://ipapi.co/{$ip}/json/");
            if ($response->successful()) {
                $data = $response->json();
                // ipapi.co returns {"error":true,"reason":"..."} for invalid IPs
                if (! ($data['error'] ?? false)) {
                    $city    = $data['city']         ?? null;
                    $region  = $data['region']       ?? null;
                    $country = $data['country_name'] ?? null;
                    $parts   = array_filter([$city, $region, $country]);
                    return [
                        'location' => implode(', ', $parts) ?: 'Unknown',
                        'country'  => $country,
                        'city'     => $city,
                    ];
                }
            }
        } catch (\Throwable) {
            // ignore – location is non-critical
        }
        return ['location' => 'Unknown', 'country' => null, 'city' => null];
    }

    /**
     * Parse browser, OS and device type from a User-Agent string.
     * Returns ['browser', 'os', 'device_type'].
     */
    private static function parseUserAgent(?string $ua): array
    {
        if (! $ua) {
            return ['browser' => null, 'os' => null, 'device_type' => 'Unknown'];
        }
        try {
            $agent = new Agent();
            $agent->setUserAgent($ua);

            $browserName    = $agent->browser();
            $browserVersion = $browserName ? $agent->version($browserName) : null;
            $platformName   = $agent->platform();
            $platformVersion = $platformName ? $agent->version($platformName) : null;

            $deviceType = $agent->isTablet() ? 'Tablet'
                        : ($agent->isMobile() ? 'Mobile' : 'Desktop');

            return [
                'browser'     => $browserName
                    ? ($browserVersion ? "{$browserName} {$browserVersion}" : $browserName)
                    : null,
                'os'          => $platformName
                    ? ($platformVersion ? "{$platformName} {$platformVersion}" : $platformName)
                    : null,
                'device_type' => $deviceType,
            ];
        } catch (\Throwable) {
            return ['browser' => null, 'os' => null, 'device_type' => null];
        }
    }

    public static function logSuccess(Request $request, User $user): void
    {
        try {
            $ip       = $request->ip() ?? '0.0.0.0';
            $geo      = self::locationFromIp($ip);
            $ua       = self::parseUserAgent($request->userAgent());
            $risk     = LoginLog::computeRisk($ip, LoginLog::STATUS_SUCCESS);

            LoginLog::create([
                'user_id'        => $user->id,
                'email'          => $user->email,
                'ip_address'     => $ip,
                'user_agent'     => $request->userAgent(),
                'status'         => LoginLog::STATUS_SUCCESS,
                'event_type'     => LoginLog::EVENT_LOGIN,
                'location'       => $geo['location'],
                'country'        => $geo['country'],
                'city'           => $geo['city'],
                'browser'        => $ua['browser'],
                'os'             => $ua['os'],
                'device_type'    => $ua['device_type'],
                'risk_percentage' => $risk,
            ]);

            $user->update(['last_login_at' => now()]);
        } catch (\Throwable) {
            // Logging must never break authentication
        }
    }

    public static function logFailed(Request $request, string $email): void
    {
        try {
            $ip       = $request->ip() ?? '0.0.0.0';
            $geo      = self::locationFromIp($ip);
            $ua       = self::parseUserAgent($request->userAgent());
            $risk     = LoginLog::computeRisk($ip, LoginLog::STATUS_FAILED);

            LoginLog::create([
                'user_id'        => null,
                'email'          => $email,
                'ip_address'     => $ip,
                'user_agent'     => $request->userAgent(),
                'status'         => LoginLog::STATUS_FAILED,
                'event_type'     => LoginLog::EVENT_LOGIN,
                'location'       => $geo['location'],
                'country'        => $geo['country'],
                'city'           => $geo['city'],
                'browser'        => $ua['browser'],
                'os'             => $ua['os'],
                'device_type'    => $ua['device_type'],
                'risk_percentage' => $risk,
            ]);
        } catch (\Throwable) {
            // Logging must never break authentication
        }
    }

    public static function logLogout(Request $request, User $user): void
    {
        try {
            $ip    = $request->ip() ?? '0.0.0.0';
            $geo   = self::locationFromIp($ip);
            $ua    = self::parseUserAgent($request->userAgent());

            LoginLog::create([
                'user_id'        => $user->id,
                'email'          => $user->email,
                'ip_address'     => $ip,
                'user_agent'     => $request->userAgent(),
                'status'         => LoginLog::STATUS_SUCCESS,
                'event_type'     => LoginLog::EVENT_LOGOUT,
                'location'       => $geo['location'],
                'country'        => $geo['country'],
                'city'           => $geo['city'],
                'browser'        => $ua['browser'],
                'os'             => $ua['os'],
                'device_type'    => $ua['device_type'],
                'risk_percentage' => 0,
            ]);
        } catch (\Throwable) {
            // Logging must never block logout
        }
    }
}

