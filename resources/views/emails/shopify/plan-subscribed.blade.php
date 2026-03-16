<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
        .header { background: #468A9A; color: white; padding: 40px 30px; text-align: center; }
        .header p { margin: 8px 0 0; font-size: 15px; opacity: 0.9; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
        .plan-hero { background: linear-gradient(135deg, rgba(70,138,154,0.08) 0%, rgba(70,138,154,0.04) 100%); border: 1px solid rgba(70,138,154,0.2); border-radius: 12px; padding: 28px 24px; margin: 20px 0; text-align: center; }
        .plan-name { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .plan-price { font-size: 32px; font-weight: 800; color: #468A9A; margin: 0; }
        .plan-price span { font-size: 16px; font-weight: 500; color: #6b7280; }
        .plan-credits { display: inline-block; background-color: rgba(255, 122, 48, 0.1); border: 1px solid rgba(255, 122, 48, 0.25); color: #c2440e; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 6px; margin-top: 12px; }
        .trial-badge { display: inline-block; background-color: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 4px; margin-top: 8px; }
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; margin: 24px 0; overflow: hidden; }
        .detail-row { padding: 12px 20px; }
        .detail-row + .detail-row { border-top: 1px solid rgba(70, 138, 154, 0.12); }
        .detail-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px; }
        .detail-value { font-size: 14px; font-weight: 500; color: #111827; line-height: 1.5; }
        .button { display: inline-block; padding: 14px 36px; background: #468A9A; color: white !important; text-decoration: none; border-radius: 8px; margin: 8px 0 24px; font-weight: 600; font-size: 15px; }
        .notice { background-color: rgba(70, 138, 154, 0.06); border-left: 3px solid #468A9A; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 24px 0; }
        .notice p { margin: 0; font-size: 13px; color: #374151; line-height: 1.6; }
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
            <h1>Plan Activated</h1>
            <p>Your subscription is now active</p>
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

            <p>Your {{ $planName }} plan is active. You now have <strong>{{ number_format($planCredits) }} credits/month</strong> for professional product visuals.</p>

            <div class="plan-hero">
                <div class="plan-name">{{ $planName }}</div>
                <div class="plan-price">
                    ${{ $planPrice }}<span>/month</span>
                </div>
                <span class="plan-credits">{{ number_format($planCredits) }} Credits / Month</span>
                @if($trialDays > 0)
                    <div>
                        <span class="trial-badge">✓ {{ $trialDays }}-day free trial</span>
                    </div>
                @endif
            </div>

            <div class="details">
                <div class="detail-row">
                    <div class="detail-label">Billing</div>
                    <div class="detail-value">Automatic • Cancel anytime</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Monthly Credits</div>
                    <div class="detail-value">{{ number_format($planCredits) }} credits</div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/') }}" class="button">Start Creating</a>
            </div>

            <p class="signature">
                Regards,<br>
                <strong>The {{ $appName }} Team</strong>
            </p>

        </div>

        <div class="footer">
            {{ $appName }} · Billing managed by Shopify
        </div>

    </div>
</body>
</html>
