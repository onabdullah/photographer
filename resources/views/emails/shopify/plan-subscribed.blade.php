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
        .what-next { margin: 28px 0 0; }
        .what-next h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 12px; }
        .step { display: flex; align-items: flex-start; margin: 10px 0; font-size: 14px; color: #374151; line-height: 1.5; }
        .step-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #468A9A; color: white; border-radius: 50%; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-right: 10px; margin-top: 1px; }
        .tips { background-color: #fff7ed; border: 1px solid rgba(255,122,48,0.2); border-radius: 10px; padding: 20px 18px; margin: 24px 0; }
        .tips h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 10px; }
        .tips ul { margin: 0; padding-left: 18px; color: #374151; }
        .tips li { margin: 8px 0; font-size: 14px; line-height: 1.55; }
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

        {{-- ── HEADER ── --}}
        <div class="header">
            @if($appLogoUrl)
                <img src="{{ $appLogoUrl }}" alt="{{ $appName }}" style="max-height: 44px; width: auto; display: inline-block; margin-bottom: 16px;"><br>
            @endif
            <h1>Congratulations 🎉</h1>
            <p>Thank you for upgrading to {{ $planName }}. Your credits are live and your store is ready to grow.</p>
        </div>

        {{-- ── CONTENT ── --}}
        <div class="content">

            <p class="greeting">
                Hello
                @php
                    $displayName = $shopName;
                    $displayName = preg_replace('/\.myshopify\.com$/i', '', $displayName);
                    $displayName = \Illuminate\Support\Str::title(str_replace(['-', '_', '.'], ' ', $displayName));
                @endphp
                <strong>{{ $displayName }}</strong>,
            </p>

            <p>Thank you for choosing <strong>{{ $appName }}</strong>. Your subscription is confirmed, your plan is active, and you can start creating conversion-ready product visuals right away.</p>

            {{-- ── Plan hero card ── --}}
            <div class="plan-hero">
                <div class="plan-name">{{ $planName }}</div>
                <div class="plan-price">
                    ${{ $planPrice }}<span>/month</span>
                </div>
                <div>
                    <span class="plan-credits">{{ number_format($planCredits) }} AI Credits / month</span>
                </div>
                @if($trialDays > 0)
                    <div>
                        <span class="trial-badge">✓ {{ $trialDays }}-day free trial included</span>
                    </div>
                @endif
            </div>

            {{-- ── Subscription details ── --}}
            <div class="details">

                <div class="detail-row">
                    <div class="detail-label">Plan Activated</div>
                    <div class="detail-value">{{ $subscribedAt }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Monthly Credits</div>
                    <div class="detail-value">{{ number_format($planCredits) }} credits refreshed every billing cycle</div>
                </div>

                @if($trialDays > 0)
                <div class="detail-row">
                    <div class="detail-label">Free Trial Period</div>
                    <div class="detail-value">{{ $trialDays }} days — no charge until trial ends</div>
                </div>
                @endif

                <div class="detail-row">
                    <div class="detail-label">Billing</div>
                    <div class="detail-value">Managed automatically by Shopify · Cancel anytime</div>
                </div>

            </div>

            {{-- ── What to do next ── --}}
            <div class="what-next">
                <h3>What to do next</h3>
                <div class="step">
                    <span class="step-num">1</span>
                    Open your store's <strong>{{ $appName }}</strong> app and head to the AI Studio.
                </div>
                <div class="step">
                    <span class="step-num">2</span>
                    Generate professional product photos — your {{ number_format($planCredits) }} monthly credits are already waiting.
                </div>
                <div class="step">
                    <span class="step-num">3</span>
                    Need more credits mid-month? Pick up a top-up pack from the Plans &amp; Billing page.
                </div>
            </div>

            <div class="tips">
                <h3>Tips to save credits and grow faster</h3>
                <ul>
                    <li>Start with your highest-margin or best-selling products first so each credit has a stronger sales impact.</li>
                    <li>Reuse winning prompts, backgrounds, and styles across similar products instead of testing too many variations.</li>
                    <li>Batch-create visuals for seasonal launches and new arrivals to keep your storefront fresh without wasting time.</li>
                    <li>Use top-up packs only when you need them, and let your monthly plan cover your steady day-to-day content flow.</li>
                </ul>
            </div>

            {{-- ── CTA ── --}}
            <div style="text-align: center; margin: 32px 0 12px;">
                <a href="{{ config('app.url') }}" class="button">Open {{ $appName }}</a>
            </div>

            <div class="notice">
                <p>Your billing is handled securely by Shopify. You can manage or cancel your subscription at any time from your Shopify admin under <em>Apps → {{ $appName }} → Billing</em>. If you want help getting more from your credits, just reply to this email.</p>
            </div>

            <p class="signature">
                Thanks again for trusting us with your store growth,<br>
                <strong>The {{ $appName }} Team</strong>
            </p>

        </div>

        {{-- ── FOOTER ── --}}
        <div class="footer">
            {{ $appName }} · You're receiving this because you subscribed to a plan.<br>
            Questions? Reply to this email — we're happy to help.
        </div>

    </div>
</body>
</html>
