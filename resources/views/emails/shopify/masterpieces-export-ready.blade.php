<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #245D6D; color: #fff; padding: 34px 28px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 28px; }
        .lead { font-size: 16px; color: #111827; margin: 0 0 14px; }
        .body-copy { margin: 0 0 14px; font-size: 14px; color: #475467; }
        .details { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; margin-top: 16px; }
        .row { padding: 10px 14px; }
        .row + .row { border-top: 1px solid #E2E8F0; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748B; margin-bottom: 3px; }
        .value { font-size: 14px; color: #0F172A; font-weight: 600; }
        .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 28px; text-align: center; font-size: 12px; color: #64748B; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Export Is Ready</h1>
            <p>{{ config('app.name') }} Data Delivery</p>
        </div>

        <div class="content">
            <p class="lead">Hello {{ $shopName }},</p>
            <p class="body-copy">
                Your creations are attached and ready to use. The quality and consistency your team is producing are excellent, and we are proud to support your brand with tools built for professional growth.
            </p>
            <p class="body-copy">
                We are committed to a strong long-term relationship: dependable delivery, reliable performance, and practical results you can publish with confidence.
            </p>

            <div class="details">
                <div class="row">
                    <div class="label">Total Images Attached</div>
                    <div class="value">{{ number_format($imagesCount) }}</div>
                </div>
                <div class="row">
                    <div class="label">Export Format</div>
                    <div class="value">{{ $exportLabel }}</div>
                </div>
                <div class="row">
                    <div class="label">Attachment</div>
                    <div class="value">{{ $zipFilename }}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            This is an automated message from {{ config('app.name') }}.
        </div>
    </div>
</body>
</html>
