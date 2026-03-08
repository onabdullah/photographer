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
        .badge-new { display: inline-block; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.25); color: #15803d; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px; margin: 4px 0 20px; }
        .badge-reinstall { display: inline-block; background-color: rgba(70, 138, 154, 0.1); border: 1px solid rgba(70, 138, 154, 0.25); color: #316678; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px; margin: 4px 0 20px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; margin: 24px 0; overflow: hidden; }
        .detail-row { padding: 12px 24px; }
        .detail-row + .detail-row { border-top: 1px solid rgba(70, 138, 154, 0.12); }
        .detail-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px; }
        .detail-value { font-size: 14px; font-weight: 500; color: #111827; line-height: 1.5; word-break: break-word; overflow-wrap: break-word; }
        .detail-value.muted { font-size: 12px; font-weight: 400; color: #6b7280; }
        .credits-chip { display: inline-block; background-color: rgba(255, 122, 48, 0.1); border: 1px solid rgba(255, 122, 48, 0.25); color: #c2440e; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; }
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

        <div class="header">
            <h1>{{ $isReinstall ? 'App Reinstalled' : 'New App Install' }}</h1>
            <p>{{ config('app.name') }} · Admin Notification</p>
        </div>

        <div class="content">

            <div style="text-align: center; margin-bottom: 8px;">
                @if($isReinstall)
                    <span class="badge-reinstall">↩ &nbsp;Reinstall — {{ $shopDomain }}</span>
                @else
                    <span class="badge-new">✓ &nbsp;New Install — {{ $shopDomain }}</span>
                @endif
            </div>

            <p class="greeting">A store has {{ $isReinstall ? 'reinstalled' : 'installed' }} <strong>{{ config('app.name') }}</strong>.</p>

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
                        {{ $ownerName !== 'N/A' ? $ownerName : '' }}
                    </div>
                    @if($merchantEmail)
                        <div class="detail-value muted">{{ $merchantEmail }}</div>
                    @endif
                </div>

                <div class="detail-row">
                    <div class="detail-label">Country</div>
                    <div class="detail-value">
                        @if($country)
                            {{ $country }}
                        @else
                            <span class="na-chip">Not provided</span>
                        @endif
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Credits Granted</div>
                    <div class="detail-value">
                        @if($creditsGranted > 0)
                            <span class="credits-chip">🎁 &nbsp;{{ $creditsGranted }} credits</span>
                        @else
                            <span class="na-chip">None (existing balance retained)</span>
                        @endif
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Install Type</div>
                    <div class="detail-value">{{ $isReinstall ? 'Reinstall' : 'First Install' }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Installed At</div>
                    <div class="detail-value">{{ $installedAt }}</div>
                </div>

            </div>

            <div class="notice">
                <p>
                    @if($isReinstall)
                        This store had previously installed the app. Their existing credit balance was retained and <strong>no additional credits</strong> were granted.
                    @else
                        This is a brand new installation. The store owner has been sent a welcome email with their <strong>{{ $creditsGranted }} free credits</strong>.
                    @endif
                </p>
            </div>

            <div class="signature">
                <p style="margin: 4px 0;">Regards,</p>
                <p style="margin: 4px 0; font-weight: 600; color: #111827;">{{ config('app.name') }} System</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 4px 0;">This is an automated install notification from <strong>{{ config('app.name') }}</strong>.</p>
            <p style="margin: 4px 0; color: #9ca3af; font-size: 12px;">Do not reply to this email.</p>
        </div>

    </div>
</body>
</html>
