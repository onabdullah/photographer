<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: #468A9A; color: white; padding: 40px 30px; text-align: center; }
        .header p { margin: 8px 0 0; font-size: 15px; opacity: 0.9; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
        .milestone-card { background: linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.04) 100%); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center; }
        .milestone-icon { font-size: 48px; margin-bottom: 12px; }
        .milestone-text { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .milestone-desc { font-size: 14px; color: #6b7280; }
        .details { background-color: rgba(70, 138, 154, 0.06); border: 1px solid rgba(70, 138, 154, 0.15); border-radius: 8px; margin: 24px 0; overflow: hidden; }
        .detail-row { padding: 12px 20px; }
        .detail-row + .detail-row { border-top: 1px solid rgba(70, 138, 154, 0.12); }
        .detail-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 3px; }
        .detail-value { font-size: 14px; font-weight: 500; color: #111827; line-height: 1.5; }
        .next-steps { margin: 28px 0 0; }
        .next-steps h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 12px; }
        .step { display: flex; align-items: flex-start; margin: 12px 0; font-size: 14px; color: #374151; line-height: 1.5; }
        .step-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #468A9A; color: white; border-radius: 50%; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-right: 10px; margin-top: 1px; }
        .benefits { background-color: #f0fdf4; border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 20px 18px; margin: 24px 0; }
        .benefits h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 10px; }
        .benefits ul { margin: 0; padding-left: 18px; color: #374151; }
        .benefits li { margin: 8px 0; font-size: 14px; line-height: 1.55; }
        .cta-button { display: inline-block; padding: 14px 36px; background: #468A9A; color: white !important; text-decoration: none; border-radius: 8px; margin: 8px 0 24px; font-weight: 600; font-size: 15px; }
        .notice { background-color: rgba(70, 138, 154, 0.06); border-left: 3px solid #468A9A; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 24px 0; }
        .notice p { margin: 0; font-size: 13px; color: #374151; line-height: 1.6; }
        .signature { margin-top: 24px; color: #6b7280; line-height: 1.5; }
        .footer { background-color: #F9FAFB; border-top: 1px solid #e5e7eb; padding: 24px 30px; text-align: center; font-size: 13px; color: #6B7280; line-height: 1.6; }
        h1 { margin: 0 0 4px; font-size: 28px; font-weight: 700; }
        p { margin: 12px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">

        {{-- ── HEADER ── --}}
        <div class="header">
            @if($appLogoUrl)
                <img src="{{ $appLogoUrl }}" alt="{{ $appName }}" style="max-height: 44px; width: auto; display: inline-block; margin-bottom: 16px;"><br>
            @endif
            <h1>Your Professional Visual is Live</h1>
            <p>Enterprise-grade imagery created without enterprise costs.</p>
        </div>

        {{-- ── CONTENT ── --}}
        <div class="content">

            <p class="greeting">
                Hello <strong>{{ $shopName }}</strong>,
            </p>

            <p style="font-size: 15px; color: #111827; font-weight: 500; line-height: 1.6;">
                You've just completed your first professional product creation—an image that took seconds with {{ $appName }} instead of hours in a studio. This represents significant value already being delivered to your business.
            </p>

            {{-- ── Value Milestone Card ── --}}
            <div class="milestone-card">
                <div class="milestone-icon">📊</div>
                <div class="milestone-text">You've Eliminated Traditional Photography Costs</div>
                <div class="milestone-desc">One professional image created for pennies using {{ $appName }} instead of $300-$500 with a photographer.</div>
            </div>

            {{-- ── Creation Details ── --}}
            <div class="details">
                <div class="detail-row">
                    <div class="detail-label">Image Created With</div>
                    <div class="detail-value">{{ $toolName }}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Credits Used</div>
                    <div class="detail-value"><strong>1 credit</strong> (professional image generated)</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Credits Remaining</div>
                    <div class="detail-value"><strong>{{ number_format($creditsRemaining) }}</strong> credits ready for {{ number_format($creditsRemaining) }} more images</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Created At</div>
                    <div class="detail-value">{{ $createdAt }}</div>
                </div>
            </div>

            {{-- ── Business Impact ── --}}
            <p style="margin: 24px 0 16px; font-size: 15px; font-weight: 600; color: #111827;">Why This Matters for Your Bottom Line</p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
                <strong>Every professional image you publish increases credibility.</strong> Stores featuring high-quality product visuals see measurable improvements: 2-3x higher conversion rates, lower cart abandonment, and stronger customer confidence. You just created one of those images in seconds—and you have {{ number_format($creditsRemaining) }} more waiting.
            </p>

            {{-- ── What's Next ── --}}
            <div class="next-steps">
                <h3>Your Next Moves to Maximum ROI</h3>
                <div class="step">
                    <span class="step-num">1</span>
                    <strong>Prioritize your top 10 products</strong> — create professional visuals for highest-margin or best-selling items first to maximize sales impact.
                </div>
                <div class="step">
                    <span class="step-num">2</span>
                    <strong>Create variations for testing</strong> — try different backgrounds, lighting, and angles to discover which resonate best with your audience.
                </div>
                <div class="step">
                    <span class="step-num">3</span>
                    <strong>Refresh collections seasonally</strong> — keep your storefront competitive by regularly updating featured product visuals.
                </div>
                <div class="step">
                    <span class="step-num">4</span>
                    <strong>Repurpose across channels</strong> — use these professional images on social media, ads, and email campaigns to amplify impact.
                </div>
            </div>

            {{-- ── Pro Tips ── --}}
            <div class="benefits">
                <h3>Pro Tips: Getting Maximum ROI Per Credit</h3>
                <ul>
                    <li><strong>Batch creation workflow:</strong> Create 5-10 variations for similar products in one session. You'll save time and maintain visual consistency across categories.</li>
                    <li><strong>Document winning prompts:</strong> Save the exact settings that produced your best images. Reuse them for similar products to achieve predictable, high-quality results instantly.</li>
                    <li><strong>Strategic scheduling:</strong> Align image creation with new product launches, seasonal campaigns, and inventory refreshes for maximum relevance.</li>
                    <li><strong>A/B testing:</strong> Create multiple versions (background, lighting, framing) and test them to identify which drives highest engagement and conversions.</li>
                    <li><strong>Quality over volume:</strong> Focus on your hero images and top SKUs first. Professional visuals for 50 top products will drive more ROI than basic images for everything.</li>
                </ul>
            </div>

            {{-- ── CTA ── --}}
            <div style="text-align: center;">
                <a href="{{ url('/') }}" class="cta-button">Create More Visuals ({{ number_format($creditsRemaining) }} Credits Remaining)</a>
            </div>

            <div class="notice">
                <p><strong>You're ahead of competitors.</strong> While most stores still pay thousands for studio sessions, you're creating professional visuals at scale. Your remaining {{ number_format($creditsRemaining) }} credits represent {{ number_format($creditsRemaining * 300) }}+ in traditional photography value. Use them strategically.</p>
            </div>

            <p class="signature">
                Regards,<br>
                <strong>The {{ $appName }} Team</strong>
            </p>

        </div>

        {{-- ── FOOTER ── --}}
        <div class="footer">
            {{ $appName }} · You're receiving this because you created your first visual.<br>
            Questions or feedback? Reply to this email — we're here to help.
        </div>

    </div>
</body>
</html>
