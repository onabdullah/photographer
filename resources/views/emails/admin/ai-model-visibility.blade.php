<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #468A9A; color: white; padding: 40px 30px; text-align: center; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
        .badge-show { display: inline-block; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.25); color: #15803d; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px; margin: 4px 0 20px; }
        .badge-hide { display: inline-block; background-color: rgba(255, 122, 48, 0.1); border: 1px solid rgba(255, 122, 48, 0.3); color: #c2440e; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px; margin: 4px 0 20px; }
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; margin: 24px 0; overflow: hidden; }
        .detail-row { padding: 12px 24px; }
        .detail-row + .detail-row { border-top: 1px solid rgba(70, 138, 154, 0.12); }
        .detail-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px; }
        .detail-value { font-size: 14px; font-weight: 500; color: #111827; line-height: 1.5; word-break: break-word; overflow-wrap: break-word; }
        .detail-value.muted { font-size: 12px; font-weight: 400; color: #6b7280; }
        .status-show { display: inline-block; background-color: rgba(34, 197, 94, 0.1); color: #15803d; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; }
        .status-hide { display: inline-block; background-color: rgba(255, 122, 48, 0.1); color: #c2440e; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; }
        .notice-show { background-color: rgba(70, 138, 154, 0.06); border-left: 3px solid #468A9A; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 24px 0 0; }
        .notice-hide { background-color: rgba(255, 122, 48, 0.06); border-left: 3px solid #FF7A30; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 24px 0 0; }
        .notice-show p, .notice-hide p { margin: 0; font-size: 13px; color: #374151; line-height: 1.6; }
        .signature { margin-top: 32px; color: #6b7280; line-height: 1.5; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 24px 30px; text-align: center; font-size: 13px; color: #6B7280; line-height: 1.6; }
        h1 { margin: 0; font-size: 26px; font-weight: 700; }
        p { margin: 12px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tool Visibility Changed</h1>
            <p>{{ config('app.name') }} · Admin Panel</p>
        </div>
        <div class="content">

            <div style="text-align: center; margin-bottom: 8px;">
                @if($visible)
                    <span class="badge-show">✓ &nbsp;{{ $toolLabel }} — Shown on Store</span>
                @else
                    <span class="badge-hide">✕ &nbsp;{{ $toolLabel }} — Hidden from Store</span>
                @endif
            </div>

            <p class="greeting">Hello <strong>{{ $user->name }}</strong>,</p>

            @if($visible)
                <p>The <strong>{{ $toolLabel }}</strong> tool has been made visible on the store. Merchants can now access and use this tool from the app.</p>
            @else
                <p>The <strong>{{ $toolLabel }}</strong> tool has been hidden from the store. Merchants will no longer see or be able to access this tool until it is made visible again.</p>
            @endif

            <div class="details">
                <div class="detail-row">
                    <div class="detail-label">Tool</div>
                    <div class="detail-value">{{ $toolLabel }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Action</div>
                    <div class="detail-value">
                        @if($visible)
                            <span class="status-show">Shown on Store</span>
                        @else
                            <span class="status-hide">Hidden from Store</span>
                        @endif
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Changed By</div>
                    <div class="detail-value">{{ $user->name }}</div>
                    <div class="detail-value muted">{{ $user->email }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">IP Address</div>
                    <div class="detail-value">{{ $ip }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Browser / Device</div>
                    <div class="detail-value muted">{{ $userAgent }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Changed At</div>
                    <div class="detail-value">{{ $changedAt }}</div>
                </div>
            </div>

            @if($visible)
                <div class="notice-show">
                    <p>Merchants visiting <strong>{{ $toolLabel }}</strong> will now be able to access it from their store navigation. No further action is required.</p>
                </div>
            @else
                <div class="notice-hide">
                    <p>Merchants who visit the <strong>{{ $toolLabel }}</strong> URL will be automatically redirected to the dashboard. If you did not make this change, please investigate immediately.</p>
                </div>
            @endif

            <div class="signature">
                <p style="margin: 4px 0;">Regards,</p>
                <p style="margin: 4px 0; font-weight: 600; color: #111827;">{{ config('app.name') }} System</p>
            </div>
        </div>
        <div class="footer">
            <p style="margin: 4px 0;">This is an automated notification from the <strong>{{ config('app.name') }}</strong> admin panel.</p>
            <p style="margin: 4px 0; color: #9ca3af; font-size: 12px;">Do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
