import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Welcome({ auth }) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="AI Product Photography | Professional Photos on Demand" />
            <div className="bg-gray-50 text-gray-900 scroll-smooth">
                {/* Navigation */}
                <nav className={`sticky top-0 z-50 transition-all duration-300 ${
                    isScrolled
                        ? 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm'
                        : 'bg-transparent'
                }`}>
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-teal rounded-xl flex items-center justify-center text-white shadow-lg"
                                 style={{ backgroundColor: '#468A9A' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                Snap<span style={{ color: '#468A9A' }}>AI</span>
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
                            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
                            <a href="#ai-models" className="hover:text-gray-900 transition-colors">AI Models</a>
                            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
                            {auth.user ? (
                                <Link
                                    href={route('shopify.dashboard')}
                                    className="px-5 py-2.5 rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-white transition-all"
                                    >
                                        Merchant Login
                                    </Link>
                                    <a href="#" className="px-5 py-2.5 rounded-lg text-white transition-all"
                                       style={{ backgroundColor: '#FF7A30' }}>
                                        Install on Shopify
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="relative pt-20 pb-32 overflow-hidden"
                        style={{
                            background: 'radial-gradient(circle at top right, rgba(70, 138, 154, 0.15), transparent), radial-gradient(circle at bottom left, rgba(255, 122, 48, 0.1), transparent)'
                        }}>
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Column */}
                        <div className="space-y-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border"
                                 style={{ backgroundColor: 'rgba(255, 122, 48, 0.12)', color: '#FF7A30', borderColor: 'rgba(255, 122, 48, 0.1)' }}>
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping inline-flex rounded-full h-full w-full" style={{ backgroundColor: '#FF7A30', opacity: 0.75 }}></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#FF7A30' }}></span>
                                </span>
                                New: Nano Banana 2 Inpainting Integration
                            </div>

                            {/* Headline */}
                            <h1 className="text-5xl md:text-6xl lg:text-7xl leading-tight font-extrabold text-gray-900">
                                Professional product photos, <span style={{ color: '#468A9A' }}>on demand.</span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                                Your 24/7 AI photographer. Automatically generate, enhance, and transform Shopify product images using world-class AI models.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button className="px-8 py-4 text-white rounded-xl font-bold text-lg shadow-xl transform hover:-translate-y-1 transition-all"
                                        style={{ backgroundColor: '#FF7A30' }}>
                                    Install Free on Shopify
                                </button>
                                <button className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:shadow-lg transition-all">
                                    View Demo Video
                                </button>
                            </div>

                            {/* Trust Signals */}
                            <div className="flex items-center gap-6 pt-4 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-2">✅ Shopify Native</span>
                                <span className="flex items-center gap-2">✅ No Camera Required</span>
                                <span className="flex items-center gap-2">✅ 1-Click Sync</span>
                            </div>
                        </div>

                        {/* Right Column - Hero Image */}
                        <div className="relative">
                            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                                 style={{
                                     animation: 'float 6s ease-in-out infinite',
                                     '@keyframes float': '0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); }'
                                 }}>
                                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000"
                                     alt="Product AI"
                                     className="w-full" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                                    <div className="text-white">
                                        <p className="font-bold text-lg">AI Lighting Fix Applied</p>
                                        <p className="text-sm opacity-80 font-semibold" style={{ color: '#FF7A30' }}>IC-Light Model v2</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full blur-3xl opacity-10"
                                 style={{ backgroundColor: '#468A9A' }}></div>
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full blur-3xl opacity-10"
                                 style={{ backgroundColor: '#FF7A30' }}></div>
                        </div>
                    </div>
                </header>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl font-bold mb-4">6 Powerful Tools, One App</h2>
                            <p className="text-gray-600 text-lg">Everything you need to turn basic snapshots into studio-quality catalog assets without the studio costs.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Tool Cards */}
                            {[
                                {
                                    title: 'Magic Eraser',
                                    description: 'Remove unwanted objects or photobombs instantly using Nano Banana 2 Inpainting.',
                                    badge: 'Powered by Replicate',
                                    color: '#468A9A'
                                },
                                {
                                    title: 'AI Relighting',
                                    description: 'Apply 50+ professional lighting presets using IC-Light to give products a premium glow.',
                                    badge: 'IC-Light Model',
                                    color: '#FF7A30'
                                },
                                {
                                    title: 'Image Enhancer',
                                    description: 'Auto-improve photo quality and facial details with RestoreFormer v1.4 technology.',
                                    badge: 'RestoreFormer v1.4',
                                    color: '#468A9A'
                                },
                                {
                                    title: 'Background Remover',
                                    description: 'Clean, professional background removal for pristine product isolation.',
                                    badge: 'Photoroom API',
                                    color: '#FF7A30'
                                },
                                {
                                    title: 'Image Upscaler',
                                    description: 'Enhance resolution up to 8x without losing quality or detail.',
                                    badge: 'Nano Banana Pro',
                                    color: '#468A9A'
                                },
                                {
                                    title: 'Image Compressor',
                                    description: 'Intelligent file size reduction while preserving visual quality and detail.',
                                    badge: 'Optimized GD',
                                    color: '#FF7A30'
                                }
                            ].map((tool, idx) => (
                                <div key={idx} className="p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all group bg-gray-50/50"
                                     style={{
                                         borderColor: 'rgba(229, 231, 235, 1)',
                                         ':hover': { borderColor: `rgba(${tool.color === '#468A9A' ? '70, 138, 154' : '255, 122, 48'}, 0.3)` }
                                     }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"
                                         style={{ backgroundColor: `rgba(${tool.color === '#468A9A' ? '70, 138, 154' : '255, 122, 48'}, 0.12)`, color: tool.color }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{tool.title}</h3>
                                    <p className="text-gray-600 mb-4">{tool.description}</p>
                                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: tool.color }}>
                                        {tool.badge}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AI Models Section */}
                <section id="ai-models" className="py-24 bg-gray-900 text-white overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-bold mb-6">Cutting-Edge AI Architecture</h2>
                                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                    We don't use generic filters. We utilize a distributed queue system to process images through the world's most advanced machine learning models.
                                </p>
                                <ul className="space-y-6">
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-900"
                                             style={{ backgroundColor: '#468A9A' }}>1</div>
                                        <div>
                                            <h4 className="font-bold text-white">Nano Banana 2 & Pro</h4>
                                            <p className="text-sm text-gray-400">Superior inpainting and upscaling for high-resolution 8x enhancements.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-900"
                                             style={{ backgroundColor: '#468A9A' }}>2</div>
                                        <div>
                                            <h4 className="font-bold text-white">IC-Light Control</h4>
                                            <p className="text-sm text-gray-400">Manipulate light sources after the photo is taken for realistic shadows and highlights.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-900"
                                             style={{ backgroundColor: '#468A9A' }}>3</div>
                                        <div>
                                            <h4 className="font-bold text-white">RestoreFormer v1.4</h4>
                                            <p className="text-sm text-gray-400">Advanced image enhancement for superior detail and clarity.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Code Block */}
                            <div className="bg-gray-800 rounded-3xl p-8 border border-white/10 shadow-3xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="text-xs font-mono text-gray-500 underline">ai_model_processing.js</div>
                                </div>
                                <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
                                    <code>
                                        <span style={{ color: '#FF7A30' }}>async function</span> <span style={{ color: 'white' }}>enhanceProduct</span>(image) {'{'}
                                        {'\n'}  <span style={{ color: '#888' }}>// Initialize Nano Banana 2</span>
                                        {'\n'}  <span style={{ color: '#FF7A30' }}>const</span> result = <span style={{ color: '#FF7A30' }}>await</span> Replicate.<span style={{ color: 'white' }}>run</span>(
                                        {'\n'}    <span style={{ color: '#888' }}>"nano-banana-2-pro"</span>,
                                        {'\n'}    {'{'}' image: image, upscale: <span style={{ color: 'white' }}>8</span> {'}'}
                                        {'\n'}  );
                                        {'\n'}  {'\n'}  <span style={{ color: '#FF7A30' }}>return</span> <span style={{ color: 'white' }}>result</span>;
                                        {'\n'}{'}'}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl"
                             style={{ backgroundColor: '#468A9A' }}>
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to transform your Shopify store?</h2>
                                <p className="text-lg mb-10 max-w-2xl mx-auto opacity-90">
                                    Join merchants saving thousands of dollars every month on product photography.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <button className="px-10 py-4 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg"
                                            style={{ backgroundColor: '#FF7A30' }}>
                                        Install on Shopify
                                    </button>
                                    <button className="px-10 py-4 rounded-xl font-bold text-lg transition-all"
                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                        Contact Sales
                                    </button>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-white"></div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-4 gap-12 mb-16">
                            <div className="col-span-2">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                         style={{ backgroundColor: '#468A9A' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg font-bold">SnapAI</span>
                                </div>
                                <p className="text-gray-500 max-w-xs leading-relaxed">
                                    Leading the Shopify AI revolution with advanced product photography tools built on Laravel and React.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold mb-6">Product</h5>
                                <ul className="space-y-4 text-gray-600">
                                    <li><a href="#" className="hover:text-gray-900 transition-colors">AI Lab</a></li>
                                    <li><a href="#" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                                    <li><a href="#" className="hover:text-gray-900 transition-colors">API Docs</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold mb-6">Company</h5>
                                <ul className="space-y-4 text-gray-600">
                                    <li><a href="#" className="hover:text-gray-900 transition-colors">Help Center</a></li>
                                    <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy</a></li>
                                    <li><a href="#" className="hover:text-gray-900 transition-colors">Terms</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
                            <p>© 2026 SnapAI Inc. All rights reserved.</p>
                            <div className="flex gap-6">
                                <span>Build with Laravel 12</span>
                                <span>Powered by Nano Banana</span>
                            </div>
                        </div>
                    </div>
                </footer>

                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }
                `}</style>
            </div>
        </>
    );
}
