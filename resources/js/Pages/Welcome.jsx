import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="relative min-h-screen bg-white text-black/50 dark:bg-black dark:text-white/50">
                <img
                    id="background"
                    className="absolute -left-20 top-0 max-w-[877px]"
                    src="https://laravel.com/assets/img/welcome/background.svg"
                    alt="Laravel background"
                />
                <div className="relative min-h-screen flex flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
                    <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                        <header className="grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-3">
                            <div className="flex lg:col-start-2 lg:justify-center">
                                <svg
                                    className="h-12 w-auto text-white lg:h-16 lg:text-[#FF2D20]"
                                    viewBox="0 0 62 65"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M61.8548 14.6253L61.8778 14.7186V17.9091L61.8548 17.9994L32.5712 62.9367L32.4569 63.0215L31.5428 64L30.6311 63.0215L30.5169 62.9367L1.23318 17.9994L1.21019 17.9091V14.7186L1.23318 14.6253L9.44734 1.5H11.4039L14.074 4.23375H14.2371L16.9707 1.5H18.9272L21.606 4.23375H21.7671L24.5037 1.5H26.4602L29.1409 4.23375H29.304L32.0376 1.5H33.9941L36.6748 4.23375H36.8379L39.5715 1.5H41.5279L44.2067 4.23375H44.3678L47.1044 1.5H49.0609L51.7416 4.23375H51.9047L54.6383 1.5H56.5948L61.8548 14.6253Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <nav className="-mx-3 flex flex-1 justify-end">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </header>

                        <main className="mt-6">
                            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                                <a
                                    href="https://laravel.com/docs"
                                    className="flex items-start gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/[0.08] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700"
                                >
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16">
                                        <svg
                                            className="size-5 sm:size-6"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                fill="#FF2D20"
                                                d="M12 6.25278C9.24993 6.25278 7.01997 8.48274 7.01997 11.2328C7.01997 13.9829 9.24993 16.2128 12 16.2128C14.7501 16.2128 16.98 13.9829 16.98 11.2328C16.98 8.48274 14.7501 6.25278 12 6.25278ZM5.01997 11.2328C5.01997 7.37817 8.14538 4.25278 12 4.25278C15.8546 4.25278 18.98 7.37817 18.98 11.2328C18.98 15.0874 15.8546 18.2128 12 18.2128C8.14538 18.2128 5.01997 15.0874 5.01997 11.2328Z"
                                            />
                                        </svg>
                                    </div>

                                    <div className="pt-3 sm:pt-5">
                                        <h2 className="text-xl font-semibold text-black dark:text-white">Documentation</h2>

                                        <p className="mt-4 text-sm/relaxed">
                                            Laravel has wonderful documentation covering every aspect of the framework.
                                            Whether you are new to the framework or have previous experience, we recommend
                                            reading all of the documentation from beginning to end.
                                        </p>
                                    </div>
                                </a>

                                <a
                                    href="https://laracasts.com"
                                    className="flex items-start gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/[0.08] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700"
                                >
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16">
                                        <svg
                                            className="size-5 sm:size-6"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                fill="#FF2D20"
                                                d="M3 3.25A.75.75 0 0 1 3.75 2.5h16.5A.75.75 0 0 1 21 3.25v17.5a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 20.75V3.25Zm1.5.75V20h15V4h-15Z"
                                            />
                                        </svg>
                                    </div>

                                    <div className="pt-3 sm:pt-5">
                                        <h2 className="text-xl font-semibold text-black dark:text-white">Laracasts</h2>

                                        <p className="mt-4 text-sm/relaxed">
                                            Laracasts offers thousands of video tutorials on Laravel, PHP, and JavaScript.
                                            Check them out, see for yourself, and massively level up your development
                                            skills in the process.
                                        </p>
                                    </div>
                                </a>

                                <a
                                    href="https://laravel-news.com"
                                    className="flex items-start gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/[0.08] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700"
                                >
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16">
                                        <svg
                                            className="size-5 sm:size-6"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                fill="#FF2D20"
                                                d="M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 2h8v1.5H8V9Zm0 3h8V13H8v-1.5Zm0 3h5V16H8v-1Z"
                                            />
                                        </svg>
                                    </div>

                                    <div className="pt-3 sm:pt-5">
                                        <h2 className="text-xl font-semibold text-black dark:text-white">Laravel News</h2>

                                        <p className="mt-4 text-sm/relaxed">
                                            Laravel News is a community driven portal and newsletter aggregating all of
                                            the latest and most important news in the Laravel ecosystem.
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </main>

                        <footer className="py-16 text-center text-sm text-black dark:text-white/70">
                            Laravel v{laravelVersion} (PHP v{phpVersion})
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}
