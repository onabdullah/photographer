<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use Illuminate\Http\Request;

class ShopifyController extends Controller
{
    use GetsCurrentShop;

    public function aiStudio(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $productId = $request->input('product_id');
        $imageUrl = $request->input('image_url');
        $product = null;

        if ($productId) {
            try {
                $response = $shop->api()->rest('GET', "/admin/products/{$productId}.json", ['fields' => 'id,title']);
                if (! $response['errors'] && isset($response['body']->product)) {
                    $p = $response['body']->product;
                    $product = [
                        'id' => $p->id,
                        'title' => $p->title,
                    ];
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to fetch product {$productId}: " . $e->getMessage());
            }
        }

        if (! $product) {
            $product = [
                'id' => null,
                'title' => 'Untitled Product',
            ];
        }

        if (! $imageUrl) {
            $imageUrl = 'https://via.placeholder.com/600x600?text=Select+a+Product';
        }

        $validTools = ['remove_bg', 'bg_swap', 'upscale', 'magic_eraser', 'enhance', 'lighting'];
        $initialTool = $request->input('tool');
        if (! in_array($initialTool, $validTools, true)) {
            $initialTool = 'remove_bg';
        }

        return \Inertia\Inertia::render('Shopify/AIStudio', [
            'product' => $product,
            'initialImage' => $imageUrl,
            'initialTool' => $initialTool,
        ]);
    }

    public function generateImage(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        \Illuminate\Support\Facades\Log::info('Generate Image Request Payload:', $request->except('image_file'));
        \Illuminate\Support\Facades\Log::info('File present: ' . ($request->hasFile('image_file') ? 'Yes' : 'No'));

        $request->validate([
            'prompt' => 'nullable|string',
            'image_url' => 'required_without:image_file|nullable|url',
            'image_file' => 'required_without:image_url|nullable|file|mimes:jpeg,png,jpg,webp|max:15360',
            'action_type' => 'nullable|string',
        ]);

        $prompt = $request->input('prompt');
        $imageUrl = $request->input('image_url');
        $actionType = $request->input('action_type', 'generate');

        if ($actionType === 'remove-bg') {
            $apiKey = env('REMOVE_BG_API_KEY');
            if (! $apiKey) {
                return response()->json(['error' => 'Remove.bg API Key is missing.'], 500);
            }

            try {
                $client = new \GuzzleHttp\Client();

                $multipart = [
                    [
                        'name' => 'size',
                        'contents' => 'auto',
                    ],
                ];

                if ($request->hasFile('image_file')) {
                    $multipart[] = [
                        'name' => 'image_file',
                        'contents' => fopen($request->file('image_file')->getPathname(), 'r'),
                        'filename' => $request->file('image_file')->getClientOriginalName(),
                    ];
                } else {
                    $multipart[] = [
                        'name' => 'image_url',
                        'contents' => $imageUrl,
                    ];
                }

                $response = $client->post('https://api.remove.bg/v1.0/removebg', [
                    'headers' => [
                        'X-Api-Key' => $apiKey,
                    ],
                    'multipart' => $multipart,
                ]);

                $imageContent = $response->getBody()->getContents();
                $fileName = 'removed-bg-' . time() . '-' . uniqid() . '.png';
                $path = public_path('storage/generated/' . $fileName);

                if (! file_exists(dirname($path))) {
                    mkdir(dirname($path), 0755, true);
                }

                file_put_contents($path, $imageContent);

                return response()->json([
                    'success' => true,
                    'image_url' => asset('storage/generated/' . $fileName),
                    'message' => 'Background removed successfully',
                ]);
            } catch (\GuzzleHttp\Exception\RequestException $e) {
                $errorMsg = $e->getMessage();
                if ($e->hasResponse()) {
                    $responseBody = $e->getResponse()->getBody()->getContents();
                    $errorData = json_decode($responseBody, true);
                    $errorMsg = $errorData['errors'][0]['title'] ?? $responseBody;
                }
                \Illuminate\Support\Facades\Log::error('Remove.bg API Error: ' . $errorMsg);
                return response()->json(['error' => 'Remove.bg Error: ' . $errorMsg], 500);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Remove.bg General Error: ' . $e->getMessage());
                return response()->json(['error' => 'Failed to remove background: ' . $e->getMessage()], 500);
            }
        }

        $apiKey = env('GEMINI_API_KEY');
        if (! $apiKey) {
            return response()->json(['error' => 'Gemini API Key is missing. Please configure it in the .env file.'], 500);
        }

        \Illuminate\Support\Facades\Log::info("Generating image with Gemini AI for shop: {$shop->name}. Prompt: {$prompt}");

        sleep(2);

        return response()->json([
            'success' => true,
            'image_url' => $imageUrl,
            'message' => 'Image generated successfully (Simulation)',
        ]);
    }

    public function verifyProducts(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            return response()->json(['ok' => false, 'error' => 'Shop not authenticated']);
        }
        try {
            $resp = $shop->api()->graph('query { productsCount { count } }');
            if (empty($resp['errors']) && isset($resp['body'])) {
                $arr = method_exists($resp['body'], 'toArray') ? $resp['body']->toArray() : ($resp['body']->container ?? []);
                $count = \Illuminate\Support\Arr::get($arr, 'data.productsCount.count');
                return response()->json(['ok' => true, 'productsCount' => (int) ($count ?? 0)]);
            }
            return response()->json(['ok' => false, 'error' => 'API error', 'details' => $resp['errors'] ?? $resp['body'] ?? null]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()]);
        }
    }

    public function aiModels(Request $request)
    {
        return \Inertia\Inertia::render('Shopify/AiModels');
    }
}
