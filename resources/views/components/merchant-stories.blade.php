<section class="merchant-stories" x-data="merchantStoriesSection()" aria-labelledby="merchant-stories-title">
    <style>
        .merchant-stories {
            --ms-bg: #f8fafc;
            --ms-surface: #ffffff;
            --ms-text: #0f172a;
            --ms-muted: #64748b;
            --ms-border: rgba(15, 23, 42, 0.09);
            --ms-border-hover: rgba(70, 138, 154, 0.4);
            --ms-accent: #468a9a;
            --ms-star: #f59e0b;
            background: var(--ms-bg);
            padding: 5rem 1.25rem;
        }

        .dark .merchant-stories {
            --ms-bg: #0b1220;
            --ms-surface: #111a2b;
            --ms-text: #e2e8f0;
            --ms-muted: #94a3b8;
            --ms-border: rgba(148, 163, 184, 0.2);
            --ms-border-hover: rgba(70, 138, 154, 0.65);
            --ms-star: #fbbf24;
        }

        .merchant-stories__container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .merchant-stories__header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .merchant-stories__eyebrow {
            font-size: 0.75rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--ms-accent);
            margin-bottom: 0.5rem;
        }

        .merchant-stories__title {
            font-size: clamp(1.75rem, 3.2vw, 2.8rem);
            font-weight: 700;
            color: var(--ms-text);
        }

        .merchant-stories__viewport {
            position: relative;
            min-height: 760px;
        }

        .merchant-stories__page {
            width: 100%;
        }

        .merchant-stories__grid {
            display: grid;
            grid-template-columns: repeat(1, minmax(0, 1fr));
            gap: 1rem;
        }

        @media (min-width: 768px) {
            .merchant-stories__grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (min-width: 1024px) {
            .merchant-stories__grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }

        .merchant-story-card {
            background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.9));
            border: 1px solid var(--ms-border);
            border-radius: 1rem;
            padding: 1.2rem;
            color: var(--ms-text);
            will-change: transform, opacity;
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
            transform: translateY(8px) scale(0.98);
            contain: content;
        }

        .dark .merchant-story-card {
            background: linear-gradient(180deg, rgba(17,26,43,0.96), rgba(17,26,43,0.9));
        }

        .merchant-story-card:hover {
            border-color: var(--ms-border-hover);
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.09);
        }

        .merchant-story-card__inner {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .merchant-story-card__quote {
            font-size: 0.95rem;
            line-height: 1.75;
            color: var(--ms-muted);
            margin-bottom: 1rem;
            flex: 1 1 auto;
        }

        .merchant-story-card__rating {
            display: inline-flex;
            gap: 0.125rem;
            color: var(--ms-star);
            margin-bottom: 0.9rem;
        }

        .merchant-story-card__footer {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-top: 1px solid var(--ms-border);
            padding-top: 0.9rem;
        }

        .merchant-story-card__avatar {
            width: 42px;
            height: 42px;
            border-radius: 999px;
            object-fit: cover;
            flex-shrink: 0;
            border: 1px solid var(--ms-border);
            background: #e2e8f0;
        }

        .merchant-story-card__name {
            font-weight: 700;
            font-size: 0.9rem;
            color: var(--ms-text);
        }

        .merchant-story-card__role {
            font-size: 0.78rem;
            color: var(--ms-muted);
            margin-top: 0.15rem;
        }

        .float-anim {
            animation: float 6s ease-in-out infinite;
        }

        .gentle-float {
            animation: gentleFloat 4s ease-in-out infinite;
        }

        .merchant-stories__controls {
            margin-top: 1.4rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.9rem;
        }

        .merchant-stories__button {
            display: inline-flex;
            align-items: center;
            gap: 0.55rem;
            border: 1px solid var(--ms-border);
            border-radius: 999px;
            padding: 0.7rem 1.1rem;
            background: var(--ms-surface);
            color: var(--ms-text);
            font-weight: 600;
            cursor: pointer;
            transition: all 160ms ease;
        }

        .merchant-stories__button:hover {
            border-color: var(--ms-border-hover);
        }

        .merchant-stories__arrow {
            width: 16px;
            height: 16px;
            transition: transform 220ms ease;
        }

        .merchant-stories__arrow.is-rotated {
            transform: rotate(180deg);
        }

        .merchant-stories__dots {
            display: flex;
            gap: 0.45rem;
        }

        .merchant-stories__dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            border: 0;
            background: rgba(100, 116, 139, 0.5);
            cursor: pointer;
            transition: all 160ms ease;
        }

        .merchant-stories__dot.is-active {
            width: 20px;
            background: var(--ms-accent);
        }

        @keyframes fadeInUp {
            0% {
                opacity: 0;
                transform: translateY(8px) scale(0.95);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes float {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-7px);
            }
        }

        @keyframes gentleFloat {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-4px);
            }
        }
    </style>

    <div class="merchant-stories__container">
        <header class="merchant-stories__header">
            <p class="merchant-stories__eyebrow">Merchant Stories</p>
            <h2 class="merchant-stories__title" id="merchant-stories-title">Loved by fast-growing Shopify brands</h2>
        </header>

        <div class="merchant-stories__viewport" aria-live="polite">
            <template x-for="(page, pageIndex) in pages" :key="`page-${pageIndex}`">
                <div
                    class="merchant-stories__page"
                    x-show="currentPage === pageIndex"
                    x-transition:enter="duration-700 ease-out delay-300"
                    x-transition:enter-start="opacity-0 scale-95 translate-y-2"
                    x-transition:enter-end="opacity-100 scale-100 translate-y-0"
                    x-transition:leave="duration-500 ease-in"
                    x-transition:leave-start="opacity-100 scale-100 translate-y-0 absolute inset-0"
                    x-transition:leave-end="opacity-0 scale-90 -translate-y-2 absolute inset-0"
                >
                    <div class="merchant-stories__grid">
                        <template x-for="(story, cardIndex) in page" :key="story.id">
                            <article
                                class="merchant-story-card"
                                :style="`animation-delay:${(cardIndex % 6) * 0.1}s`"
                            >
                                <div class="merchant-story-card__inner" :class="cardIndex % 2 === 0 ? 'gentle-float' : 'float-anim'">
                                    <p class="merchant-story-card__quote" x-text="story.quote"></p>
                                    <div class="merchant-story-card__rating" aria-label="5 star rating">
                                        <template x-for="star in 5" :key="`star-${story.id}-${star}`">
                                            <span aria-hidden="true">★</span>
                                        </template>
                                    </div>
                                    <footer class="merchant-story-card__footer">
                                        <img class="merchant-story-card__avatar" :src="story.avatar" :alt="`${story.name} avatar`" loading="lazy" decoding="async">
                                        <div>
                                            <p class="merchant-story-card__name" x-text="story.name"></p>
                                            <p class="merchant-story-card__role" x-text="story.role"></p>
                                        </div>
                                    </footer>
                                </div>
                            </article>
                        </template>
                    </div>
                </div>
            </template>
        </div>

        <div class="merchant-stories__controls">
            <button
                class="merchant-stories__button"
                type="button"
                @click="nextPage()"
                :aria-label="currentPage === totalPages - 1 ? 'View first merchant stories page' : 'View more merchant stories'"
            >
                <span x-text="currentPage === totalPages - 1 ? 'View First' : 'View More'"></span>
                <svg class="merchant-stories__arrow" :class="{ 'is-rotated': currentPage === totalPages - 1 }" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M10 4v12" />
                    <path d="M5 11l5 5 5-5" />
                </svg>
            </button>

            <div class="merchant-stories__dots" role="tablist" aria-label="Merchant stories pages">
                <template x-for="(dot, dotIndex) in pages" :key="`dot-${dotIndex}`">
                    <button
                        type="button"
                        class="merchant-stories__dot"
                        :class="{ 'is-active': currentPage === dotIndex }"
                        :aria-label="`Go to merchant stories page ${dotIndex + 1}`"
                        :aria-selected="currentPage === dotIndex"
                        role="tab"
                        @click="goToPage(dotIndex)"
                    ></button>
                </template>
            </div>
        </div>
    </div>

    <script>
        function merchantStoriesSection() {
            const testimonials = [
                { id: 1, quote: 'PixelForge cut our campaign production time by 70%. We launch faster and spend less.', avatar: 'https://i.pravatar.cc/80?img=11', name: 'Ava Morgan', role: 'Founder, Luma Goods' },
                { id: 2, quote: 'The upscaler rescued hundreds of old supplier images. PDP quality is now consistent.', avatar: 'https://i.pravatar.cc/80?img=12', name: 'Ethan Cole', role: 'Head of Ecommerce, Threadline' },
                { id: 3, quote: 'Lighting presets gave us premium catalog consistency without reshooting products.', avatar: 'https://i.pravatar.cc/80?img=13', name: 'Maya Chen', role: 'Creative Lead, Velour House' },
                { id: 4, quote: 'Background remover accuracy is excellent. Marketplace compliance became effortless.', avatar: 'https://i.pravatar.cc/80?img=14', name: 'Noah Patel', role: 'Operations Manager, GearBloom' },
                { id: 5, quote: 'Magic Eraser has replaced manual edits for us. Team output doubled in two weeks.', avatar: 'https://i.pravatar.cc/80?img=15', name: 'Zoe Bennett', role: 'Content Manager, Rove & Row' },
                { id: 6, quote: 'Compression improved our mobile speed and conversion rates moved in the right direction.', avatar: 'https://i.pravatar.cc/80?img=16', name: 'Liam Walker', role: 'Growth Lead, Nori Studio' },
                { id: 7, quote: 'Image enhancer made low-light photos look studio-clean. Product trust increased quickly.', avatar: 'https://i.pravatar.cc/80?img=17', name: 'Sofia Reyes', role: 'Brand Owner, Solace Skin' },
                { id: 8, quote: 'The workflow inside Shopify keeps our team focused. No tool switching, no bottlenecks.', avatar: 'https://i.pravatar.cc/80?img=18', name: 'Mason Wright', role: 'COO, Peak Atelier' },
                { id: 9, quote: 'Our launch creative quality now matches bigger brands. Customers notice immediately.', avatar: 'https://i.pravatar.cc/80?img=19', name: 'Isla Grant', role: 'Founder, Nook & Nest' },
                { id: 10, quote: 'We improved image quality across 2,000 SKUs without hiring extra designers.', avatar: 'https://i.pravatar.cc/80?img=20', name: 'Leo Kim', role: 'Marketplace Manager, Bold Harbor' },
                { id: 11, quote: 'Turnaround speed is unreal. We can test more visuals and learn faster each week.', avatar: 'https://i.pravatar.cc/80?img=21', name: 'Aria Singh', role: 'Performance Marketer, Halo Lane' },
                { id: 12, quote: 'Support is responsive and practical. We solved setup questions in minutes, not days.', avatar: 'https://i.pravatar.cc/80?img=22', name: 'Owen Park', role: 'Founder, Drift Cartel' },
                { id: 13, quote: 'Virtual scene generation helped our seasonal campaigns feel premium without studio rent.', avatar: 'https://i.pravatar.cc/80?img=23', name: 'Nora Blake', role: 'Art Director, River & Pine' },
                { id: 14, quote: 'Consistent visual quality improved trust and reduced customer pre-purchase questions.', avatar: 'https://i.pravatar.cc/80?img=24', name: 'Caleb Stone', role: 'CX Lead, Urban Loom' },
                { id: 15, quote: 'We shipped our largest collection using PixelForge alone. It held up at scale.', avatar: 'https://i.pravatar.cc/80?img=25', name: 'Elena Costa', role: 'Founder, Maison Elan' },
                { id: 16, quote: 'Retouch quality feels handcrafted while staying fast enough for daily operations.', avatar: 'https://i.pravatar.cc/80?img=26', name: 'Julian Ross', role: 'Design Director, Forgewear' },
                { id: 17, quote: 'The app paid for itself in the first month through lower production and faster publishing.', avatar: 'https://i.pravatar.cc/80?img=27', name: 'Hannah Yu', role: 'Owner, Pure Thread' },
                { id: 18, quote: 'Exactly the right balance: premium output, practical controls, and zero workflow friction.', avatar: 'https://i.pravatar.cc/80?img=28', name: 'Theo Miles', role: 'Head of Product, Ashford Co.' },
            ];

            const chunkSize = 6;
            const pages = [];
            for (let i = 0; i < testimonials.length; i += chunkSize) {
                pages.push(testimonials.slice(i, i + chunkSize));
            }

            return {
                currentPage: 0,
                pages,
                totalPages: pages.length,
                nextPage() {
                    this.currentPage = (this.currentPage + 1) % this.totalPages;
                },
                goToPage(index) {
                    this.currentPage = index;
                },
            };
        }
    </script>
</section>
