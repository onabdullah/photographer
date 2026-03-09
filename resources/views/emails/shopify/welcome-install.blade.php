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
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); padding: 20px 24px; border-radius: 8px; margin: 24px 0; }
        .details p { margin: 8px 0; font-size: 14px; color: #374151; }
        .details p strong { color: #111827; }
        .feature-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .feature-desc { font-size: 12px; color: #6b7280; line-height: 1.5; }
        .button { display: inline-block; padding: 14px 36px; background: #468A9A; color: white !important; text-decoration: none; border-radius: 8px; margin: 8px 0 24px; font-weight: 600; font-size: 15px; }
        .signature { margin-top: 12px; color: #6b7280; line-height: 1.5; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 24px 30px; text-align: center; font-size: 13px; color: #6B7280; line-height: 1.6; }
        h1 { margin: 0 0 4px; font-size: 28px; font-weight: 700; }
        p { margin: 12px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">

        {{-- ── HEADER ── --}}
        <div class="header">
            @if($appLogoUrl)
                <img src="{{ $appLogoUrl }}" alt="{{ $appName }}" style="max-height: 44px; width: auto; display: inline-block; margin-bottom: 16px;"><br>
            @endif
            <h1>Congratulations</h1>
            <p>Your journey to sustainable growth starts now with {{ $appName }}.</p>
        </div>

        {{-- ── CONTENT ── --}}
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

            <p>Thank you for installing <strong>{{ $appName }}</strong>. You now have a professional AI workflow designed to produce high-converting product visuals with speed and consistency.</p>
            <p>Our mission is not only to provide tools, but to build a long-term partnership with your brand. We are committed to helping you create exceptional visual results and lasting customer trust.</p>

            {{-- Credits badge --}}
            <div style="text-align: center; margin: 20px 0;">
                <span class="credits-badge">{{ $creditsGranted }} Free AI Credits Added to Your Account</span>
            </div>

            {{-- Tools (minimal cards, no icons) --}}
            @php
                $toolCards = [
                    ['title' => 'AI Image Enhancement', 'desc' => 'Sharpen, denoise, and color-correct product images automatically.'],
                    ['title' => 'Image Upscaler', 'desc' => 'Upscale low-resolution photos up to 4x without losing detail.'],
                    ['title' => 'Magic Eraser', 'desc' => 'Remove unwanted objects or watermarks from any product image.'],
                    ['title' => 'Lighting Fix', 'desc' => 'Balance exposure and fix harsh shadows for a studio-quality look.'],
                    ['title' => 'Background Remover', 'desc' => 'Remove backgrounds instantly and keep the product clean and ready for catalogs.'],
                    ['title' => 'Image Compressor', 'desc' => 'Reduce image size for faster storefront loading while preserving quality.'],
                    ['title' => 'Product AI Lab', 'desc' => 'Generate high-converting product visuals and variations optimized for your store.'],
                ];
            @endphp
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 0;">
                @foreach(array_chunk($toolCards, 2) as $row)
                    <tr>
                        <td width="48%" style="background-color:#F9FAFB; border:1px solid #e5e7eb; border-radius:8px; padding:16px; vertical-align:top;">
                            <div class="feature-title">{{ $row[0]['title'] }}</div>
                            <div class="feature-desc">{{ $row[0]['desc'] }}</div>
                        </td>
                        <td width="4%"></td>
                        @if(isset($row[1]))
                            <td width="48%" style="background-color:#F9FAFB; border:1px solid #e5e7eb; border-radius:8px; padding:16px; vertical-align:top;">
                                <div class="feature-title">{{ $row[1]['title'] }}</div>
                                <div class="feature-desc">{{ $row[1]['desc'] }}</div>
                            </td>
                        @else
                            <td width="48%"></td>
                        @endif
                    </tr>
                    @if(!$loop->last)
                        <tr><td colspan="3" style="height:12px;"></td></tr>
                    @endif
                @endforeach
            </table>

            {{-- Getting started --}}
            <div class="details" style="margin-top: 24px;">
                <p style="margin: 0 0 16px; font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.8px;">Quick Start — 3 Steps</p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="30" valign="top" style="padding-top:2px;">
                            <div style="width:26px;height:26px;background-color:#468A9A;color:white;border-radius:50%;text-align:center;line-height:26px;font-size:12px;font-weight:800;">1</div>
                        </td>
                        <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;padding-bottom:12px;">
                            <strong style="color:#111827;">Open the app</strong> from your Shopify admin sidebar under <em>Apps → {{ $appName }}</em>.
                        </td>
                    </tr>
                    <tr>
                        <td width="30" valign="top" style="padding-top:2px;">
                            <div style="width:26px;height:26px;background-color:#468A9A;color:white;border-radius:50%;text-align:center;line-height:26px;font-size:12px;font-weight:800;">2</div>
                        </td>
                        <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;padding-bottom:12px;">
                            <strong style="color:#111827;">Upload a product photo</strong> or browse your existing Shopify product images.
                        </td>
                    </tr>
                    <tr>
                        <td width="30" valign="top" style="padding-top:2px;">
                            <div style="width:26px;height:26px;background-color:#468A9A;color:white;border-radius:50%;text-align:center;line-height:26px;font-size:12px;font-weight:800;">3</div>
                        </td>
                        <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;">
                            <strong style="color:#111827;">Pick an AI tool</strong>, apply it with one click, and save the result back to your store.
                        </td>
                    </tr>
                </table>
            </div>

            {{-- CTA --}}
            <div style="text-align: center;">
                <a href="{{ url('/') }}" class="button">Open {{ $appName }} →</a>
            </div>

            <div class="signature">
                <p style="margin: 4px 0;">Regards,</p>
                <p style="margin: 4px 0; font-weight: 600; color: #111827;">The {{ $appName }} Team</p>
            </div>
        </div>

        {{-- ── FOOTER ── --}}
        <div class="footer">
            @php $footerText = \App\Models\SiteSetting::get(\App\Models\SiteSetting::KEY_FOOTER_TEXT); @endphp
            @if($footerText)
                <p style="margin: 4px 0;">{{ $footerText }}</p>
            @else
                <p style="margin: 4px 0;">You're receiving this email because you recently installed <strong>{{ $appName }}</strong> on your Shopify store.</p>
            @endif

            @php $socialLinks = \App\Models\SiteSetting::getSocialLinks(); @endphp
            @if(!empty($socialLinks))
                <p style="margin: 12px 0 4px;">
                    @foreach($socialLinks as $platform => $url)
                        <a href="{{ $url }}" target="_blank" style="display:inline-block;margin:0 6px;font-size:12px;color:#468A9A;text-decoration:none;">{{ ucfirst($platform) }}</a>
                    @endforeach
                </p>
            @endif

            <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">&copy; {{ date('Y') }} {{ $appName }}. All rights reserved.</p>
        </div>

    </div>
</body>
</html>
