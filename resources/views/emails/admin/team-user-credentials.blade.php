<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
        .header { background: #468A9A; color: #fff; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin: 16px 0; background: #f9fafb; }
        .badge { display:inline-block; background:#111827; color:#fff; padding:3px 10px; border-radius:6px; font-size:12px; font-weight:600; }
        .security { border-left: 3px solid #468A9A; background: rgba(70, 138, 154, 0.06); padding: 12px 14px; border-radius: 0 6px 6px 0; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 18px 28px; text-align: center; font-size: 12px; color: #6B7280; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h2 style="margin:0;">Your Team Access</h2>
        <p style="margin:8px 0 0; opacity:.9;">Welcome to {{ config('app.name') }}</p>
    </div>
    <div class="content">
        <p>Hello <strong>{{ $userName }}</strong>,</p>
        <p>Your team account has been created. Please use the credentials below to sign in.</p>

        <div class="card">
            <p style="margin:4px 0;"><strong>Login Email:</strong> {{ $userEmail }}</p>
            <p style="margin:4px 0;"><strong>Temporary Password:</strong> <span class="badge">{{ $temporaryPassword }}</span></p>
            <p style="margin:4px 0;"><strong>Assigned Role:</strong> {{ $customRoleName }}</p>
            <p style="margin:4px 0;"><strong>Issued At:</strong> {{ $sentAt }}</p>
        </div>

        <div class="security">
            <p style="margin:0 0 8px;"><strong>Security Instructions</strong></p>
            <p style="margin:0;">1. Sign in immediately and change your password.</p>
            <p style="margin:0;">2. Use a unique password with at least 12 characters.</p>
            <p style="margin:0;">3. Enable two-factor authentication from Settings.</p>
            <p style="margin:0;">4. Do not share credentials over chat or email.</p>
        </div>

        <p style="margin-top:18px;">If this account was not expected, contact your administrator right away.</p>

        <p style="margin-top:24px; font-size:14px; color:#374151;">Regards,<br><strong>— The {{ config('app.name') }} Team</strong></p>
    </div>
    <div class="footer">
        <p style="margin:4px 0;">This is an automated notification from <strong>{{ config('app.name') }}</strong>.</p>
        <p style="margin:4px 0; color:#9ca3af;">Keep your credentials safe and never share them.</p>
    </div>
</div>
</body>
</html>
