<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #468A9A; color: #fff; padding: 32px 28px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 28px; }
        .lead { font-size: 16px; color: #111827; margin: 0 0 16px; }
        .notice { border-radius: 10px; padding: 14px 16px; margin: 14px 0 20px; font-size: 14px; border: 1px solid #E4E7EC; }
        .notice-warning { background: #FFF7ED; border-color: #FED7AA; color: #9A3412; }
        .notice-danger { background: #FEF2F2; border-color: #FECACA; color: #991B1B; }
        .details { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; }
        .row { padding: 10px 14px; }
        .row + .row { border-top: 1px solid #E2E8F0; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748B; margin-bottom: 3px; }
        .value { font-size: 14px; color: #0F172A; font-weight: 600; }
        .cta { margin-top: 20px; font-size: 14px; color: #334155; }
        .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 28px; text-align: center; font-size: 12px; color: #64748B; }
        .strong { color: #0F172A; font-weight: 700; }
    </style>
</head>
<body>
    @php
        $isCritical = $thresholdKey === 'five_remaining';
    @endphp

    <div class="container">
        <div class="header">
            <h1>Credit Usage Update</h1>
            <p>{{ config('app.name') }} Account Notice</p>
        </div>

        <div class="content">
            <p class="lead">Hello {{ $shopName }},</p>

            @if($isCritical)
                <div class="notice notice-danger">
                    <strong>Only {{ number_format($remainingCredits) }} credits remaining</strong> ({{ rtrim(rtrim(number_format($remainingPercent, 2, '.', ''), '0'), '.') }}% left). Top up now to keep creating.
                </div>
            @else
                <div class="notice notice-warning">
                    <strong>{{ number_format($usedCredits) }} credits used</strong> — You've created {{ round($usedCredits / 1) }} professional images ({{ rtrim(rtrim(number_format($usedPercent, 2, '.', ''), '0'), '.') }}% of your monthly allocation).
                </div>
            @endif

            <div class="details">
                <div class="row">
                    <div class="label">Monthly Allocation</div>
                    <div class="value">{{ number_format($baselineCredits) }} credits</div>
                </div>
                <div class="row">
                    <div class="label">Used</div>
                    <div class="value">{{ number_format($usedCredits) }} credits</div>
                </div>
                <div class="row">
                    <div class="label">Remaining</div>
                    <div class="value">{{ number_format($remainingCredits) }} credits</div>
                </div>
            </div>

            <p class="cta">
                Keep your store competitive with fresh, professional product visuals.
            </p>
        </div>

        <div class="footer">
            This is an automated notification from {{ config('app.name') }}.
        </div>
    </div>
</body>
</html>
