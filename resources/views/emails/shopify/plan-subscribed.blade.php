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
            <h1>Plan Activated</h1>
            <p>Your {{ $planName }} plan is now active. New credits are ready, and your store is set up to create more high-converting visuals.</p>
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

            <p>Your {{ $planName }} plan is now active. You now have <strong>{{ number_format($planCredits) }} professional product images</strong> available every month—enough to significantly outpace competitors while maintaining complete creative control.</p>

            <p style="font-size: 15px; color: #111827; font-weight: 500;">What this means for your business: unlimited professional visuals at a fraction of traditional studio costs, with zero equipment investment or scheduling delays.</p>

            {{-- ── Plan hero card ── --}}
            <div class="plan-hero">
                <div class="plan-name">{{ $planName }} Plan</div>
                <div class="plan-price">
                    ${{ $planPrice }}<span>/month</span>
                </div>
                <div>
                    <span class="plan-credits">{{ number_format($planCredits) }} Professional Images / Month</span>
                </div>
                @if($trialDays > 0)
                    <div>
                        <span class="trial-badge">✓ {{ $trialDays }}-day free trial included</span>
                    </div>
                @endif
                <div style="margin-top: 12px; font-size: 13px; color: #6b7280; font-weight: 600;">
                    = ${{ number_format((float)$planPrice / $planCredits, 2) }} per professional image
                </div>
            </div>

            {{-- ── Value Proposition ── --}}
            <div class="details" style="margin: 24px 0; background-color: rgba(34, 197, 94, 0.06); border-color: rgba(34, 197, 94, 0.15);">
                <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.7px; padding: 12px 20px 0;">Your Competitive Advantage Per Month</p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="50%" style="padding: 12px 20px; border-right: 1px solid rgba(34, 197, 94, 0.15); border-bottom: 1px solid rgba(34, 197, 94, 0.15);">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px;">Professional Images</div>
                            <div style="font-size: 18px; font-weight: 700; color: #15803d;">{{ number_format($planCredits) }}</div>
                        </td>
                        <td width="50%" style="padding: 12px 20px; border-bottom: 1px solid rgba(34, 197, 94, 0.15);">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px;">vs. Studio Cost</div>
                            <div style="font-size: 18px; font-weight: 700; color: #15803d;">${{ number_format($planCredits * 300) }}+</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%" style="padding: 12px 20px; border-right: 1px solid rgba(34, 197, 94, 0.15);">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px;">Creation Time</div>
                            <div style="font-size: 16px; font-weight: 700; color: #15803d;">Seconds</div>
                        </td>
                        <td width="50%" style="padding: 12px 20px;">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px;">vs. Studio Lead Time</div>
                            <div style="font-size: 16px; font-weight: 700; color: #15803d;">Weeks</div>
                        </td>
                    </tr>
                </table>
            </div>

            {{-- ── Subscription details ── --}}
            <div class="details">

                <div class="detail-row">
                    <div class="detail-label">Plan Activated</div>
                    <div class="detail-value">{{ $subscribedAt }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Monthly Credits Allocation</div>
                    <div class="detail-value"><strong>{{ number_format($planCredits) }} credits</strong> refreshed on every billing cycle</div>
                </div>

                @if($trialDays > 0)
                <div class="detail-row">
                    <div class="detail-label">Free Trial Period</div>
                    <div class="detail-value">{{ $trialDays }} days — start creating immediately, no charge until trial ends</div>
                </div>
                @endif

                <div class="detail-row">
                    <div class="detail-label">Billing & Cancellation</div>
                    <div class="detail-value">Managed securely by Shopify · Cancel anytime from your admin</div>
                </div>

            </div>

            {{-- ── What to do next ── --}}
            <div class="what-next">
                <h3>Maximizing Your Monthly Credits</h3>
                <div class="step">
                    <span class="step-num">1</span>
                    <strong>Prioritize your top-selling products</strong> — create professional variations for your highest-margin SKUs to drive maximum ROI.
                </div>
                <div class="step">
                    <span class="step-num">2</span>
                    <strong>Batch create strategically</strong> — plan your monthly image creation around product launches, seasonal campaigns, and inventory changes.
                </div>
                <div class="step">
                    <span class="step-num">3</span>
                    <strong>Test and optimize</strong> — use A/B testing with multiple visual styles to identify what resonates best with your customers.
                </div>
                <div class="step">
                    <span class="step-num">4</span>
                    <strong>Repurpose across channels</strong> — leverage these professional images for your website, social media, email campaigns, and paid ads.
                </div>
            </div>

            <div class="tips">
                <h3>Pro Strategy: Scaling Your Monthly Allocation</h3>
                <ul>
                    <li>Create {{ round($planCredits / 4) }} images per week for consistent visual updates across your store without pressure.</li>
                    <li>Save your highest-performing prompts and settings for instant replication across product categories.</li>
                    <li>Document which image styles drive highest engagement to optimize future creations.</li>
                    <li>If {{ number_format($planCredits) }} credits runs out mid-month, upgrade or purchase top-up packs instantly from your dashboard.</li>
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
                Regards,<br>
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
