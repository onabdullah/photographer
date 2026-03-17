import { Head, Link } from '@inertiajs/react';
const IMAGE_GALLERY = [
    {
        src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=90',
        alt: 'Modern retail product shelf with premium packaging',
    },
    {
        src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=90',
        alt: 'Studio-quality fashion product setup in soft lighting',
    },
    {
        src: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=90',
        alt: 'High-end ecommerce storefront display with product focus',
    },
];

const HIGHLIGHTS = [
    'Generate premium visuals in minutes, directly inside Shopify.',
    'Use consistent brand-safe outputs for ads, PDPs, and campaigns.',
    'Scale without costly photoshoots or long production cycles.',
];

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="BFS | Grow Faster With AI Product Visuals">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-gray-50 text-gray-900">
                <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=220&q=90"
                            alt="BFS visual mark"
                            className="h-11 w-11 rounded-xl object-cover ring-2 ring-primary-100"
                        />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary-700">Shopify Embedded First Tool</p>
                            <h1 className="text-xl font-bold leading-tight text-gray-900">BFS</h1>
                        </div>
                    </div>

                    <nav className="flex items-center gap-2 text-sm font-medium">
                        {auth.user ? (
                            <Link
                                href="/shopify/dashboard"
                                className="rounded-full border border-primary-300 px-4 py-2 text-primary-700 transition hover:bg-primary-50"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-full border border-primary-300 px-4 py-2 text-primary-700 transition hover:bg-primary-50"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-full bg-primary-600 px-5 py-2 text-white transition hover:bg-primary-700"
                                >
                                    Start now
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10">
                    <section className="grid gap-10 pb-14 pt-6 lg:grid-cols-2 lg:items-center">
                        <div>
                            <p className="mb-4 inline-flex rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
                                Minimal. Fast. Brand-Ready.
                            </p>
                            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 lg:text-6xl">
                                Welcome to premium Shopify visuals.
                            </h2>
                            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
                                BFS helps you create high-quality product visuals using AI workflows built directly into your Shopify admin.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={auth.user ? '/shopify/dashboard' : route('register')}
                                    className="rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                                >
                                    {auth.user ? 'Open Dashboard' : 'Start now'}
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={route('login')}
                                        className="rounded-full border border-primary-300 bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
                                    >
                                        Log in
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-primary-200 bg-white p-3 shadow-sm">
                            <img
                                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1800&q=90"
                                alt="High quality ecommerce hero image"
                                className="h-[420px] w-full rounded-2xl object-cover"
                            />
                        </div>
                    </section>

                    <section className="py-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">Curated high-quality visuals</h3>
                            <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-700">
                                Brand-safe
                            </span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {IMAGE_GALLERY.map((image) => (
                                <figure key={image.src} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                    <img src={image.src} alt={image.alt} className="h-64 w-full object-cover" loading="lazy" />
                                </figure>
                            ))}
                        </div>
                    </section>

                    <section className="py-8">
                        <div className="rounded-3xl border border-primary-200 bg-white p-6 md:p-8">
                            <h4 className="text-xl font-bold text-gray-900">Why merchants choose BFS</h4>
                            <ul className="mt-4 space-y-3">
                                {HIGHLIGHTS.map((point) => (
                                    <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12l4 4L19 6" />
                                            </svg>
                                        </span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-600 lg:px-10">
                    BFS for Shopify | Built for secure growth, optimized AI workflows, and professional brand visuals.
                </footer>
            </div>
        </>
    );
}
