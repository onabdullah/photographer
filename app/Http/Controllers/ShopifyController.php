<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\AiStudioToolSetting;
use App\Models\SiteSetting;
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

        $enabledTools = AiStudioToolSetting::enabledStoreValues();
        if (empty($enabledTools)) {
            $enabledTools = ['magic_eraser', 'remove_bg', 'compressor', 'upscale', 'enhance', 'lighting'];
        }
        $initialTool = $request->input('tool');
        if (! in_array($initialTool, $enabledTools, true)) {
            $initialTool = $enabledTools[0] ?? 'magic_eraser';
        }

        $credits = (int) ($shop->ai_credits_balance ?? 0);

        return \Inertia\Inertia::render('Shopify/AIStudio', [
            'product' => $product,
            'initialImage' => $imageUrl,
            'initialTool' => $initialTool,
            'enabledTools' => $enabledTools,
            'credits' => $credits,
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

    /**
     * Render Product AI Lab (VTO) page (Universal products & accessories via Nano Banana 2).
     * Redirects to dashboard when the tool is hidden in admin.
     */
    public function productAILab(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $visible = AiStudioToolSetting::where('tool_key', 'universal_generate')->value('is_enabled');
        if ($visible === false) {
            return redirect()->route('shopify.dashboard');
        }

        $credits = (int) ($shop->ai_credits_balance ?? 0);
        $nanoSettings = SiteSetting::getNanoBananaSettings();
        $features = is_array($nanoSettings['features_enabled'] ?? null) ? $nanoSettings['features_enabled'] : [];
        $guardrails = is_array($nanoSettings['cost_guardrails'] ?? null) ? $nanoSettings['cost_guardrails'] : [];

        $googleFeatureEnabled = (bool) ($features['google_search'] ?? false);
        $imageFeatureEnabled = (bool) ($features['image_search'] ?? false);

        if (array_key_exists('allow_google_search', $guardrails) && ! (bool) $guardrails['allow_google_search']) {
            $googleFeatureEnabled = false;
        }
        if (array_key_exists('allow_image_search', $guardrails) && ! (bool) $guardrails['allow_image_search']) {
            $imageFeatureEnabled = false;
        }

        return \Inertia\Inertia::render('Shopify/ProductAILab', [
            'credits' => $credits,
            'nanoBanana' => [
                'features' => [
                    'google_search' => $googleFeatureEnabled,
                    'image_search' => $imageFeatureEnabled,
                ],
                'defaults' => [
                    'aspect_ratio' => (string) ($nanoSettings['default_aspect_ratio'] ?? '1:1'),
                    'resolution' => (string) ($nanoSettings['default_resolution'] ?? '1K'),
                    'output_format' => (string) ($nanoSettings['default_output_format'] ?? 'jpg'),
                ],
            ],
        ]);
    }

    /**
     * API endpoint to fetch Nano Banana settings (for dynamic merchant UI updates).
     */
    public function getAiStudioSettings(Request $request)
    {
        if (! $this->shopDomain($request)) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $nanoSettings = SiteSetting::getNanoBananaSettings();
        $features = is_array($nanoSettings['features_enabled'] ?? null) ? $nanoSettings['features_enabled'] : [];
        $guardrails = is_array($nanoSettings['cost_guardrails'] ?? null) ? $nanoSettings['cost_guardrails'] : [];

        $defaultReferenceCategories = [
            [
                'id' => 'style_ref',
                'name' => 'Style Reference',
                'description' => 'Guide the AI to match a specific aesthetic, mood, or visual style',
                'prepend_prompt' => 'Match the visual style and aesthetic shown in the reference image.',
                'is_default' => true,
            ],
            [
                'id' => 'face_ref',
                'name' => 'Face Reference',
                'description' => 'Ensure the subject\'s facial features match the reference',
                'prepend_prompt' => 'Maintain the facial features and expression shown in the reference image.',
                'is_default' => true,
            ],
            [
                'id' => 'pose_ref',
                'name' => 'Pose Reference',
                'description' => 'Control the subject\'s posture and positioning',
                'prepend_prompt' => 'Position the subject in the pose shown in the reference image.',
                'is_default' => true,
            ],
        ];

        // Include custom reference categories from admin settings
        $customReferenceCategories = $nanoSettings['reference_categories'] ?? [];
        $allReferenceCategories = array_merge($defaultReferenceCategories, $customReferenceCategories);

        $allAspectRatios = [
            ['value' => '1:1', 'label' => '1:1'],
            ['value' => '4:3', 'label' => '4:3'],
            ['value' => '3:4', 'label' => '3:4'],
            ['value' => '16:9', 'label' => '16:9'],
            ['value' => '9:16', 'label' => '9:16'],
        ];

        $allResolutions = [
            ['value' => '1K', 'label' => '1K', 'hint' => 'Standard', 'extraCredits' => 0],
            ['value' => '2K', 'label' => '2K', 'hint' => 'HD', 'extraCredits' => 1],
            ['value' => '4K', 'label' => '4K', 'hint' => 'Ultra HD', 'extraCredits' => 3],
        ];

        $visibleAspectRatios = $allAspectRatios;
        $visibleResolutions = $allResolutions;

        if (isset($guardrails['lock_aspect_ratios']) && is_array($guardrails['lock_aspect_ratios'])) {
            $lockedAspects = $guardrails['lock_aspect_ratios'];
            $visibleAspectRatios = array_filter($allAspectRatios, function ($opt) use ($lockedAspects) {
                return in_array($opt['value'], $lockedAspects, true);
            });
            $visibleAspectRatios = array_values($visibleAspectRatios);
        }

        if (isset($guardrails['lock_resolutions']) && is_array($guardrails['lock_resolutions'])) {
            $lockedResolutions = $guardrails['lock_resolutions'];
            $visibleResolutions = array_filter($allResolutions, function ($opt) use ($lockedResolutions) {
                return in_array($opt['value'], $lockedResolutions, true);
            });
            $visibleResolutions = array_values($visibleResolutions);
        }

        return response()->json([
            'reference_categories' => $allReferenceCategories,
            'visible_aspect_ratios' => $visibleAspectRatios,
            'visible_resolutions' => $visibleResolutions,
            'features' => [
                'google_search' => (bool) ($features['google_search'] ?? false),
                'image_search' => (bool) ($features['image_search'] ?? false),
            ],
            'guardrails' => $guardrails,
        ]);
    }
}
