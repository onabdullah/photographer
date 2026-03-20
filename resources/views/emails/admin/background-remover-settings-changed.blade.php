<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #10b981; color: #fff; padding: 32px 28px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 28px; }
        .badge { display: inline-block; background: rgba(16, 185, 129, 0.12); color: #065f46; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px; letter-spacing: 0.2px; }
        .meta { background-color: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; }
        .meta p { margin: 4px 0; font-size: 14px; }
        .changes-box { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
        .change-item { padding: 14px 16px; border-top: 1px solid #e5e7eb; }
        .change-item:first-child { border-top: none; }
        .field-name { font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
        .change-values { display: flex; gap: 12px; align-items: flex-start; }
        .value-box { flex: 1; background-color: #F9FAFB; padding: 10px 12px; border-radius: 6px; font-size: 13px; word-break: break-word; }
        .old-value { border-left: 3px solid #ef4444; }
        .new-value { border-left: 3px solid #10b981; }
        .arrow { color: #9ca3af; font-size: 12px; font-weight: 600; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 18px 28px; text-align: center; font-size: 12px; color: #6B7280; }
        .reset-note { background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: #92400e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Background Remover Settings</h1>
            <p>{{ $changeType }} — Security Notification</p>
        </div>

        <div class="content">
            <div style="text-align:center;">
                <span class="badge">{{ $changeType }}</span>
            </div>

            <div class="meta">
                <p><strong>Changed By:</strong> {{ $admin->name }}@if($admin->email) ({{ $admin->email }})@endif</p>
                <p><strong>Time:</strong> {{ $changedAt }}</p>
            </div>

            @if($isReset)
                <div class="reset-note">
                    ⚠️ All settings have been reset to their default configuration.
                </div>
            @endif

            @if(!empty($changes))
                <div class="changes-box">
                    @foreach($changes as $field => $change)
                        <div class="change-item">
                            <div class="field-name">{{ $formatLabel($field) }}</div>
                            <div class="change-values">
                                <div class="value-box old-value">
                                    <strong style="color: #991b1b;">Old:</strong> {{ $formatValue($change['old']) }}
                                </div>
                                <div class="arrow">→</div>
                                <div class="value-box new-value">
                                    <strong style="color: #065f46;">New:</strong> {{ $formatValue($change['new']) }}
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif

            <p style="margin-top:24px; font-size:14px; color:#374151;">If you did not authorize this change, please contact your system administrator immediately.</p>
            <p style="margin-top:8px; font-size:14px; color:#374151;">Regards,<br><strong>— The {{ config('app.name') }} Team</strong></p>
        </div>

        <div class="footer">
            This is an automated security notification from {{ config('app.name') }}.
        </div>
    </div>
</body>
</html>
