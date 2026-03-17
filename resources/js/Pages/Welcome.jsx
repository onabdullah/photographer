import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

const BRANDS = ['VendorShendor', 'Velora Goods', 'NovaHaus', 'Blend Theory', 'Studio Arc', 'Mira Living'];

const FEATURES = [
    {
        title: 'No Expensive Photoshoots',
        text: 'Generate campaign-ready product visuals in seconds, not weeks. Your team launches faster with lower production cost.',
    },
    {
        title: 'Secure Payments And Data',
        text: 'Shopify billing, encrypted transfer, and enterprise-grade controls keep money flow and merchant data protected.',
    },
    {
        title: 'Authentication + Authorization',
        text: 'Role-based access and controlled permissions make sure only the right team members can perform sensitive actions.',
    },
    {
        title: 'Scalable AI Infrastructure',
        text: 'From startup catalogs to high-volume enterprise stores, BFS is optimized for growth in the era of AI commerce.',
    },
    {
        title: '24/7 Merchant Support',
        text: 'Our support team is available around the clock to help merchants resolve issues fast and keep stores selling without downtime.',
    },
];

export default function Welcome({ auth }) {
    const [slider, setSlider] = useState(53);

    return (
        <>
            <Head title="BFS | Grow Faster With AI Product Visuals">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="landing-root relative overflow-hidden bg-[#f5f7f2] text-[#10231a]">
                <div className="pointer-events-none absolute left-[-120px] top-[-80px] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,_rgba(255,182,59,0.45)_0%,_rgba(255,182,59,0)_72%)] blur-2xl" />
                <div className="pointer-events-none absolute bottom-[-130px] right-[-110px] h-[390px] w-[390px] rounded-full bg-[radial-gradient(circle,_rgba(82,154,255,0.28)_0%,_rgba(82,154,255,0)_68%)] blur-2xl" />

                <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=220&q=80"
                            alt="BFS visual mark"
                            className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/80"
                        />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#376551]">Shopify Embedded First Tool</p>
                            <h1 className="text-xl font-bold leading-tight">BFS</h1>
                        </div>
                    </div>

                    <nav className="flex items-center gap-2 text-sm font-medium">
                        {auth.user ? (
                            <Link
                                href="/shopify/dashboard"
                                className="rounded-full border border-[#b9cdbf] px-4 py-2 transition hover:border-[#2f5c48] hover:bg-[#e8f2ec]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-full border border-[#b9cdbf] px-4 py-2 transition hover:border-[#2f5c48] hover:bg-[#e8f2ec]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-full bg-[#10231a] px-5 py-2 text-white transition hover:bg-[#224131]"
                                >
                                    Start now
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10">
                    <section className="grid gap-12 pb-14 pt-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
                        <div className="reveal-item" style={{ animationDelay: '100ms' }}>
                            <p className="mb-4 inline-flex rounded-full border border-[#c3d5ca] bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#376551]">
                                Shopify Embedded First AI Workflow
                            </p>
                            <h2 className="font-heading text-5xl leading-[1.02] tracking-tight text-[#0f1e17] lg:text-7xl">
                                Stunning product visuals that grow your business.
                            </h2>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#244334]">
                                BFS helps Shopify brands scale without expensive photoshoots. Create premium image upgrades,
                                conversion-focused campaigns, and launch-ready visuals in minutes.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <a
                                    href="#live-slider"
                                    className="rounded-full bg-[#0f2018] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1e3a2e]"
                                >
                                    See Realtime Result
                                </a>
                                <a
                                    href="#vto"
                                    className="rounded-full border border-[#a6beaf] bg-white px-6 py-3 text-sm font-semibold transition hover:border-[#2f5c48]"
                                >
                                    Explore VTO
                                </a>
                            </div>
                        </div>

                        <div className="reveal-item" style={{ animationDelay: '240ms' }}>
                            <div className="nano-card relative overflow-hidden rounded-[32px] border border-[#b7cbbf] bg-white p-4 shadow-[0_20px_70px_rgba(28,53,42,0.15)] lg:p-6">
                                <div className="absolute right-5 top-5 rounded-full bg-[#0d1e17] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-white">
                                    AI Enhanced Studio
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1400&q=80"
                                    alt="Ecommerce hero visual"
                                    className="h-[420px] w-full rounded-[24px] object-cover"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="reveal-item pb-6" style={{ animationDelay: '70ms' }}>
                        <div className="rounded-3xl border border-[#9db8aa] bg-[#123124] px-6 py-5 text-white md:flex md:items-center md:justify-between md:px-8">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bed7ca]">Strategic Collaboration</p>
                                <p className="mt-1 text-2xl font-bold md:text-3xl">Built in close collaboration with VendorShendor.</p>
                            </div>
                            <p className="mt-3 text-sm text-[#d4e6dd] md:mt-0 md:max-w-sm">
                                Shared workflows, vendor-grade quality controls, and faster storefront rollout for growing Shopify merchants.
                            </p>
                        </div>
                    </section>

                    <section className="reveal-item py-12" style={{ animationDelay: '80ms' }}>
                        <p className="mb-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#4f6f60]">
                            Collaboration Across Multiple Brands
                        </p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                            {BRANDS.map((brand) => (
                                <div key={brand} className="rounded-2xl border border-[#c6d7cd] bg-white px-4 py-4 text-center text-sm font-bold text-[#193327]">
                                    {brand}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="live-slider" className="reveal-item grid gap-10 py-14 lg:grid-cols-2" style={{ animationDelay: '120ms' }}>
                        <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#3a6854]">Realtime Before/After Slider</p>
                            <h3 className="font-heading text-4xl leading-tight text-[#10231a] lg:text-5xl">Watch product transformation live.</h3>
                            <p className="mt-5 text-base leading-relaxed text-[#325543]">
                                Drag the slider to compare original product shots with BFS-enhanced output. This is how merchants
                                preview real improvements before publishing to their storefront.
                            </p>
                            <div className="mt-6 rounded-2xl border border-[#c7d8ce] bg-white p-4 text-sm text-[#325543]">
                                BFS runs inside Shopify as an embedded-first experience and delivers fast, reliable results built for growing catalogs.
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[30px] border border-[#b8ccbf] bg-white p-4 shadow-[0_20px_45px_rgba(20,42,33,0.12)]">
                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80"
                                    alt="Before AI enhancement"
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${slider}%` }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80"
                                        alt="After AI enhancement"
                                        className="h-full w-full max-w-none object-cover"
                                    />
                                </div>
                                <div className="pointer-events-none absolute inset-y-0" style={{ left: `${slider}%` }}>
                                    <div className="h-full w-[2px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" />
                                    <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-[#10231a] text-white">
                                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M15 18l6-6-6-6" />
                                            <path d="M9 6l-6 6 6 6" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">After</div>
                                <div className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">Before</div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={slider}
                                onChange={(event) => setSlider(Number(event.target.value))}
                                className="mt-4 w-full"
                                aria-label="Realtime before and after image slider"
                            />
                        </div>
                    </section>

                    <section className="grid gap-5 py-12 md:grid-cols-2">
                        {FEATURES.map((feature, index) => (
                            <article
                                key={feature.title}
                                className="reveal-item rounded-3xl border border-[#c8d8ce] bg-white p-6"
                                style={{ animationDelay: `${100 + index * 110}ms` }}
                            >
                                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ecf4ef] text-[#173226]">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                                        <path d="M5 12l4 4L19 6" />
                                    </svg>
                                </div>
                                <h4 className="text-xl font-bold text-[#10231a]">{feature.title}</h4>
                                <p className="mt-3 text-sm leading-relaxed text-[#365948]">{feature.text}</p>
                            </article>
                        ))}
                    </section>

                    <section id="vto" className="reveal-item py-14" style={{ animationDelay: '130ms' }}>
                        <div className="relative overflow-hidden rounded-[30px] border border-[#b7cbbb] bg-[#10231a] px-7 py-10 text-white md:px-12">
                            <div className="absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#ffd27e]/35 blur-2xl" />
                            <div className="absolute right-[-30px] top-[-30px] h-44 w-44 rounded-full bg-[#53a0ff]/30 blur-2xl" />
                            <p className="relative text-xs font-semibold uppercase tracking-[0.17em] text-[#cde4d8]">Properly Built For VTO</p>
                            <h5 className="relative mt-3 font-heading text-4xl leading-tight md:text-5xl">Virtual Try-On that boosts buyer confidence.</h5>
                            <p className="relative mt-5 max-w-3xl text-base leading-relaxed text-[#d7e8df]">
                                Our VTO pipeline helps shoppers visualize products in real context before checkout, reducing hesitation and improving conversion quality.
                                With BFS, your visual commerce stack stays modern, fast, and trustworthy.
                            </p>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#cad9d1] px-6 py-8 text-center text-sm text-[#476a59] lg:px-10">
                    BFS for Shopify | Built for secure growth, optimized AI workflows, and professional brand visuals.
                </footer>
            </div>

            <style>{`
                .landing-root {
                    font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
                }

                .landing-root .font-heading {
                    font-family: 'Fraunces', Georgia, serif;
                }

                .nano-card {
                    animation: cardFloat 6s ease-in-out infinite;
                }

                .reveal-item {
                    opacity: 0;
                    transform: translateY(22px);
                    animation: revealUp 850ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }

                @keyframes revealUp {
                    from {
                        opacity: 0;
                        transform: translateY(22px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes cardFloat {
                    0% {
                        transform: translateY(0px);
                    }

                    50% {
                        transform: translateY(-8px);
                    }

                    100% {
                        transform: translateY(0px);
                    }
                }
            `}</style>
        </>
    );
}
