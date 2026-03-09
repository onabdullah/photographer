<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #468A9A; color: white; padding: 34px 30px; text-align: center; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.88; }
        .content { background-color: #ffffff; padding: 34px 30px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 16px; }
        .badge { display: inline-block; background-color: rgba(70, 138, 154, 0.1); border: 1px solid rgba(70, 138, 154, 0.25); color: #316678; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 8px; margin: 0 0 18px; }
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; margin: 18px 0 0; overflow: hidden; }
        .detail-row { padding: 12px 20px; }
        .detail-row + .detail-row { border-top: 1px solid rgba(70, 138, 154, 0.12); }
        .detail-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px; }
        .detail-value { font-size: 14px; font-weight: 500; color: #111827; line-height: 1.5; word-break: break-word; overflow-wrap: break-word; }
        .delta-positive { color: #15803d; font-weight: 700; }
        .delta-negative { color: #b42318; font-weight: 700; }
        .delta-neutral { color: #6b7280; font-weight: 700; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6B7280; }
        h1 { margin: 0; font-size: 24px; font-weight: 700; }
        p { margin: 10px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">

        <div class="header">
            <h1>Merchant Credits Updated</h1>
            <p>{{ config('app.name') }} · Admin Notification</p>
        </div>

        <div class="content">
            <p class="greeting">A merchant credit balance has been updated from the admin panel.</p>

            <div style="text-align: center;">
                <span class="badge">{{ $shopName }}</span>
            </div>

            <div class="details">
                <div class="detail-row">
                    <div class="detail-label">Store</div>
                    <div class="detail-value">{{ $shopName }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Shop Domain</div>
                    <div class="detail-value">{{ $shopDomain }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Previous Credits</div>
                    <div class="detail-value">{{ number_format($previousCredits) }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">New Credits</div>
                    <div class="detail-value">{{ number_format($newCredits) }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Change</div>
                    <div class="detail-value">
                        @if($creditDelta > 0)
                            <span class="delta-positive">+{{ number_format($creditDelta) }}</span>
                        @elseif($creditDelta < 0)
                            <span class="delta-negative">{{ number_format($creditDelta) }}</span>
                        @else
                            <span class="delta-neutral">0</span>
                        @endif
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Updated By</div>
                    <div class="detail-value">{{ $changedByName }}@if($changedByEmail) ({{ $changedByEmail }})@endif</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Updated At</div>
                    <div class="detail-value">{{ $changedAt }}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            This is an automated notification from {{ config('app.name') }}.
        </div>

    </div>
</body>
</html>
