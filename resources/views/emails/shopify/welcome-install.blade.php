<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #468A9A; color: white; padding: 40px 30px; text-align: center; }
        .header p { margin: 8px 0 0; font-size: 15px; opacity: 0.9; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
        .credits-badge { display: inline-block; background-color: rgba(255, 122, 48, 0.1); border: 1px solid rgba(255, 122, 48, 0.25); color: #c2440e; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px; margin: 16px 0; }
        .intro-text { font-size: 15px; color: #374151; line-height: 1.7; margin: 16px 0; }
        .highlight { color: #111827; font-weight: 600; }
        .benefit-section { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 10px; padding: 20px; margin: 20px 0; }
        .benefit-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 12px; }
        .benefit-list { margin: 0; padding-left: 20px; }
        .benefit-list li { margin: 8px 0; font-size: 14px; color: #374151; line-height: 1.6; }
        .tools-grid { margin: 24px 0; }
        .tools-grid-title { font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; }
        .tool-card { background-color: #F9FAFB; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
        .tool-name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .tool-desc { font-size: 12px; color: #6b7280; line-height: 1.5; }
        .cta-section { text-align: center; margin: 28px 0; }
        .button { display: inline-block; padding: 14px 36px; background: #468A9A; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .signature { margin-top: 24px; color: #6b7280; line-height: 1.6; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 24px 30px; text-align: center; font-size: 13px; color: #6B7280; line-height: 1.6; }
        h1 { margin: 0 0 4px; font-size: 28px; font-weight: 700; }
        p { margin: 12px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">

        <div class="header">
            @if($appLogoUrl)
                <img src="{{ $appLogoUrl }}" alt="{{ $appName }}" style="max-height: 44px; width: auto; display: inline-block; margin-bottom: 16px;"><br>
            @endif
            <h1>Welcome</h1>
            <p>Professional product visuals powered by AI — no expensive photoshoots needed</p>
        </div>

        <div class="content">
            <p class="greeting">
                Hello
                @php
                    $displayName = $shopName;
                    $displayName = preg_replace('/\.myshopify\.com$/i', '', $displayName);
                    $displayName = Str::title(str_replace(['-', '_', '.'], ' ', $displayName));
                @endphp
                <strong>{{ $displayName }}</strong>,
            </p>

            <p class="intro-text">
                You've just unlocked a game-changing tool for your store. <span class="highlight">{{ $appName }} delivers what traditional photoshoots cost $300–$500 for — in seconds, for pennies.</span> No studio rental. No equipment. No scheduling delays. Just professional, conversion-optimized product images on demand.
            </p>

            <div style="text-align: center;">
                <span class="credits-badge">{{ $creditsGranted }} Free AI Credits Ready</span>
            </div>

            <!-- Why This Matters -->
            <div class="benefit-section" style="background-color: rgba(34, 197, 94, 0.06); border-color: rgba(34, 197, 94, 0.15);">
                <p class="benefit-title">Why Professional Visuals Drive Results</p>
                <ul class="benefit-list">
                    <li><strong>2-3x Higher Conversion Rates</strong> — Stores with professional imagery convert significantly better than competitors using stock or low-quality photos.</li>
                    <li><strong>Lower Cart Abandonment</strong> — Clear, detailed product visuals build customer confidence and reduce returns.</li>
                    <li><strong>Premium Brand Perception</strong> — Professional imagery positions your store as established and trustworthy, justifying premium pricing.</li>
                    <li><strong>Competitive Edge</strong> — While competitors spend thousands on seasonal photo shoots, you're updating visuals instantly and staying ahead.</li>
                </ul>
            </div>

            <!-- The Tools -->
            <div class="tools-grid">
                <p class="tools-grid-title">7 Professional AI Tools at Your Fingertips</p>

                <div class="tool-card">
                    <div class="tool-name">1. AI Image Enhancement</div>
                    <div class="tool-desc">Sharpen, denoise, and color-correct product images to studio quality instantly. Perfect for fixing lighting, exposure, and details.</div>
                </div>

                <div class="tool-card">
                    <div class="tool-name">2. Image Upscaler</div>
                    <div class="tool-desc">Transform low-resolution photos into 4x sharper images. Ideal for legacy product photos and archives.</div>
                </div>

                <div class="tool-card">
                    <div class="tool-name">3. Magic Eraser</div>
                    <div class="tool-desc">Remove unwanted objects, watermarks, or backgrounds with pixel-perfect precision. No manual editing required.</div>
                </div>

                <div class="tool-card">
                    <div class="tool-name">4. Lighting Fix</div>
                    <div class="tool-desc">Balance exposure and eliminate harsh shadows for consistent professional appearance across your entire catalog.</div>
                </div>

                <div class="tool-card">
                    <div class="tool-name">5. Background Remover</div>
                    <div class="tool-desc">Create clean, catalog-ready product images in seconds. Perfect for adding custom backgrounds or maintaining consistency.</div>
                </div>

                <div class="tool-card">
                    <div class="tool-name">6. Image Compressor</div>
                    <div class="tool-desc">Optimize image sizes for lightning-fast page loads without sacrificing quality. Improves SEO and mobile experience.</div>
                </div>

                <div class="tool-card">
                    <div class="tool-name">7. Product AI Lab</div>
                    <div class="tool-desc">Generate unlimited product variations optimized for conversion. Test different styles, backgrounds, and compositions instantly.</div>
                </div>
            </div>

            <!-- Getting Started -->
            <div class="benefit-section">
                <p class="benefit-title">How to Get Started (3 Steps)</p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="30" valign="top" style="padding-top:2px;">
                            <div style="width:26px;height:26px;background-color:#468A9A;color:white;border-radius:50%;text-align:center;line-height:26px;font-size:12px;font-weight:800;">1</div>
                        </td>
                        <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;padding-bottom:12px;">
                            <strong style="color:#111827;">Open {{ $appName }}</strong> from your Shopify admin sidebar under <em>Apps → {{ $appName }}</em>
                        </td>
                    </tr>
                    <tr>
                        <td width="30" valign="top" style="padding-top:2px;">
                            <div style="width:26px;height:26px;background-color:#468A9A;color:white;border-radius:50%;text-align:center;line-height:26px;font-size:12px;font-weight:800;">2</div>
                        </td>
                        <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;padding-bottom:12px;">
                            <strong style="color:#111827;">Upload a product photo</strong> or browse your existing Shopify catalog
                        </td>
                    </tr>
                    <tr>
                        <td width="30" valign="top" style="padding-top:2px;">
                            <div style="width:26px;height:26px;background-color:#468A9A;color:white;border-radius:50%;text-align:center;line-height:26px;font-size:12px;font-weight:800;">3</div>
                        </td>
                        <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;">
                            <strong style="color:#111827;">Pick an AI tool</strong> and apply it — results save directly to your store instantly
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Pro Tips -->
            <div class="benefit-section" style="background-color: rgba(255, 122, 48, 0.06); border-color: rgba(255, 122, 48, 0.15);">
                <p class="benefit-title">Pro Tips to Maximize Your Impact</p>
                <ul class="benefit-list">
                    <li><strong>Start with top performers:</strong> Apply AI tools to your best-selling products and hero images first for maximum ROI.</li>
                    <li><strong>Create variations strategically:</strong> Test different backgrounds, lighting, and compositions to discover what drives conversions.</li>
                    <li><strong>Batch your workflow:</strong> Process similar products together to maintain consistency and save time.</li>
                    <li><strong>Repurpose across channels:</strong> Use polished images on social media, ads, and email campaigns to amplify reach.</li>
                    <li><strong>Track performance:</strong> Monitor which visual styles drive the most engagement and orders, then double down on winners.</li>
                </ul>
            </div>

            <p style="margin: 20px 0 16px; font-size: 15px; color: #111827; font-weight: 500;">
                Your <span class="highlight">{{ $creditsGranted }} free credits</span> are ready now. Every second you wait is potential sales left on the table.
            </p>

            <div class="cta-section">
                <a href="{{ url('/') }}" class="button">Launch {{ $appName }} Now</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 20px 0;">
                Questions? Reply to this email or check our help center within the app dashboard.
            </p>

            <p class="signature">
                Regards,<br>
                <strong>The {{ $appName }} Team</strong>
            </p>
        </div>

        <div class="footer">
            {{ $appName }} · Professional product visuals on demand<br>
            Questions? We're here to help. Reply to this email anytime.
        </div>

    </div>
</body>
</html>
