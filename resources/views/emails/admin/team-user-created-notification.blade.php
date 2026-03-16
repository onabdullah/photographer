<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
        .header { background: #468A9A; color: #fff; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .details { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .row { padding: 10px 14px; }
        .row + .row { border-top: 1px solid #e5e7eb; }
        .label { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.6px; margin-bottom: 2px; }
        .value { font-size: 14px; color: #111827; }
        .signature { margin-top: 24px; font-size: 14px; color: #374151; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 18px 28px; text-align: center; font-size: 12px; color: #6B7280; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h2 style="margin:0;">Team User Added</h2>
        <p style="margin:8px 0 0; opacity:.9;">{{ config('app.name') }} Admin Notification</p>
    </div>
    <div class="content">
        <p>A new team user has been created in the admin panel.</p>
        <div class="details">
            <div class="row"><div class="label">User Name</div><div class="value">{{ $createdUserName }}</div></div>
            <div class="row"><div class="label">User Email</div><div class="value">{{ $createdUserEmail }}</div></div>
            <div class="row"><div class="label">Custom Role</div><div class="value">{{ $customRoleName }}</div></div>
            <div class="row"><div class="label">Status</div><div class="value">{{ ucfirst($createdUserStatus) }}</div></div>
            <div class="row"><div class="label">Created By</div><div class="value">{{ $createdByName }}@if($createdByEmail) ({{ $createdByEmail }})@endif</div></div>
            <div class="row"><div class="label">Created At</div><div class="value">{{ $createdAt }}</div></div>
        </div>

        <p class="signature">Regards,<br><strong>— The {{ config('app.name') }} Team</strong></p>
    </div>
    <div class="footer">
        <p style="margin:4px 0;">This is an automated notification from the <strong>{{ config('app.name') }}</strong> admin panel.</p>
        <p style="margin:4px 0; color:#9ca3af;">Do not reply to this email.</p>
    </div>
</div>
</body>
</html>
