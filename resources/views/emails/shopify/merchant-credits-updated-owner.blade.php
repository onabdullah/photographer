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
        .tips { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; padding: 18px 20px; margin: 20px 0 0; }
        .tips h3 { margin: 0 0 10px; font-size: 15px; font-weight: 700; color: #111827; }
        .tips ul { margin: 0; padding-left: 18px; }
        .tips li { margin: 8px 0; font-size: 14px; color: #374151; line-height: 1.55; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6B7280; }
        h1 { margin: 0; font-size: 24px; font-weight: 700; }
        p { margin: 10px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">

        <div class="header">
            <h1>Credits Updated</h1>
            <p>Your new credits are now available and ready to power your next round of product visuals.</p>
        </div>

        <div class="content">
            <p class="greeting">Hello <strong>{{ $shopName }}</strong>,</p>
            <p style="margin:0 0 16px; font-size:15px; color:#374151;">Your store credit balance has been updated successfully. You can keep creating without interruption and move faster on the products that matter most.</p>

            <div style="text-align: center;">
                <span class="badge">{{ $shopName }}</span>
            </div>

            <div class="details">
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
                    <div class="detail-label">Updated At</div>
                    <div class="detail-value">{{ $changedAt }}</div>
                </div>
            </div>

            <div class="tips">
                <h3>How to get more value from these credits</h3>
                <ul>
                    <li>Prioritize your top-selling products, hero images, and new launches first.</li>
                    <li>Save and reuse prompts that produce strong results so you spend fewer credits testing from scratch.</li>
                    <li>Create images in batches for collections or campaigns to stay consistent and save time.</li>
                    <li>Use your best-performing visuals on product pages, ads, and social posts to stretch the business impact of every credit.</li>
                </ul>
            </div>

            <p style="margin-top:24px; font-size:14px; color:#374151;">Regards,<br><strong>— The {{ config('app.name') }} Team</strong></p>
        </div>

        <div class="footer">
            This is an automated notification from {{ config('app.name') }}. We appreciate your business and are here to help you grow.
        </div>

    </div>
</body>
</html>
