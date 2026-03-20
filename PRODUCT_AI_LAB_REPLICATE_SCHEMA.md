# Product AI Lab Settings - Replicate API Schema Reference

## Updated Configuration (2026-03-21)

All settings now **exactly match** the Replicate `google/nano-banana-2` API schema for seamless integration.

### Model Information
- **Model**: `google/nano-banana-2`
- **Provider**: Replicate AI
- **Version**: `71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd`

---

## Editable Settings (Admin Modal)

### 1. **Model Version** (Text Input)
- Current model identifier
- Can be updated anytime
- Example: `71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd`
- Triggers security email when changed

### 2. **Prepend Prompt** (Textarea, Optional)
- Text prepended to ALL user prompts
- Max 2000 characters
- Use for: quality guidelines, style preferences, consistent branding
- Example: `"high-quality product photo, professional lighting, 8K resolution"`

### 3. **Default Resolution** (Select)
- Options: `1K`, `2K`, `4K`
- Default: `1K`
- **API Cost per generation**:
  - 1K image: ~$0.067/img
  - 2K image: ~$0.101/img
  - 4K image: ~$0.151/img
- Shown in modal for admin reference

### 4. **Default Aspect Ratio** (Select)
- Options (from Replicate schema):
  - `match_input_image` (Default - preserves input ratio)
  - `1:1` (Square)
  - `1:4`, `1:8` (Tall mobile)
  - `2:3`, `3:2` (Portrait/Landscape)
  - `3:4`, `4:3`, `4:5`, `5:4` (Photography)
  - `4:1`, `8:1` (Ultra-wide)
  - `9:16`, `16:9` (Video formats)
  - `21:9` (Ultra-cinematic)

### 5. **Default Output Format** (Select)
- Options: `jpg`, `png`
- Default: `jpg`
- Trade-off: JPG (smaller file) vs PNG (transparency support)

### 6. **Google Search Grounding** (Toggle)
- Use real-time web search for context
- Enables: weather, sports scores, recent events, trending topics
- Cost multiplier: **+50%** on API costs
- Auto-enables: web search when enabled

### 7. **Image Search Grounding** (Toggle)
- Find and use web images as visual references
- Automatically enables: Google web search
- Cost multiplier: **+50%** on API costs
- Use for: finding reference images, visual inspiration

---

## API Schema (Replicate Input)

```json
{
  "prompt": "string (required)",
  "image_input": "array of URIs (0-14 images, optional)",
  "aspect_ratio": "enum (match_input_image, 1:1, 1:4, ...)",
  "resolution": "enum (1K, 2K, 4K)",
  "google_search": "boolean",
  "image_search": "boolean",
  "output_format": "enum (jpg, png)"
}
```

---

## Database Storage

**Stored in**: `site_settings` table (key-value pairs)

| Key | Value Type | Example |
|-----|-----------|---------|
| `product_ai_lab_model_version` | string | `71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd` |
| `product_ai_lab_prepend_prompt` | string | `high-quality, professional lighting` |
| `product_ai_lab_default_resolution` | string | `1K` |
| `product_ai_lab_default_aspect_ratio` | string | `match_input_image` |
| `product_ai_lab_default_output_format` | string | `jpg` |
| `product_ai_lab_features_enabled` | JSON | `{"google_search": false, "image_search": false}` |

**Audit table**: `product_ai_lab_settings` - tracks version changes

---

## Security & Notifications

**Triggered on ANY change**:
- Email sent to: **Super-admin only**
- Contains: Before/after values, admin email, timestamp
- Logged to: `channels.admin` channel
- Template: Color-coded diff format (red=old, green=new)

---

## Configuration File

Location: `config/ai_studio_tools.php` → `product_ai_lab` section

```php
'product_ai_lab' => [
    'model_version' => '71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd',

    'defaults' => [
        'aspect_ratio' => 'match_input_image',
        'resolution' => '1K',
        'output_format' => 'jpg',
    ],

    'supported_fields' => [
        'aspect_ratio' => [...15 options...],
        'resolution' => ['1K', '2K', '4K'],
        'output_format' => ['jpg', 'png'],
    ],

    'features' => [
        'google_search' => [...],
        'image_search' => [...],
    ],

    'cost_per_resolution' => [
        '1K' => 0.067,
        '2K' => 0.101,
        '4K' => 0.151,
    ],

    'cost_multiplier_with_search' => 1.5,
]
```

---

## How It Works

1. **Admin opens modal**: Goes to AI Tools Analysis → Tools tab → Settings button on "Product AI Lab (VTO)"
2. **Edits settings**: Updates model version, parameters, search options
3. **Saves changes**:
   - Settings validated against Replicate schema
   - Stored in database
   - Security email dispatched to super-admin
   - Change logged to admin channel
4. **Future use**: When Shopify ProductAILab integrates, these settings will be passed as defaults

---

## Cost Calculation Example

**Scenario**: User generates 4K image with both search options enabled

```
Base cost (4K):           $0.151
+ 50% for search options: $0.151 × 1.5 = $0.2265 per image
```

Admins can use these settings to optimize costs vs quality trade-offs.

---

## Files Updated

- ✅ `config/ai_studio_tools.php` - Full Replicate schema
- ✅ `resources/js/Admin/Components/ProductAILabSettingsModal.jsx` - Enhanced UI with cost info
- ✅ `app/Models/SiteSetting.php` - Correct defaults (match_input_image)

All parameters now 100% match Replicate API for perfect integration.
