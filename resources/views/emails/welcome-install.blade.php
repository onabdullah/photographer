<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to {{ $appName }}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

    <!-- Preheader text (hidden, shown in email preview) -->
    <div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
        You're all set! {{ $creditsGranted }} free AI credits are waiting for you inside {{ $appName }}. Start enhancing your product photos today.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <!-- Email card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

                    <!-- ───── HEADER ───── -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 48px;text-align:center;">
                            @if($appLogoUrl)
                                <img src="{{ $appLogoUrl }}" alt="{{ $appName }}" width="160" style="max-height:52px;width:auto;display:inline-block;">
                            @else
                                <div style="display:inline-block;">
                                    <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">{{ $appName }}</span>
                                </div>
                            @endif
                        </td>
                    </tr>

                    <!-- ───── HERO ───── -->
                    <tr>
                        <td style="padding:52px 48px 36px;text-align:center;border-bottom:1px solid #f0f0f5;">

                            <!-- Icon circle -->
                            <div style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;margin-bottom:28px;">
                                <span style="font-size:32px;line-height:72px;display:block;">✨</span>
                            </div>

                            <h1 style="margin:0 0 16px;font-size:30px;font-weight:800;color:#111827;line-height:1.25;letter-spacing:-0.5px;">
                                Welcome aboard,<br>
                                <span style="color:#5b4dbe;">
                                    @php
                                        $displayName = $shopName;
                                        // Remove .myshopify.com if present
                                        $displayName = preg_replace('/\.myshopify\.com$/i', '', $displayName);
                                        // Capitalize and clean
                                        $displayName = Str::title(str_replace(['-', '_', '.'], ' ', $displayName));
                                    @endphp
                                    {{ $displayName }}!
                                </span>
                            </h1>

                            <p style="margin:0 0 24px;font-size:17px;line-height:1.65;color:#4b5563;max-width:440px;display:inline-block;">
                                Thank you for installing <strong style="color:#111827;">{{ $appName }}</strong>.
                                You're now equipped with AI-powered tools to elevate your product photography — no editing skills required.
                            </p>

                            <!-- Credits badge -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 8px;">
                                <tr>
                                    <td style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:50px;padding:14px 32px;text-align:center;">
                                        <span style="font-size:15px;font-weight:700;color:#ffffff;white-space:nowrap;">
                                            🎁 &nbsp;{{ $creditsGranted }} Free AI Credits Added to Your Account
                                        </span>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- ───── FEATURES ───── -->
                    <tr>
                        <td style="padding:40px 48px 8px;">
                            <h2 style="margin:0 0 28px;font-size:18px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.3px;">
                                Everything you can do with {{ $appName }}
                            </h2>

                            <!-- Row 1 -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                                <tr>
                                    <!-- Feature 1 -->
                                    <td width="48%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 20px 18px;vertical-align:top;">
                                        <div style="font-size:24px;margin-bottom:10px;">🖼️</div>
                                        <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">AI Image Enhancement</div>
                                        <div style="font-size:13px;color:#6b7280;line-height:1.55;">Automatically sharpen, denoise, and colour-correct product images in seconds.</div>
                                    </td>
                                    <td width="4%"></td>
                                    <!-- Feature 2 -->
                                    <td width="48%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 20px 18px;vertical-align:top;">
                                        <div style="font-size:24px;margin-bottom:10px;">🔍</div>
                                        <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">Image Upscaler</div>
                                        <div style="font-size:13px;color:#6b7280;line-height:1.55;">Upscale low-res photos up to 4× without losing detail or introducing blur.</div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Row 2 -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                                <tr>
                                    <!-- Feature 3 -->
                                    <td width="48%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 20px 18px;vertical-align:top;">
                                        <div style="font-size:24px;margin-bottom:10px;">✏️</div>
                                        <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">Magic Eraser</div>
                                        <div style="font-size:13px;color:#6b7280;line-height:1.55;">Remove unwanted objects, watermarks, or distractions from any product photo.</div>
                                    </td>
                                    <td width="4%"></td>
                                    <!-- Feature 4 -->
                                    <td width="48%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 20px 18px;vertical-align:top;">
                                        <div style="font-size:24px;margin-bottom:10px;">💡</div>
                                        <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">Lighting Fix</div>
                                        <div style="font-size:13px;color:#6b7280;line-height:1.55;">Balance exposure and fix harsh shadows to give your photos a studio-quality look.</div>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- ───── CTA ───── -->
                    <tr>
                        <td style="padding:4px 48px 48px;text-align:center;">
                            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                                Your <strong style="color:#5b4dbe;">{{ $creditsGranted }} free credits</strong> are already waiting inside the app.
                                Use them to try any AI tool — no credit card required.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                                <tr>
                                    <td style="border-radius:8px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                                        <a href="{{ url('/') }}" target="_blank" style="display:inline-block;padding:16px 44px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;border-radius:8px;">
                                            Open {{ $appName }} →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- ───── GETTING STARTED STEPS ───── -->
                    <tr>
                        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:36px 48px;">
                            <h3 style="margin:0 0 20px;font-size:15px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.8px;">
                                Quick Start — 3 Steps
                            </h3>
                            <!-- Step 1 -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-top:1px;">
                                        <div style="width:26px;height:26px;border-radius:50%;background:#5b4dbe;text-align:center;line-height:26px;font-size:12px;font-weight:800;color:#ffffff;">1</div>
                                    </td>
                                    <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;">
                                        <strong style="color:#111827;">Open the app</strong> from your Shopify admin sidebar under <em>Apps → {{ $appName }}</em>.
                                    </td>
                                </tr>
                            </table>
                            <!-- Step 2 -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-top:1px;">
                                        <div style="width:26px;height:26px;border-radius:50%;background:#5b4dbe;text-align:center;line-height:26px;font-size:12px;font-weight:800;color:#ffffff;">2</div>
                                    </td>
                                    <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;">
                                        <strong style="color:#111827;">Upload a product photo</strong> or browse your existing Shopify product images.
                                    </td>
                                </tr>
                            </table>
                            <!-- Step 3 -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="36" valign="top" style="padding-top:1px;">
                                        <div style="width:26px;height:26px;border-radius:50%;background:#5b4dbe;text-align:center;line-height:26px;font-size:12px;font-weight:800;color:#ffffff;">3</div>
                                    </td>
                                    <td style="padding-left:12px;font-size:14px;color:#374151;line-height:1.55;">
                                        <strong style="color:#111827;">Pick an AI tool</strong>, apply it with one click, and save the enhanced image back to your store.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ───── SUPPORT ───── -->
                    <tr>
                        <td style="padding:32px 48px 36px;text-align:center;">
                            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.65;">
                                Need help? Our team is here for you.
                                Reply to this email anytime or visit our support page — we typically respond within a few hours.
                            </p>
                        </td>
                    </tr>

                    <!-- ───── FOOTER ───── -->
                    <tr>
                        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:28px 48px;text-align:center;border-radius:0 0 12px 12px;">
                            @if($appLogoUrl)
                                <img src="{{ $appLogoUrl }}" alt="{{ $appName }}" width="100" style="max-height:28px;width:auto;display:inline-block;margin-bottom:12px;opacity:0.6;">
                                <br>
                            @else
                                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#9ca3af;">{{ $appName }}</p>
                            @endif

                            @php $footerText = \App\Models\SiteSetting::get(\App\Models\SiteSetting::KEY_FOOTER_TEXT); @endphp
                            @if($footerText)
                                <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;line-height:1.6;">{{ $footerText }}</p>
                            @else
                                <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;line-height:1.6;">
                                    You're receiving this email because you recently installed {{ $appName }} on your Shopify store.
                                </p>
                            @endif

                            @php $socialLinks = \App\Models\SiteSetting::getSocialLinks(); @endphp
                            @if(!empty($socialLinks))
                                <p style="margin:0 0 12px;">
                                    @foreach($socialLinks as $platform => $url)
                                        <a href="{{ $url }}" target="_blank" style="display:inline-block;margin:0 6px;font-size:12px;color:#6b7280;text-decoration:none;">{{ ucfirst($platform) }}</a>
                                    @endforeach
                                </p>
                            @endif

                            <p style="margin:0;font-size:11px;color:#d1d5db;">
                                &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- /Email card -->

            </td>
        </tr>
    </table>

</body>
</html>
