<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
        .header { background: #468A9A; color: white; padding: 40px 30px; text-align: center; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
        .badge-plan { display: inline-block; background-color: rgba(70, 138, 154, 0.1); border: 1px solid rgba(70, 138, 154, 0.25); color: #316678; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px; margin: 4px 0 20px; }
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; margin: 24px 0; overflow: hidden; }
        .detail-row { padding: 12px 24px; }
        .detail-row + .detail-row { border-top: 1px solid rgba(70, 138, 154, 0.12); }
        .detail-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px; }
        .detail-value { font-size: 14px; font-weight: 500; color: #111827; line-height: 1.5; word-break: break-word; overflow-wrap: break-word; }
        .detail-value.muted { font-size: 12px; font-weight: 400; color: #6b7280; }
        .credits-chip { display: inline-block; background-color: rgba(255, 122, 48, 0.1); border: 1px solid rgba(255, 122, 48, 0.25); color: #c2440e; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; }
        .plan-chip { display: inline-block; background-color: rgba(70, 138, 154, 0.12); border: 1px solid rgba(70, 138, 154, 0.3); color: #316678; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; }
        .na-chip { display: inline-block; color: #9ca3af; font-size: 13px; font-style: italic; }
        .notice { background-color: rgba(70, 138, 154, 0.06); border-left: 3px solid #468A9A; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 24px 0 0; }
        .notice p { margin: 0; font-size: 13px; color: #374151; line-height: 1.6; }
        .signature { margin-top: 32px; color: #6b7280; line-height: 1.5; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 24px 30px; text-align: center; font-size: 13px; color: #6B7280; line-height: 1.6; }
        h1 { margin: 0; font-size: 26px; font-weight: 700; }
        p { margin: 12px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">

        {{-- ── HEADER ── --}}
        <div class="header">
            <h1>Plan Subscribed</h1>
            <p>{{ config('app.name') }} · Admin Notification</p>
        </div>

        {{-- ── CONTENT ── --}}
        <div class="content">

            <div style="text-align: center; margin-bottom: 20px;">
                <span class="badge-plan">💳 &nbsp;{{ $planName }} — ${{ $planPrice }}/mo</span>
            </div>

            <p class="greeting">A merchant has activated a billing plan on <strong>{{ config('app.name') }}</strong>.</p>

            {{-- Merchant & Plan details ─────────────────────────── --}}
            <div class="details">

                <div class="detail-row">
                    <div class="detail-label">Shop Domain</div>
                    <div class="detail-value">{{ $shopDomain }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Store Name</div>
                    <div class="detail-value">
                        @if($shopName && $shopName !== $shopDomain)
                            {{ $shopName }}
                        @else
                            <span class="na-chip">Not provided</span>
                        @endif
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Store Owner</div>
                    <div class="detail-value">
                        @if($ownerName)
                            {{ $ownerName }}
                        @else
                            <span class="na-chip">Not provided</span>
                        @endif
                    </div>
                    @if($merchantEmail)
                        <div class="detail-value muted">{{ $merchantEmail }}</div>
                    @endif
                </div>

                <div class="detail-row">
                    <div class="detail-label">Plan</div>
                    <div class="detail-value">
                        <span class="plan-chip">{{ $planName }}</span>
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Price</div>
                    <div class="detail-value">${{ $planPrice }} / month</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Monthly Credits</div>
                    <div class="detail-value">
                        <span class="credits-chip">{{ number_format($planCredits) }} credits / mo</span>
                    </div>
                </div>

                @if($chargeId)
                <div class="detail-row">
                    <div class="detail-label">Shopify Charge ID</div>
                    <div class="detail-value muted">{{ $chargeId }}</div>
                </div>
                @endif

                <div class="detail-row">
                    <div class="detail-label">Subscribed At</div>
                    <div class="detail-value muted">{{ $subscribedAt }}</div>
                </div>

            </div>

            <div class="notice">
                <p>This is an automated notification. The merchant's plan has been activated and their monthly credits have been updated automatically.</p>
            </div>

            <p class="signature">
                — {{ config('app.name') }} Billing System
            </p>

        </div>

        {{-- ── FOOTER ── --}}
        <div class="footer">
            {{ config('app.name') }} · Admin Notification<br>
            This email was sent because a billing plan was activated on your platform.
        </div>

    </div>
</body>
</html>
