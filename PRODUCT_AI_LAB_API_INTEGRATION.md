# Product AI Lab Settings → Replicate API Integration Guide

## How Admin Settings Map to API Calls

### Admin Modal Settings
```
model_version                    → Used in deployment/routing
prepend_prompt                   → Prepended to user prompt before API call
default_resolution              → Default resolution enum
default_aspect_ratio            → Default aspect_ratio enum
default_output_format           → Default output_format enum
features_enabled.google_search  → google_search boolean parameter
features_enabled.image_search   → image_search boolean parameter
```

---

## API Call Flow (Current & Future)

### Current State (No Integration Yet)
```
Admin Panel
    ↓
ProductAILabSettingsModal
    ↓
PUT /admin/product-ai-lab-settings
    ↓
Settings stored in database
```

### Future State (Phase 2 - Shopify Integration)
```
Shopify ProductAILab.jsx
    ↓
GET settings from backend
    ↓
Backend loads from SiteSetting
    ↓
Pass as props to ProductAILab
    ↓
User enters prompt
    ↓
Prepend prompt if configured
    ↓
Build Replicate API payload:
{
  "prompt": prepend_prompt + " " + user_prompt,
  "image_input": [...uploaded images...],
  "aspect_ratio": default_aspect_ratio,
  "resolution": default_resolution,
  "google_search": features_enabled.google_search,
  "image_search": features_enabled.image_search,
  "output_format": default_output_format
}
    ↓
POST to Replicate API
    ↓
Generate image
    ↓
Return to user
```

---

## Example: Complete API Request

### Admin Sets:
- Model Version: `71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd`
- Prepend Prompt: `"professional product photo, authentic model, good lighting"`
- Default Resolution: `2K`
- Default Aspect Ratio: `match_input_image`
- Default Output Format: `jpg`
- Google Search: `OFF`
- Image Search: `ON`

### User Inputs:
- Prompt: `"wearing red sweater in office"`
- Uploads: 1 reference image

### Generated Replicate API Call:
```json
{
  "model": "google/nano-banana-2",
  "version": "71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd",
  "input": {
    "prompt": "professional product photo, authentic model, good lighting wearing red sweater in office",
    "image_input": [
      "https://uploads.example.com/ref-image-1.jpg"
    ],
    "resolution": "2K",
    "aspect_ratio": "match_input_image",
    "google_search": false,
    "image_search": true,
    "output_format": "jpg"
  }
}
```

### Cost Calculation:
```
Base (2K):              $0.101
+ Image Search (+50%):  $0.101 × 1.5 = $0.1515
Total cost:             $0.1515 per image generation
```

---

## Validation Rules (Currently Enforced)

### Model Version
- ✅ Required (for identification)
- ✅ No validation (any string accepted)
- ℹ️ Admin responsibility to enter correct version

### Prepend Prompt
- ✅ Max 2000 characters
- ✅ Optional (can be empty)
- ✅ No special validation (any text allowed)

### Resolution
- ✅ Whitelist: `1K`, `2K`, `4K` only
- ✅ Default: `1K`

### Aspect Ratio
- ✅ Whitelist: All 15 Replicate options
- ✅ Default: `match_input_image`
- ✅ Enforced on update via controller

### Output Format
- ✅ Whitelist: `jpg`, `png` only
- ✅ Default: `jpg`

### Google Search
- ✅ Boolean (`true`/`false`)
- ✅ Default: `false`

### Image Search
- ✅ Boolean (`true`/`false`)
- ✅ Default: `false`
- ℹ️ When enabled, automatically enables Google Search per Replicate docs

---

## Backend Methods for Fetching Settings

### In Laravel Code:
```php
use App\Models\SiteSetting;

// Get current settings (merged: DB + config defaults)
$settings = SiteSetting::getProductAILabSettings();

// Access individual settings
$modelVersion = $settings['model_version'];
$prependPrompt = $settings['prepend_prompt'];
$defaultRes = $settings['default_resolution'];
$aspectRatio = $settings['default_aspect_ratio'];
$format = $settings['default_output_format'];
$googleSearch = $settings['features_enabled']['google_search'];
$imageSearch = $settings['features_enabled']['image_search'];

// Update settings
SiteSetting::setProductAILabSettings([
    'model_version' => '...',
    'default_resolution' => '2K',
    'features_enabled' => ['google_search' => true, 'image_search' => false],
]);
```

### Example: AI Generation Service Usage
```php
namespace App\Services;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Http;

class AiGenerationService {
    public function generateWithProductAILab(string $userPrompt, array $images = []): array {
        // Get admin-configured defaults
        $settings = SiteSetting::getProductAILabSettings();

        // Build final prompt
        $finalPrompt = trim($settings['prepend_prompt']) . ' ' . $userPrompt;

        // Build Replicate payload
        $payload = [
            'prompt' => $finalPrompt,
            'image_input' => $images,
            'resolution' => $settings['default_resolution'],
            'aspect_ratio' => $settings['default_aspect_ratio'],
            'google_search' => $settings['features_enabled']['google_search'],
            'image_search' => $settings['features_enabled']['image_search'],
            'output_format' => $settings['default_output_format'],
        ];

        // Call Replicate API
        $response = Http::post(
            "https://api.replicate.com/v1/predictions",
            [
                'version' => $settings['model_version'],
                'input' => $payload,
            ],
            ['Authorization' => 'Token ' . env('REPLICATE_API_TOKEN')]
        );

        return $response->json();
    }
}
```

---

## Testing Checklist

- [ ] Load settings modal, verify all 15 aspect ratios display correctly
- [ ] Change model version, confirm email sent to super-admin with old→new values
- [ ] Edit prepend_prompt, verify character count updates
- [ ] Toggle search features, verify cost multiplier info displays
- [ ] Click Reset to Defaults, verify email shows all fields reverted
- [ ] Verify settings persist after page reload
- [ ] Confirm validation rejects invalid resolution values
- [ ] Check dark mode rendering of all form elements
- [ ] Verify Save button disabled when no changes made

---

## Quick Reference: Aspect Ratio Selection Guide

| Ratio | Use Case | Example |
|-------|----------|---------|
| `match_input_image` | Keep input aspect (Default) | User uploads 3:2, output stays 3:2 |
| `1:1` | Square (Social media) | Instagram posts |
| `2:3`, `3:2` | Photography | Portrait/Landscape photos |
| `16:9` | Wide screen | YouTube thumbnails |
| `9:16`, `3:4`, `4:5` | Mobile/Stories | Instagram Reels, TikTok |
| `4:1`, `8:1` | Banners | Website headers |
| `21:9` | Cinematic | Ultra-wide displays |

---

All admin settings now perfectly align with Replicate `google/nano-banana-2` API schema.
Ready for seamless integration when Phase 2 (Shopify ProductAILab integration) begins.
