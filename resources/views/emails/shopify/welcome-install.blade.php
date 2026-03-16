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
        .button { display: inline-block; padding: 14px 36px; background: #468A9A; color: white !important; text-decoration: none; border-radius: 8px; margin: 8px 0 24px; font-weight: 600; font-size: 15px; }
        .signature { margin-top: 12px; color: #6b7280; line-height: 1.5; }
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
            <p>Professional AI-powered product visuals for your store</p>
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

            <p>You now have access to {{ $appName }}. {{ $creditsGranted }} free credits are ready to use.</p>

            <div style="text-align: center; margin: 24px 0;">
                <span class="credits-badge">{{ $creditsGranted }} Free Credits</span>
            </div>

            <p style="font-weight: 600; color: #111827; margin: 20px 0;">Available Tools:</p>
            <div style="font-size: 14px; color: #374151; line-height: 1.8;">
                • AI Image Enhancement<br>
                • Image Upscaler<br>
                • Magic Eraser<br>
                • Lighting Fix<br>
                • Background Remover<br>
                • Image Compressor<br>
                • Product AI Lab
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/') }}" class="button">Launch Now</a>
            </div>

            <p class="signature">
                Regards,<br>
                <strong>The {{ $appName }} Team</strong>
            </p>
        </div>

        <div class="footer">
            {{ $appName }} · Questions? Reply to this email
        </div>

    </div>
</body>
</html>
