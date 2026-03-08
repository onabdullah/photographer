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
        .success-badge { display: inline-block; background-color: rgba(34, 197, 94, 0.12); color: #15803d; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 50px; margin-bottom: 20px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); padding: 20px 24px; border-radius: 8px; margin: 24px 0; }
        .details p { margin: 8px 0; font-size: 14px; color: #374151; }
        .details p strong { color: #111827; }
        .purpose-label { display: inline-block; background-color: rgba(255, 122, 48, 0.1); color: #c2440e; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 5px; }
        .signature { margin-top: 32px; color: #6b7280; line-height: 1.5; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 24px 30px; text-align: center; font-size: 13px; color: #6B7280; line-height: 1.6; }
        h1 { margin: 0; font-size: 26px; font-weight: 700; }
        p { margin: 12px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SMTP Test</h1>
            <p>{{ config('app.name') }} · Admin Panel</p>
        </div>
        <div class="content">

            <div style="text-align: center; margin-bottom: 8px;">
                <span class="success-badge">✓ &nbsp;Delivery Confirmed</span>
            </div>

            <p class="greeting">Your SMTP configuration is working correctly.</p>

            <p>This test email confirms that outgoing mail is properly configured for the purpose shown below. Messages sent through this configuration will be delivered successfully.</p>

            <div class="details">
                <p><strong>Purpose:</strong> &nbsp;<span class="purpose-label">{{ $purpose }}</span></p>
                <p><strong>From Address:</strong> &nbsp;{{ $fromAddress }}</p>
                @if($fromName)
                <p><strong>From Name:</strong> &nbsp;{{ $fromName }}</p>
                @endif
                <p><strong>Tested At:</strong> &nbsp;{{ now()->format('D, d M Y · H:i T') }}</p>
            </div>

            <div class="signature">
                <p style="margin: 4px 0;">Regards,</p>
                <p style="margin: 4px 0; font-weight: 600; color: #111827;">{{ config('app.name') }} System</p>
            </div>
        </div>
        <div class="footer">
            <p style="margin: 4px 0;">This is an automated test message from the <strong>{{ config('app.name') }}</strong> admin panel.</p>
            <p style="margin: 4px 0; color: #9ca3af; font-size: 12px;">Do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
