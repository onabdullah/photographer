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
        .action-badge { display: inline-block; background: rgba(70, 138, 154, 0.12); color: #1f5f6e; border: 1px solid rgba(70, 138, 154, 0.3); font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px; letter-spacing: 0.2px; }
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
            <div style="text-align:center;">
                <span class="action-badge">{{ $action }}</span>
            </div>
            <div class="meta">
                <p><strong>Action:</strong> {{ $action }}</p>
                <p><strong>Performed By:</strong> {{ $actorName }}@if($actorEmail) ({{ $actorEmail }})@endif</p>
                <p><strong>Time:</strong> {{ $occurredAt }}</p>
            </div>

            @if(!empty($details))
                <div class="details">
                    @foreach($details as $key => $value)
                        @if(in_array($key, ['before', 'after'], true) && is_array($value))
                            <div class="row">
                                <div class="label">{{ $formatLabel($key) }}</div>
                                <div class="value">
                                    @if(empty($value))
                                        N/A
                                    @else
                                        @foreach($value as $field => $fieldValue)
                                            <div><strong>{{ $formatLabel((string) $field) }}:</strong> {{ $formatValue($fieldValue) }}</div>
                                        @endforeach
                                    @endif
                                </div>
                            </div>
                        @elseif(is_array($value))
                            <div class="row">
                                <div class="label">{{ $formatLabel((string) $key) }}</div>
                                <div class="value">
                                    @if(empty($value))
                                        N/A
                                    @elseif(array_is_list($value))
                                        {{ implode(', ', array_map(fn ($item) => $formatValue($item), $value)) }}
                                    @else
                                        @foreach($value as $field => $fieldValue)
                                            <div><strong>{{ $formatLabel((string) $field) }}:</strong> {{ $formatValue($fieldValue) }}</div>
                                        @endforeach
                                    @endif
                                </div>
                            </div>
                        @else
                            <div class="row">
                                <div class="label">{{ $formatLabel((string) $key) }}</div>
                                <div class="value">{{ $formatValue($value) }}</div>
                            </div>
                        @endif
                    @endforeach
                </div>
            @endif
            <p style="margin-top:24px; font-size:14px; color:#374151;">Regards,<br><strong>— The {{ config('app.name') }} Team</strong></p>
        </div>

        <div class="footer">
            This is an automated alert from {{ config('app.name') }}. Please review this activity if unexpected.
        </div>
    </div>
</body>
</html>
