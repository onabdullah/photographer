<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #468A9A; color: #fff; padding: 32px 28px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 28px; }
        .meta { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; }
        .meta p { margin: 4px 0; font-size: 14px; }
        .details { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .row { padding: 10px 14px; }
        .row + .row { border-top: 1px solid #e5e7eb; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; margin-bottom: 3px; }
        .value { font-size: 14px; color: #111827; word-break: break-word; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 18px 28px; text-align: center; font-size: 12px; color: #6B7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Admin Activity Alert</h1>
            <p>{{ config('app.name') }} Security Notification</p>
        </div>

        <div class="content">
            <div class="meta">
                <p><strong>Action:</strong> {{ $action }}</p>
                <p><strong>Performed By:</strong> {{ $actorName }}@if($actorEmail) ({{ $actorEmail }})@endif</p>
                <p><strong>Time:</strong> {{ $occurredAt }}</p>
            </div>

            @if(!empty($details))
                <div class="details">
                    @foreach($details as $key => $value)
                        <div class="row">
                            <div class="label">{{ str_replace('_', ' ', $key) }}</div>
                            <div class="value">{{ is_scalar($value) || $value === null ? ($value ?? 'N/A') : json_encode($value) }}</div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>

        <div class="footer">
            This is an automated alert from {{ config('app.name') }}. Please review this activity if unexpected.
        </div>
    </div>
</body>
</html>
