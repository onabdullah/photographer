import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Welcome() {
    useEffect(() => {
        // Scroll progress
        const prog = document.getElementById('progress');
        const handleScrollProgress = () => {
            if (prog) {
                prog.style.width = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100) + '%';
            }
        };
        window.addEventListener('scroll', handleScrollProgress, { passive: true });

        // Nav background on scroll
        const mainNav = document.getElementById('mainNav');
        const handleNavScroll = () => {
            if (mainNav) {
                mainNav.style.background =
                    window.scrollY > 60 ? 'rgba(4,8,13,.85)' : 'rgba(4,8,13,.55)';
            }
        };
        window.addEventListener('scroll', handleNavScroll, { passive: true });

        // Scroll reveal
        const revObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('vis');
                    revObs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.sr,.sl,.sr2').forEach(el => revObs.observe(el));

        // Tools stagger
        const tg = document.getElementById('toolsGrid');
        if (tg) {
            new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.querySelectorAll('.tc').forEach((c, i) => {
                            c.style.cssText = `opacity:0;transform:translateY(28px)`;
                            setTimeout(() => {
                                c.style.cssText = `opacity:1;transform:translateY(0);transition:opacity .6s ease,transform .6s ease`;
                            }, i * 90);
                        });
                    }
                });
            }, { threshold: 0.08 }).observe(tg);
        }

        // Counter animation
        function countUp(el, target, suffix) {
            let s = null;
            const step = ts => {
                if (!s) s = ts;
                const p = Math.min((ts - s) / 1600, 1);
                el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target) + suffix;
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
        new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.querySelectorAll('[data-target]').forEach(el => countUp(el, +el.dataset.target, el.dataset.suffix));
                }
            });
        }, { threshold: 0.5 }).observe(document.getElementById('proofGrid'));

        // Hero parallax
        const hv = document.getElementById('heroVis');
        const handleParallax = () => {
            if (hv) hv.style.transform = `translateY(${window.scrollY * 0.07}px)`;
        };
        window.addEventListener('scroll', handleParallax, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScrollProgress);
            window.removeEventListener('scroll', handleNavScroll);
            window.removeEventListener('scroll', handleParallax);
        };
    }, []);

    return (
        <>
            <Head title="PixelForge AI — Professional Product Photography for Shopify" />

            <style dangerouslySetInnerHTML={{ __html: `
                :root{
                  --teal:#468A9A;--teal-l:#64afc2;--teal-2:rgba(70,138,154,.14);--teal-3:rgba(70,138,154,.06);
                  --orange:#FF7A30;--orange-h:#e5621a;--orange-2:rgba(255,122,48,.13);
                  --bg:#04080d;--bg2:#070d14;--surf:#0b1520;--surf2:#0f1e2e;
                  --border:rgba(70,138,154,.16);--borderW:rgba(255,255,255,.055);
                  --txt:#eaf4f8;--txt2:#6d9ab0;--txt3:#2e4d5e;
                  --r-card:18px;--r-btn:11px;
                  --fH:'Cabinet Grotesk',sans-serif;--fB:'Instrument Sans',sans-serif;
                  --ease:cubic-bezier(.25,.46,.45,.94);
                }
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
                html{scroll-behavior:smooth}
                body{background:var(--bg);color:var(--txt);font-family:var(--fB);overflow-x:hidden;-webkit-font-smoothing:antialiased}
                a{text-decoration:none;color:inherit}
                img{display:block;max-width:100%}
                ::selection{background:var(--teal);color:#fff}
                ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--teal);border-radius:4px}

                .atmo{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
                .ao1{position:absolute;width:800px;height:800px;border-radius:50%;background:radial-gradient(circle,rgba(70,138,154,.18) 0%,transparent 68%);top:-250px;left:-200px;animation:ao1 20s ease-in-out infinite alternate}
                .ao2{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(255,122,48,.11) 0%,transparent 68%);bottom:-150px;right:-100px;animation:ao2 25s ease-in-out infinite alternate}
                .ao3{position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(70,138,154,.09) 0%,transparent 68%);top:40%;right:10%;animation:ao3 18s ease-in-out infinite alternate}
                @keyframes ao1{to{transform:translate(80px,60px) scale(1.15)}}
                @keyframes ao2{to{transform:translate(-60px,-80px) scale(1.1)}}
                @keyframes ao3{to{transform:translate(-40px,60px) scale(1.2)}}
                .grid-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(70,138,154,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(70,138,154,.035) 1px,transparent 1px);background-size:64px 64px}
                .noise{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:256px 256px}

                .wrap{position:relative;z-index:2}
                .container{max-width:1180px;margin:0 auto;padding:0 28px}

                #progress{position:fixed;top:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,var(--teal),var(--orange));z-index:999;transition:width .08s linear}

                nav{position:fixed;top:0;left:0;right:0;z-index:100;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 36px;background:rgba(4,8,13,.55);backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6);border-bottom:1px solid var(--borderW);animation:navIn .6s var(--ease) both;transition:background .3s}
                @keyframes navIn{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
                .nav-logo{display:flex;align-items:center;gap:10px;font-family:var(--fH);font-weight:900;font-size:1.22rem;letter-spacing:-.03em}
                .logo-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--teal),var(--orange));display:flex;align-items:center;justify-content:center}
                .nav-links{display:flex;align-items:center;gap:30px;list-style:none}
                .nav-links a{font-size:.875rem;font-weight:500;color:var(--txt2);transition:color .2s}
                .nav-links a:hover{color:var(--txt)}
                .nav-right{display:flex;align-items:center;gap:10px}
                .btn-ghost{padding:8px 18px;font-family:var(--fB);font-size:.85rem;font-weight:500;color:var(--txt2);border:1px solid var(--borderW);border-radius:var(--r-btn);background:transparent;cursor:pointer;transition:all .2s}
                .btn-ghost:hover{color:var(--txt);border-color:var(--border)}
                .btn-cta{padding:9px 22px;font-family:var(--fB);font-size:.875rem;font-weight:600;color:#fff;background:var(--orange);border:none;border-radius:var(--r-btn);cursor:pointer;transition:all .25s var(--ease)}
                .btn-cta:hover{background:var(--orange-h);transform:translateY(-1px);box-shadow:0 8px 22px rgba(255,122,48,.38)}

                .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:130px 24px 70px;position:relative}
                .hero-chip{display:inline-flex;align-items:center;gap:8px;margin-bottom:28px;padding:6px 18px 6px 10px;background:var(--teal-2);border:1px solid var(--border);border-radius:100px;font-size:.75rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--teal-l);animation:fadeUp .8s .15s var(--ease) both}
                .chip-pulse{width:22px;height:22px;background:var(--teal-2);border:1px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
                .chip-dot{width:7px;height:7px;background:var(--teal-l);border-radius:50%;animation:pring 2s infinite}
                @keyframes pring{0%,100%{box-shadow:0 0 0 0 rgba(100,175,194,.5)}50%{box-shadow:0 0 0 5px rgba(100,175,194,0)}}
                .hero h1{font-family:var(--fH);font-size:clamp(3rem,6.5vw,6rem);font-weight:900;line-height:1.04;letter-spacing:-.04em;max-width:960px;animation:fadeUp .9s .3s var(--ease) both}
                .h1-grd{background:linear-gradient(135deg,#a8dde8 0%,var(--teal-l) 40%,#8ecfe0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
                .h1-acc{color:var(--orange)}
                .hero-sub{font-size:clamp(1rem,1.6vw,1.2rem);color:var(--txt2);line-height:1.75;max-width:580px;margin-top:22px;animation:fadeUp .9s .45s var(--ease) both}
                .hero-actions{display:flex;align-items:center;gap:14px;margin-top:38px;flex-wrap:wrap;justify-content:center;animation:fadeUp .9s .6s var(--ease) both}
                .btn-hero{display:inline-flex;align-items:center;gap:9px;padding:15px 34px;font-family:var(--fB);font-weight:600;font-size:1rem;color:#fff;background:linear-gradient(135deg,var(--orange),#ff9655);border:none;border-radius:13px;cursor:pointer;transition:all .3s var(--ease);box-shadow:0 4px 26px rgba(255,122,48,.42)}
                .btn-hero:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(255,122,48,.52)}
                .btn-hero-sec{display:inline-flex;align-items:center;gap:9px;padding:15px 30px;font-family:var(--fB);font-weight:500;font-size:1rem;color:var(--txt);background:transparent;border:1px solid var(--border);border-radius:13px;cursor:pointer;transition:all .3s var(--ease)}
                .btn-hero-sec:hover{border-color:var(--teal);color:var(--teal-l);background:var(--teal-3)}
                .trust-row{display:flex;align-items:center;gap:8px;margin-top:44px;flex-wrap:wrap;justify-content:center;animation:fadeUp .9s .75s var(--ease) both}
                .trust-badge{display:flex;align-items:center;gap:7px;padding:8px 16px;background:var(--surf);border:1px solid var(--borderW);border-radius:10px;font-size:.8rem;font-weight:600;color:var(--txt2)}
                .trust-badge img{width:18px;height:18px;border-radius:4px;object-fit:contain}
                .trust-sep{width:1px;height:20px;background:var(--borderW)}

                .hero-visual{width:100%;max-width:1060px;margin-top:68px;position:relative;animation:fadeUp 1s 1s var(--ease) both}
                .browser{background:var(--surf);border:1px solid var(--borderW);border-radius:20px;overflow:hidden;box-shadow:0 0 0 1px rgba(70,138,154,.08),0 40px 100px rgba(0,0,0,.55),0 0 80px rgba(70,138,154,.05)}
                .browser-bar{display:flex;align-items:center;gap:8px;padding:14px 20px;background:var(--surf2);border-bottom:1px solid var(--borderW)}
                .bw{width:11px;height:11px;border-radius:50%}
                .bw-r{background:#ff5f57}.bw-y{background:#ffbd2e}.bw-g{background:#28c840}
                .url-pill{flex:1;height:26px;background:rgba(255,255,255,.04);border-radius:7px;margin:0 12px;display:flex;align-items:center;padding:0 12px;gap:6px;font-size:.72rem;color:var(--txt3)}
                .browser-body{display:grid;grid-template-columns:220px 1fr;min-height:360px}
                .b-sidebar{background:var(--bg2);border-right:1px solid var(--borderW);padding:18px 14px;display:flex;flex-direction:column;gap:4px}
                .b-tool{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:9px;font-size:.8rem;font-weight:600;color:var(--txt2);cursor:default;transition:all .2s}
                .b-tool:hover{background:var(--surf2);color:var(--txt)}
                .b-tool.active{background:var(--teal-2);color:var(--teal-l);border:1px solid var(--border)}
                .b-tool-icon{font-size:15px;width:26px;text-align:center}
                .b-sect{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);padding:10px 10px 4px}
                .b-main{padding:22px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-content:start}
                .b-img{border-radius:11px;overflow:hidden;position:relative;aspect-ratio:4/5;border:1px solid var(--borderW)}
                .b-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease)}
                .browser:hover .b-img img{transform:scale(1.03)}
                .b-img-tag{position:absolute;bottom:8px;left:8px;padding:3px 9px;background:rgba(4,8,13,.78);backdrop-filter:blur(8px);border-radius:6px;border:1px solid var(--border);font-size:.68rem;font-weight:700;color:var(--teal-l);letter-spacing:.03em}
                .b-img-tag.ot{color:var(--orange);border-color:rgba(255,122,48,.28)}

                .fc{position:absolute;background:var(--surf);border:1px solid var(--border);border-radius:13px;padding:11px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 36px rgba(0,0,0,.35);font-size:.78rem;font-weight:600;color:var(--txt);white-space:nowrap;z-index:10}
                .fc-icon{font-size:20px;flex-shrink:0}
                .fc-sub{font-size:.7rem;color:var(--txt2);font-weight:400;margin-top:1px}
                .fc1{bottom:30px;left:-28px;animation:fl1 5s ease-in-out infinite}
                .fc2{top:50px;right:-22px;animation:fl2 6s ease-in-out infinite}
                .fc3{bottom:80px;right:-26px;animation:fl1 7s .5s ease-in-out infinite}
                @keyframes fl1{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
                @keyframes fl2{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

                .mq-wrap{overflow:hidden;border-top:1px solid var(--borderW);border-bottom:1px solid var(--borderW);padding:20px 0;background:rgba(70,138,154,.025)}
                .mq-track{display:flex;gap:0;animation:mqroll 40s linear infinite;width:max-content}
                .mq-track:hover{animation-play-state:paused}
                .mi{display:flex;align-items:center;gap:9px;padding:0 32px;font-size:.78rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--txt3);flex-shrink:0;white-space:nowrap}
                .mi .ma{color:var(--teal);font-size:10px}
                .mi.hi .mt{color:var(--teal-l)}
                @keyframes mqroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

                .sec-chip{display:inline-flex;align-items:center;gap:6px;margin-bottom:16px;padding:5px 14px;background:var(--teal-2);border:1px solid var(--border);border-radius:100px;font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-l)}
                .sec-title{font-family:var(--fH);font-size:clamp(2rem,3.2vw,3rem);font-weight:900;letter-spacing:-.03em;line-height:1.08;color:var(--txt)}
                .sec-title .a{color:var(--teal-l)}
                .sec-title .b{color:var(--orange)}
                .sec-desc{font-size:1.02rem;color:var(--txt2);line-height:1.75;max-width:520px;margin-top:14px}

                .value-section{padding:130px 0}
                .value-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:60px;border-radius:20px;overflow:hidden;border:1px solid var(--borderW)}
                .vi{background:var(--surf);padding:48px 40px;position:relative;overflow:hidden;transition:background .3s}
                .vi:hover{background:var(--surf2)}
                .vi::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--teal),transparent);opacity:0;transition:opacity .3s}
                .vi:hover::after{opacity:1}
                .vi.ov::after{background:linear-gradient(90deg,var(--orange),transparent)}
                .v-num{font-family:var(--fH);font-size:4rem;font-weight:900;letter-spacing:-.05em;line-height:1;margin-bottom:10px;background:linear-gradient(135deg,var(--teal-l),rgba(70,138,154,.3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
                .vi.ov .v-num{background:linear-gradient(135deg,var(--orange),rgba(255,122,48,.3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
                .v-title{font-family:var(--fH);font-size:1.25rem;font-weight:800;color:var(--txt);margin-bottom:10px;letter-spacing:-.02em}
                .v-body{font-size:.93rem;color:var(--txt2);line-height:1.7;max-width:380px}

                .tools-section{padding:120px 0;background:linear-gradient(180deg,transparent,rgba(70,138,154,.03) 50%,transparent)}
                .tools-header{margin-bottom:64px}
                .tools-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
                .tc{background:var(--surf);border:1px solid var(--borderW);border-radius:var(--r-card);padding:30px;position:relative;overflow:hidden;transition:all .35s var(--ease);cursor:default}
                .tc::before{content:'';position:absolute;inset:0;background:var(--teal-2);opacity:0;transition:opacity .3s}
                .tc:hover{transform:translateY(-5px);border-color:var(--border);box-shadow:0 20px 60px rgba(0,0,0,.28),0 0 0 1px rgba(70,138,154,.12)}
                .tc:hover::before{opacity:1}
                .tc.feat{border-color:rgba(255,122,48,.22);background:linear-gradient(140deg,var(--surf),rgba(255,122,48,.04))}
                .tc.feat:hover{border-color:rgba(255,122,48,.42)}
                .tc.feat::before{background:var(--orange-2)}
                .tc-ico{width:50px;height:50px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px;position:relative;z-index:1}
                .tc-ico.t{background:var(--teal-2);border:1px solid var(--border)}
                .tc-ico.o{background:var(--orange-2);border:1px solid rgba(255,122,48,.22)}
                .tc h3{font-family:var(--fH);font-size:1.08rem;font-weight:800;color:var(--txt);margin-bottom:9px;position:relative;z-index:1;letter-spacing:-.02em}
                .tc p{font-size:.875rem;color:var(--txt2);line-height:1.68;position:relative;z-index:1}
                .tc-model{display:inline-flex;align-items:center;gap:5px;margin-top:14px;padding:4px 10px;background:rgba(255,255,255,.035);border:1px solid var(--borderW);border-radius:7px;font-size:.68rem;font-weight:700;color:var(--txt3);letter-spacing:.03em;position:relative;z-index:1}
                .tc-model .mdot{width:5px;height:5px;border-radius:50%;background:var(--teal);flex-shrink:0}
                .tc-model.om .mdot{background:var(--orange)}

                .models-section{padding:130px 0}
                .models-layout{display:grid;grid-template-columns:1fr 1.1fr;gap:80px;align-items:center}
                .nano-card{background:linear-gradient(135deg,var(--surf),rgba(70,138,154,.08));border:1px solid rgba(70,138,154,.28);border-radius:22px;padding:36px;position:relative;overflow:hidden;margin-top:36px}
                .nano-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 0% 0%,rgba(70,138,154,.12),transparent 60%);pointer-events:none}
                .nano-logo-row{display:flex;align-items:center;gap:14px;margin-bottom:22px}
                .nano-logo-wrap{width:64px;height:64px;border-radius:16px;overflow:hidden;border:2px solid rgba(70,138,154,.3);background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 24px rgba(0,0,0,.3)}
                .nano-logo-wrap img{width:52px;height:52px;object-fit:contain}
                .nano-emoji-fb{font-size:34px;line-height:1;display:none}
                .nano-title{font-family:var(--fH);font-size:1.5rem;font-weight:900;color:var(--txt);letter-spacing:-.03em}
                .nano-sub{font-size:.82rem;color:var(--txt2);margin-top:2px}
                .nano-body{font-size:.93rem;color:var(--txt2);line-height:1.75}
                .nano-caps{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}
                .nano-cap{background:var(--teal-2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;font-size:.8rem;font-weight:700;color:var(--teal-l);display:flex;align-items:center;gap:7px}
                .models-other{display:flex;flex-direction:column;gap:12px}
                .model-row{display:flex;align-items:center;gap:14px;background:var(--surf);border:1px solid var(--borderW);border-radius:14px;padding:16px 20px;transition:all .3s var(--ease);cursor:default}
                .model-row:hover{border-color:var(--border);transform:translateX(8px);box-shadow:-4px 0 28px rgba(70,138,154,.08)}
                .model-fav{width:40px;height:40px;border-radius:10px;overflow:hidden;background:var(--bg2);border:1px solid var(--borderW);display:flex;align-items:center;justify-content:center;flex-shrink:0}
                .model-fav img{width:28px;height:28px;object-fit:contain;border-radius:4px}
                .mfav-emoji{font-size:20px}
                .model-info{flex:1;min-width:0}
                .model-name{font-family:var(--fH);font-size:.95rem;font-weight:800;color:var(--txt);letter-spacing:-.02em}
                .model-desc{font-size:.78rem;color:var(--txt2);margin-top:2px}
                .mp{flex-shrink:0;padding:3px 10px;border-radius:100px;font-size:.68rem;font-weight:700}
                .mp-t{background:var(--teal-2);color:var(--teal-l);border:1px solid var(--border)}
                .mp-o{background:var(--orange-2);color:var(--orange);border:1px solid rgba(255,122,48,.22)}

                .gen-section{padding:130px 0;background:linear-gradient(180deg,transparent,rgba(255,122,48,.025) 50%,transparent)}
                .gen-layout{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
                .gen-gallery{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:14px}
                .gen-img{border-radius:14px;overflow:hidden;position:relative;border:1px solid var(--borderW)}
                .gen-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease)}
                .gen-img:hover img{transform:scale(1.04)}
                .gen-img.tall{grid-row:span 2}
                .gen-overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:14px;background:linear-gradient(to top,rgba(4,8,13,.85),transparent 50%);opacity:0;transition:opacity .3s}
                .gen-img:hover .gen-overlay{opacity:1}
                .gen-ovt{font-family:var(--fH);font-size:.82rem;font-weight:800;color:var(--txt)}
                .gen-ovs{font-size:.7rem;color:var(--teal-l);margin-top:2px}
                .check-list{margin-top:28px;display:flex;flex-direction:column;gap:12px;list-style:none}
                .check-list li{display:flex;align-items:center;gap:10px;font-size:.9rem;color:var(--txt2)}
                .ck{width:24px;height:24px;background:var(--teal-2);border:1px solid var(--border);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;color:var(--teal-l)}

                .proof-section{padding:80px 0;border-top:1px solid var(--borderW);border-bottom:1px solid var(--borderW)}
                .proof-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}
                .proof-item{background:var(--surf);padding:36px 28px;text-align:center;border:1px solid var(--borderW);transition:background .3s}
                .proof-item:hover{background:var(--surf2)}
                .proof-item:first-child{border-radius:16px 0 0 16px}
                .proof-item:last-child{border-radius:0 16px 16px 0}
                .proof-num{font-family:var(--fH);font-size:2.5rem;font-weight:900;letter-spacing:-.04em;color:var(--teal-l);line-height:1}
                .proof-num.on{color:var(--orange)}
                .proof-label{font-size:.78rem;color:var(--txt3);margin-top:7px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}

                .support-section{padding:120px 0}
                .support-layout{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
                .support-cards{display:flex;flex-direction:column;gap:14px}
                .sup-card{display:flex;align-items:flex-start;gap:16px;background:var(--surf);border:1px solid var(--borderW);border-radius:16px;padding:22px 24px;transition:all .3s var(--ease)}
                .sup-card:hover{border-color:var(--border);transform:translateX(6px);box-shadow:-4px 0 24px rgba(70,138,154,.07)}
                .sup-icon{width:46px;height:46px;border-radius:12px;background:var(--teal-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
                .sup-icon.o{background:var(--orange-2);border-color:rgba(255,122,48,.22)}
                .sup-card-title{font-family:var(--fH);font-size:1rem;font-weight:800;color:var(--txt);letter-spacing:-.02em}
                .sup-card-body{font-size:.85rem;color:var(--txt2);line-height:1.65;margin-top:5px}
                .live-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;background:var(--surf);border:1px solid var(--border);border-radius:100px;font-size:.78rem;font-weight:700;color:var(--teal-l);margin-bottom:24px}
                .live-dot{width:8px;height:8px;background:#22c55e;border-radius:50%;animation:lb 1.5s infinite}
                @keyframes lb{0%,100%{opacity:1}50%{opacity:.3}}

                .testi-section{padding:130px 0}
                .testi-header{text-align:center;margin-bottom:60px}
                .testi-header .sec-desc{margin:14px auto 0}
                .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
                .tcard{background:var(--surf);border:1px solid var(--borderW);border-radius:var(--r-card);padding:28px;transition:all .3s var(--ease)}
                .tcard:hover{border-color:var(--border);transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.25)}
                .tcard-stars{color:var(--orange);font-size:13px;letter-spacing:1px;margin-bottom:14px}
                .tcard-text{font-size:.9rem;color:var(--txt2);line-height:1.72}
                .tcard-author{display:flex;align-items:center;gap:12px;margin-top:20px;padding-top:18px;border-top:1px solid var(--borderW)}
                .tcard-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fH);font-size:.9rem;font-weight:900;color:#fff;flex-shrink:0}
                .tcard-name{font-family:var(--fH);font-size:.88rem;font-weight:800;color:var(--txt);letter-spacing:-.01em}
                .tcard-store{font-size:.73rem;color:var(--txt3);margin-top:1px}

                .cta-section{padding:120px 0}
                .cta-box{background:linear-gradient(135deg,var(--surf) 0%,rgba(70,138,154,.07) 100%);border:1px solid rgba(70,138,154,.22);border-radius:26px;padding:88px 60px;text-align:center;position:relative;overflow:hidden}
                .cta-box::before{content:'';position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(70,138,154,.14),transparent 65%);top:-150px;left:-150px;pointer-events:none}
                .cta-box::after{content:'';position:absolute;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle,rgba(255,122,48,.09),transparent 65%);bottom:-100px;right:-100px;pointer-events:none}
                .cta-box h2{font-family:var(--fH);font-size:clamp(2rem,3.5vw,3.2rem);font-weight:900;letter-spacing:-.035em;position:relative;z-index:1;line-height:1.06}
                .cta-box p{font-size:1.05rem;color:var(--txt2);margin:16px auto 0;max-width:500px;line-height:1.72;position:relative;z-index:1}
                .cta-actions{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:38px;position:relative;z-index:1;flex-wrap:wrap}
                .cta-note{font-size:.77rem;color:var(--txt3);margin-top:16px;position:relative;z-index:1}

                footer{padding:60px 0 36px;border-top:1px solid var(--borderW)}
                .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px}
                .footer-brand p{font-size:.85rem;color:var(--txt3);line-height:1.7;margin-top:12px;max-width:240px}
                .footer-col h4{font-family:var(--fH);font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--txt2);margin-bottom:14px}
                .footer-col ul{list-style:none;display:flex;flex-direction:column;gap:9px}
                .footer-col ul li a{font-size:.85rem;color:var(--txt3);transition:color .2s}
                .footer-col ul li a:hover{color:var(--teal-l)}
                .footer-bottom{margin-top:48px;padding-top:22px;border-top:1px solid var(--borderW);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
                .footer-bottom p{font-size:.78rem;color:var(--txt3)}
                .footer-status{display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--txt3)}
                .status-dot{width:7px;height:7px;border-radius:50%;background:#22c55e}

                .sr{opacity:0;transform:translateY(30px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
                .sr.vis{opacity:1;transform:translateY(0)}
                .sl{opacity:0;transform:translateX(-30px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
                .sl.vis{opacity:1;transform:translateX(0)}
                .sr2{opacity:0;transform:translateX(30px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
                .sr2.vis{opacity:1;transform:translateX(0)}
                @keyframes fadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}

                @media(max-width:960px){
                  .nav-links{display:none}
                  .browser-body{grid-template-columns:1fr}
                  .b-sidebar{display:none}
                  .tools-grid,.models-layout,.gen-layout,.support-layout,.value-grid,.testi-grid,.footer-grid{grid-template-columns:1fr}
                  .proof-grid{grid-template-columns:1fr 1fr}
                  .cta-box{padding:56px 28px}
                  .fc1,.fc2,.fc3{display:none}
                }
                @media(max-width:580px){
                  nav{padding:0 18px}
                  .tools-grid{grid-template-columns:1fr}
                  .testi-grid{grid-template-columns:1fr}
                  .gen-gallery{grid-template-columns:1fr 1fr}
                  .gen-img.tall{grid-row:auto}
                  .b-main{grid-template-columns:1fr 1fr}
                }
            `}} />

            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

            <div className="atmo"><div className="ao1"></div><div className="ao2"></div><div className="ao3"></div></div>
            <div className="grid-bg"></div>
            <div className="noise"></div>
            <div id="progress"></div>

            <div className="wrap">

                <nav id="mainNav">
                    <div className="nav-logo">
                        <div className="logo-mark">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
                        </div>
                        PixelForge AI
                    </div>
                    <ul className="nav-links">
                        <li><a href="#value">Why Us</a></li>
                        <li><a href="#tools">AI Tools</a></li>
                        <li><a href="#models">Models</a></li>
                        <li><a href="#support">Support</a></li>
                    </ul>
                    <div className="nav-right">
                        <button className="btn-ghost">Sign In</button>
                        <button className="btn-cta">Install Free →</button>
                    </div>
                </nav>

                <section className="hero">
                    <div className="container">
                        <div className="hero-chip">
                            <div className="chip-pulse"><div className="chip-dot"></div></div>
                            Shopify's #1 AI Product Photography App
                        </div>

                        <h1>
                            Stop Paying for<br/>
                            <span className="h1-grd">Product Photography.</span><br/>
                            Your <span className="h1-acc">Sales</span> Will Thank You.
                        </h1>

                        <p className="hero-sub">
                            Professional studio-quality images generated in seconds — directly inside your Shopify store.
                            Save thousands. Sell more. Look like a brand worth trusting.
                        </p>

                        <div className="hero-actions">
                            <a href="#" className="btn-hero">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5,3 19,12 5,21"/></svg>
                                Install Free on Shopify
                            </a>
                            <a href="#tools" className="btn-hero-sec">Explore AI Tools &nbsp;↓</a>
                        </div>

                        <div className="trust-row">
                            <div className="trust-badge">
                                <img src="https://favicon.im/shopify.com?larger=true" alt="" onError={(e) => e.target.style.display='none'} />
                                Shopify Native
                            </div>
                            <div className="trust-sep"></div>
                            <div className="trust-badge">
                                <img src="https://favicon.im/replicate.com?larger=true" alt="" onError={(e) => e.target.style.display='none'} />
                                Replicate AI
                            </div>
                            <div className="trust-sep"></div>
                            <div className="trust-badge">🍌 Nano Banana 2</div>
                            <div className="trust-sep"></div>
                            <div className="trust-badge">
                                <img src="https://favicon.im/photoroom.com?larger=true" alt="" onError={(e) => e.target.style.display='none'} />
                                Photoroom API
                            </div>
                        </div>

                        <div className="hero-visual" id="heroVis">
                            <div className="browser">
                                <div className="browser-bar">
                                    <div className="bw bw-r"></div><div className="bw bw-y"></div><div className="bw bw-g"></div>
                                    <div className="url-pill">🔒 &nbsp;apps.shopify.com / pixelforge-ai</div>
                                </div>
                                <div className="browser-body">
                                    <div className="b-sidebar">
                                        <div className="b-sect">AI Tools</div>
                                        <div className="b-tool active"><span className="b-tool-icon">✂️</span> Background Remover</div>
                                        <div className="b-tool"><span className="b-tool-icon">🪄</span> Magic Eraser</div>
                                        <div className="b-tool"><span className="b-tool-icon">💡</span> Lighting Fix</div>
                                        <div className="b-tool"><span className="b-tool-icon">🔍</span> Upscaler 8×</div>
                                        <div className="b-tool"><span className="b-tool-icon">✨</span> Enhancer</div>
                                        <div className="b-tool"><span className="b-tool-icon">⚡</span> Compressor</div>
                                        <div className="b-sect">Lab</div>
                                        <div className="b-tool"><span className="b-tool-icon">🧪</span> Product AI Lab</div>
                                        <div className="b-tool"><span className="b-tool-icon">🖼️</span> Gallery</div>
                                    </div>
                                    <div className="b-main">
                                        <div className="b-img">
                                            <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=360&h=460&fit=crop&auto=format" alt="Watch" loading="lazy" />
                                            <div className="b-img-tag">✨ Enhanced</div>
                                        </div>
                                        <div className="b-img">
                                            <img src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=360&h=460&fit=crop&auto=format" alt="Perfume" loading="lazy" />
                                            <div className="b-img-tag ot">💡 Relit</div>
                                        </div>
                                        <div className="b-img">
                                            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=360&h=460&fit=crop&auto=format" alt="Shoes" loading="lazy" />
                                            <div className="b-img-tag">✂️ BG Removed</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="fc fc1">
                                <div className="fc-icon">🍌</div>
                                <div><div>Nano Banana 2</div><div className="fc-sub">Inpainting model active</div></div>
                            </div>
                            <div className="fc fc2">
                                <div className="fc-icon">⚡</div>
                                <div><div>Processing… 2s</div><div className="fc-sub">Real-time generation</div></div>
                            </div>
                            <div className="fc fc3">
                                <div className="fc-icon">📈</div>
                                <div><div>+34% Conversion</div><div className="fc-sub">Avg. merchant uplift</div></div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mq-wrap">
                    <div className="mq-track">
                        <div className="mi hi"><span className="ma">★</span><span className="mt">Save on Photography Costs</span></div>
                        <div className="mi"><span className="ma">✦</span><span>Nano Banana 2 Inpainting</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">Grow Your Shopify Sales</span></div>
                        <div className="mi"><span className="ma">✦</span><span>IC-Light Relighting</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">Professional Images in Seconds</span></div>
                        <div className="mi"><span className="ma">✦</span><span>RestoreFormer v1.4</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">8× AI Upscaling</span></div>
                        <div className="mi"><span className="ma">✦</span><span>24/7 Live Support</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">No Photographer Needed</span></div>
                        <div className="mi"><span className="ma">✦</span><span>Replicate + Photoroom</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">Save on Photography Costs</span></div>
                        <div className="mi"><span className="ma">✦</span><span>Nano Banana 2 Inpainting</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">Grow Your Shopify Sales</span></div>
                        <div className="mi"><span className="ma">✦</span><span>IC-Light Relighting</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">Professional Images in Seconds</span></div>
                        <div className="mi"><span className="ma">✦</span><span>RestoreFormer v1.4</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">8× AI Upscaling</span></div>
                        <div className="mi"><span className="ma">✦</span><span>24/7 Live Support</span></div>
                        <div className="mi hi"><span className="ma">★</span><span className="mt">No Photographer Needed</span></div>
                        <div className="mi"><span className="ma">✦</span><span>Replicate + Photoroom</span></div>
                    </div>
                </div>

                <section className="value-section" id="value">
                    <div className="container">
                        <div className="sr" style={{textAlign: 'center'}}>
                            <div className="sec-chip">✦ Why Merchants Choose Us</div>
                            <h2 className="sec-title">We Don't Just Generate Images.<br/>We <span className="a">Grow Your Business.</span></h2>
                            <p className="sec-desc" style={{margin: '14px auto 0'}}>Every feature is built around one goal — making your products look so compelling that customers can't help but buy.</p>
                        </div>
                        <div className="value-grid sr" style={{transitionDelay: '.1s'}}>
                            <div className="vi">
                                <div className="v-num">$0</div>
                                <div className="v-title">No Photographer. Ever Again.</div>
                                <p className="v-body">A single product shoot costs $500–$3,000. With PixelForge AI you get studio-quality results on demand, inside Shopify, in under 10 seconds. Keep that money in your business.</p>
                            </div>
                            <div className="vi ov">
                                <div className="v-num">+34%</div>
                                <div className="v-title">Average Conversion Uplift</div>
                                <p className="v-body">Better product images directly translate to higher add-to-cart rates. Our merchants report measurable sales growth within the first week — not months.</p>
                            </div>
                            <div className="vi ov">
                                <div className="v-num">10s</div>
                                <div className="v-title">From Raw Shot to Studio-Ready</div>
                                <p className="v-body">Submit a photo. Our AI pipeline — Nano Banana 2, IC-Light, RestoreFormer — processes it in the background and delivers a professional result in under 10 seconds.</p>
                            </div>
                            <div className="vi">
                                <div className="v-num">∞</div>
                                <div className="v-title">Scale Without Limits</div>
                                <p className="v-body">Launching 100 new SKUs? Our async queue handles every image in the background so you never have to stop working while photos are being generated.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="tools-section" id="tools">
                    <div className="container">
                        <div className="tools-header sr">
                            <div className="sec-chip">🛠 The Toolkit</div>
                            <h2 className="sec-title">Six AI Tools.<br/><span className="a">One Embedded App.</span></h2>
                            <p className="sec-desc">Everything you need to create product images that compete with the biggest brands on the internet — without leaving Shopify.</p>
                        </div>
                        <div className="tools-grid" id="toolsGrid">
                            <div className="tc feat">
                                <div className="tc-ico o">🪄</div>
                                <h3>Magic Eraser</h3>
                                <p>Remove distracting objects, background clutter, or imperfections from any product image. AI-powered inpainting that understands context — not just pixels.</p>
                                <div className="tc-model om"><span className="mdot"></span> Nano Banana 2 — Replicate Inpainting</div>
                            </div>
                            <div className="tc">
                                <div className="tc-ico t">✂️</div>
                                <h3>Background Remover</h3>
                                <p>Clean, pixel-perfect product cutouts in one click. Ready for white backgrounds, custom scenes, or brand-matched colour palettes that boost marketplace conversion.</p>
                                <div className="tc-model"><span className="mdot"></span> Replicate API + Photoroom Fallback</div>
                            </div>
                            <div className="tc">
                                <div className="tc-ico t">🔍</div>
                                <h3>Image Upscaler — 8×</h3>
                                <p>Turn low-resolution product photos into razor-sharp, print-ready images. AI synthesises realistic detail that wasn't there before — customers see every stitch and grain.</p>
                                <div className="tc-model"><span className="mdot"></span> Nano Banana 2 — Super Resolution</div>
                            </div>
                            <div className="tc">
                                <div className="tc-ico t">✨</div>
                                <h3>Image Enhancer</h3>
                                <p>Auto-correct exposure, colour, sharpness and noise in one click. Trained on professional photography standards so every result looks natural and intentional.</p>
                                <div className="tc-model"><span className="mdot"></span> RestoreFormer v1.4 / v1.3</div>
                            </div>
                            <div className="tc">
                                <div className="tc-ico t">⚡</div>
                                <h3>Image Compressor</h3>
                                <p>Reduce file size without hurting visual quality. Faster load speeds improve Core Web Vitals, Shopify store ranking, and ultimately — your conversion rate.</p>
                                <div className="tc-model"><span className="mdot"></span> Intelligent GD Compression</div>
                            </div>
                            <div className="tc feat">
                                <div className="tc-ico o">💡</div>
                                <h3>AI Lighting Fix</h3>
                                <p>Apply any of 50+ professional studio lighting presets to existing photos. Transform flat, lifeless images into dramatic, atmospheric product shots that stop the scroll.</p>
                                <div className="tc-model om"><span className="mdot"></span> IC-Light Model — 50+ Presets</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="models-section" id="models">
                    <div className="container">
                        <div className="models-layout">
                            <div className="sl">
                                <div className="sec-chip">🧠 AI Power</div>
                                <h2 className="sec-title">Built on the<br/>World's Best <span className="a">AI Models</span></h2>
                                <p className="sec-desc">We hand-selected, tested, and integrated the most capable open-source and commercial AI models available. Your products always get the best possible result.</p>

                                <div className="nano-card">
                                    <div className="nano-logo-row">
                                        <div className="nano-logo-wrap">
                                            <img src="https://tjzk.replicate.delivery/models_models_cover_image/3b9a2b26-bfb7-4ec1-a2db-1ac9db48b3b0/banana.png" alt="Nano Banana 2" onError={(e) => {e.target.style.display='none'; document.getElementById('nanoEmoji').style.display='flex'}} />
                                            <div id="nanoEmoji" className="nano-emoji-fb" style={{display: 'none'}}>🍌</div>
                                        </div>
                                        <div>
                                            <div className="nano-title">Nano Banana 2</div>
                                            <div className="nano-sub">via Replicate&nbsp;·&nbsp;Inpainting & Super-Resolution</div>
                                        </div>
                                    </div>
                                    <p className="nano-body">The core model powering our Magic Eraser and 8× Upscaler. An ultra-fast inpainting and super-resolution model that delivers clean, detailed commercial-grade results — typically in under 10 seconds.</p>
                                    <div className="nano-caps">
                                        <div className="nano-cap"><span>🪄</span> Magic Eraser</div>
                                        <div className="nano-cap"><span>🔍</span> 8× Upscaling</div>
                                        <div className="nano-cap"><span>⚡</span> Sub-10s Results</div>
                                        <div className="nano-cap"><span>🎯</span> Commercial Grade</div>
                                    </div>
                                </div>
                            </div>

                            <div className="sr2">
                                <div className="models-other">
                                    <div className="model-row">
                                        <div className="model-fav">
                                            <img src="https://favicon.im/replicate.com?larger=true" alt="" onError={(e) => {e.style.display='none'; e.nextElementSibling.style.display='block'}} />
                                            <span className="mfav-emoji" style={{display: 'none'}}>🔄</span>
                                        </div>
                                        <div className="model-info">
                                            <div className="model-name">Replicate Platform</div>
                                            <div className="model-desc">Infrastructure running all our AI models with auto-scaling and fast cold-start</div>
                                        </div>
                                        <span className="mp mp-t">Platform</span>
                                    </div>

                                    <div className="model-row">
                                        <div className="model-fav"><span className="mfav-emoji">💡</span></div>
                                        <div className="model-info">
                                            <div className="model-name">IC-Light</div>
                                            <div className="model-desc">State-of-the-art image relighting with 50+ professional studio preset modes</div>
                                        </div>
                                        <span className="mp mp-o">Lighting Fix</span>
                                    </div>

                                    <div className="model-row">
                                        <div className="model-fav"><span className="mfav-emoji">🔬</span></div>
                                        <div className="model-info">
                                            <div className="model-name">RestoreFormer v1.4</div>
                                            <div className="model-desc">Advanced product restoration and auto quality + detail enhancement</div>
                                        </div>
                                        <span className="mp mp-t">Enhancer</span>
                                    </div>

                                    <div className="model-row">
                                        <div className="model-fav">
                                            <img src="https://favicon.im/photoroom.com?larger=true" alt="" onError={(e) => {e.style.display='none'; e.nextElementSibling.style.display='block'}} />
                                            <span className="mfav-emoji" style={{display: 'none'}}>🏠</span>
                                        </div>
                                        <div className="model-info">
                                            <div className="model-name">Photoroom API</div>
                                            <div className="model-desc">Commercial-grade fallback ensuring 99.9% background removal uptime</div>
                                        </div>
                                        <span className="mp mp-t">BG Remove</span>
                                    </div>

                                    <div className="model-row">
                                        <div className="model-fav">
                                            <img src="https://favicon.im/shopify.com?larger=true" alt="" onError={(e) => {e.style.display='none'; e.nextElementSibling.style.display='block'}} />
                                            <span className="mfav-emoji" style={{display: 'none'}}>🛍️</span>
                                        </div>
                                        <div className="model-info">
                                            <div className="model-name">Shopify Native Embed</div>
                                            <div className="model-desc">Full OAuth integration — no external tabs, no copy-paste, no friction</div>
                                        </div>
                                        <span className="mp mp-o">Native</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="gen-section" id="generation">
                    <div className="container">
                        <div className="gen-layout">
                            <div className="sl">
                                <div className="sec-chip">🖼 AI Generation</div>
                                <h2 className="sec-title">Go Beyond Editing.<br/><span className="b">Generate.</span></h2>
                                <p className="sec-desc">Don't just fix your photos — create entirely new product scenes, lifestyle contexts, and virtual environments. Our AI generates images no photographer could replicate at this speed or cost.</p>
                                <ul className="check-list">
                                    <li><span className="ck">✓</span> Virtual Try-On for any product category</li>
                                    <li><span className="ck">✓</span> Universal product scene generation</li>
                                    <li><span className="ck">✓</span> Lifestyle backgrounds matched to your brand</li>
                                    <li><span className="ck">✓</span> Async processing — never blocks your workflow</li>
                                    <li><span className="ck">✓</span> Assign generated images directly to product listings</li>
                                </ul>
                                <div style={{marginTop: '32px'}}>
                                    <a href="#" className="btn-hero-sec">Explore Product AI Lab →</a>
                                </div>
                            </div>

                            <div className="gen-gallery sr2">
                                <div className="gen-img tall" style={{aspectRatio: '4/7'}}>
                                    <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=700&fit=crop&auto=format" alt="Generated scene" loading="lazy" />
                                    <div className="gen-overlay"><div className="gen-ovt">Scene Generated</div><div className="gen-ovs">Product AI Lab</div></div>
                                </div>
                                <div className="gen-img" style={{aspectRatio: '1'}}>
                                    <img src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=340&h=340&fit=crop&auto=format" alt="Lifestyle context" loading="lazy" />
                                    <div className="gen-overlay"><div className="gen-ovt">Lifestyle Context</div><div className="gen-ovs">Virtual Environment</div></div>
                                </div>
                                <div className="gen-img" style={{aspectRatio: '1'}}>
                                    <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=340&h=340&fit=crop&auto=format" alt="Studio scene" loading="lazy" />
                                    <div className="gen-overlay"><div className="gen-ovt">Studio Scene</div><div className="gen-ovs">IC-Light + BG Gen</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="proof-section sr">
                    <div className="container">
                        <div className="proof-grid" id="proofGrid">
                            <div className="proof-item">
                                <div className="proof-num" data-target="50" data-suffix="+">50+</div>
                                <div className="proof-label">Lighting Presets</div>
                            </div>
                            <div className="proof-item">
                                <div className="proof-num on" data-target="8" data-suffix="×">8×</div>
                                <div className="proof-label">Max Upscale Factor</div>
                            </div>
                            <div className="proof-item">
                                <div className="proof-num" data-target="6" data-suffix="">6</div>
                                <div className="proof-label">AI Tools Included</div>
                            </div>
                            <div className="proof-item">
                                <div className="proof-num on" data-target="10" data-suffix="s">10s</div>
                                <div className="proof-label">Average Process Time</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="support-section" id="support">
                    <div className="container">
                        <div className="support-layout">
                            <div className="sl">
                                <div className="live-badge"><span className="live-dot"></span> Live support is online now</div>
                                <div className="sec-chip">💬 Always Here</div>
                                <h2 className="sec-title">24/7 Support.<br/><span className="a">Right Inside</span><br/>Your Store.</h2>
                                <p className="sec-desc">You'll never feel stuck. Our team is available around the clock, directly inside your Shopify dashboard. No email chains. No wait times. Real people, really fast.</p>
                                <div style={{marginTop: '32px'}}><a href="#" className="btn-hero">Start Live Chat →</a></div>
                            </div>
                            <div className="support-cards sr2">
                                <div className="sup-card">
                                    <div className="sup-icon">💬</div>
                                    <div>
                                        <div className="sup-card-title">Live Chat Inside the App</div>
                                        <p className="sup-card-body">Chat with a real agent without leaving your Shopify dashboard. Instant answers, no screenshots to email, no context lost in translation.</p>
                                    </div>
                                </div>
                                <div className="sup-card">
                                    <div className="sup-icon o">🎫</div>
                                    <div>
                                        <div className="sup-card-title">Ticket System</div>
                                        <p className="sup-card-body">Submit detailed tickets for complex issues. Our team responds with actual solutions — not templated replies telling you to "clear your cache."</p>
                                    </div>
                                </div>
                                <div className="sup-card">
                                    <div className="sup-icon">📚</div>
                                    <div>
                                        <div className="sup-card-title">Help Documentation</div>
                                        <p className="sup-card-body">Step-by-step guides for every tool and workflow. Searchable, visual, and updated whenever we ship new features.</p>
                                    </div>
                                </div>
                                <div className="sup-card">
                                    <div className="sup-icon o">🔔</div>
                                    <div>
                                        <div className="sup-card-title">Real-Time Job Notifications</div>
                                        <p className="sup-card-body">WebSocket-powered live updates tell you the moment your image is ready. No refreshing. No wondering. Just results delivered instantly.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="testi-section" id="reviews">
                    <div className="container">
                        <div className="testi-header sr">
                            <div className="sec-chip">⭐ Merchant Reviews</div>
                            <h2 className="sec-title">Real Stores. <span className="a">Real Results.</span></h2>
                            <p className="sec-desc">Merchants in fashion, beauty, electronics, and home goods use PixelForge AI to compete with brands 10× their size.</p>
                        </div>
                        <div className="testi-grid">
                            <div className="tcard sr">
                                <div className="tcard-stars">★★★★★</div>
                                <p className="tcard-text">"We cancelled our monthly photographer retainer the same week we installed this. The IC-Light relighting is shockingly good — our jewellery has never looked this professional online."</p>
                                <div className="tcard-author">
                                    <div className="tcard-av" style={{background: 'linear-gradient(135deg,#468A9A,#64afc2)'}}>S</div>
                                    <div><div className="tcard-name">Sarah K.</div><div className="tcard-store">Luxe Beauty Co. — Shopify Plus</div></div>
                                </div>
                            </div>
                            <div className="tcard sr" style={{transitionDelay: '.1s'}}>
                                <div className="tcard-stars">★★★★★</div>
                                <p className="tcard-text">"The Nano Banana 2 magic eraser is the real deal. I removed price-tag stickers from 40 watch photos in under 10 minutes. That used to take me half a day in Photoshop."</p>
                                <div className="tcard-author">
                                    <div className="tcard-av" style={{background: 'linear-gradient(135deg,#FF7A30,#ff9655)'}}>M</div>
                                    <div><div className="tcard-name">Marcus T.</div><div className="tcard-store">Gold & Stone Watches</div></div>
                                </div>
                            </div>
                            <div className="tcard sr" style={{transitionDelay: '.2s'}}>
                                <div className="tcard-stars">★★★★★</div>
                                <p className="tcard-text">"The 8× upscaler saved our entire product catalogue. We only had low-res supplier photos and the AI made them look like we shot everything ourselves. Add-to-cart went up 28%."</p>
                                <div className="tcard-author">
                                    <div className="tcard-av" style={{background: 'linear-gradient(135deg,#5a4adc,#8a7aff)'}}>A</div>
                                    <div><div className="tcard-name">Aisha R.</div><div className="tcard-store">StreetWear Republic</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="cta-section sr">
                    <div className="container">
                        <div className="cta-box">
                            <h2>Your Products Deserve to<br/><span style={{color: 'var(--teal-l)'}}>Look Their Absolute Best.</span></h2>
                            <p>Install PixelForge AI today — free to start, no credit card required. Your first professional product images are ready in under two minutes.</p>
                            <div className="cta-actions">
                                <a href="#" className="btn-hero">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5,3 19,12 5,21"/></svg>
                                    Install Free on Shopify
                                </a>
                                <a href="#" className="btn-hero-sec">Schedule a Demo →</a>
                            </div>
                            <p className="cta-note">Free plan available&nbsp;·&nbsp;No credit card required&nbsp;·&nbsp;2-minute setup&nbsp;·&nbsp;24/7 support included</p>
                        </div>
                    </div>
                </section>

                <footer>
                    <div className="container">
                        <div className="footer-grid">
                            <div className="footer-brand">
                                <div className="nav-logo">
                                    <div className="logo-mark">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2l9 5v10l-9 5-9-5V7z"/></svg>
                                    </div>
                                    PixelForge AI
                                </div>
                                <p>Professional AI product photography for Shopify merchants. Powered by Nano Banana 2, IC-Light, RestoreFormer, Replicate, and Photoroom.</p>
                            </div>
                            <div className="footer-col">
                                <h4>Product</h4>
                                <ul>
                                    <li><a href="#">Magic Eraser</a></li>
                                    <li><a href="#">Background Remover</a></li>
                                    <li><a href="#">Image Upscaler</a></li>
                                    <li><a href="#">Lighting Fix</a></li>
                                    <li><a href="#">Product AI Lab</a></li>
                                </ul>
                            </div>
                            <div className="footer-col">
                                <h4>Company</h4>
                                <ul>
                                    <li><a href="#">About</a></li>
                                    <li><a href="#">Blog</a></li>
                                    <li><a href="#">Changelog</a></li>
                                    <li><a href="#">Shopify App Store</a></li>
                                </ul>
                            </div>
                            <div className="footer-col">
                                <h4>Support</h4>
                                <ul>
                                    <li><a href="#">Live Chat</a></li>
                                    <li><a href="#">Documentation</a></li>
                                    <li><a href="#">Submit Ticket</a></li>
                                    <li><a href="#">Privacy Policy</a></li>
                                    <li><a href="#">Terms of Service</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="footer-bottom">
                            <p>© 2025 PixelForge AI. All rights reserved. Built for Shopify merchants worldwide.</p>
                            <div className="footer-status"><div className="status-dot"></div> All systems operational</div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}
