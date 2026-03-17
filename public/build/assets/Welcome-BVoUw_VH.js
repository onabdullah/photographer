import{r as N,j as e}from"./react-BHrScvB_.js";import{H as y}from"./inertia-DhWMRYOf.js";function I(){return N.useEffect(()=>{const b=document.getElementById("scrollProgress"),l=()=>{const r=document.body.scrollHeight-window.innerHeight;b.style.width=window.scrollY/r*100+"%"};window.addEventListener("scroll",l);const d=new IntersectionObserver(r=>{r.forEach((s,t)=>{s.isIntersecting&&(setTimeout(()=>s.target.classList.add("visible"),t*80),d.unobserve(s.target))})},{threshold:.12});document.querySelectorAll(".fade-up").forEach(r=>d.observe(r));const c=new IntersectionObserver(r=>{r.forEach(s=>{s.isIntersecting&&(s.target.querySelectorAll(".tool-card").forEach((a,i)=>{a.style.opacity=0,a.style.transform="translateY(28px)",a.style.transition=`opacity 0.6s ${i*.1}s ease, transform 0.6s ${i*.1}s ease`,requestAnimationFrame(()=>{a.style.opacity=1,a.style.transform="translateY(0)"})}),c.unobserve(s.target))})},{threshold:.1}),m=document.querySelector(".tools-grid");m&&c.observe(m);const p=new IntersectionObserver(r=>{r.forEach(s=>{s.isIntersecting&&(s.target.querySelectorAll(".model-card-item").forEach((a,i)=>{a.style.opacity=0,a.style.transform="translateX(20px)",a.style.transition=`opacity 0.5s ${i*.1}s ease, transform 0.5s ${i*.1}s ease`,requestAnimationFrame(()=>{a.style.opacity=1,a.style.transform="translateX(0)"})}),p.unobserve(s.target))})},{threshold:.1}),h=document.querySelector(".models-stack");h&&p.observe(h);function u(r,s,t){let a=0;const i=1800,o=n=>{a||(a=n);const v=Math.min((n-a)/i,1),j=1-Math.pow(1-v,3);r.textContent=Math.floor(j*s)+t,v<1&&requestAnimationFrame(o)};requestAnimationFrame(o)}const x=new IntersectionObserver(r=>{r.forEach(s=>{s.isIntersecting&&(s.target.querySelectorAll(".highlight-num").forEach(a=>{const i=a.textContent,o=parseInt(i),n=i.replace(o,"");u(a,o,n)}),x.unobserve(s.target))})},{threshold:.5}),g=document.querySelector(".highlights-grid");g&&x.observe(g);const f=()=>{const r=document.getElementById("heroVisual");r&&(r.style.transform=`translateY(${window.scrollY*.08}px)`)};return window.addEventListener("scroll",f),()=>{window.removeEventListener("scroll",l),window.removeEventListener("scroll",f)}},[]),e.jsxs(e.Fragment,{children:[e.jsx(y,{title:"PixelForge AI — Professional Product Photography for Shopify"}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
                /* ============================================================
                   DESIGN TOKENS
                ============================================================ */
                :root {
                  --teal:        #468A9A;
                  --teal-light:  #5a9faf;
                  --teal-muted:  rgba(70,138,154,0.12);
                  --teal-glow:   rgba(70,138,154,0.35);
                  --orange:      #FF7A30;
                  --orange-hover:#E56218;
                  --orange-muted:rgba(255,122,48,0.12);
                  --bg:          #050A0F;
                  --bg2:         #080E15;
                  --surface:     #0D1620;
                  --surface2:    #111d2b;
                  --border:      rgba(70,138,154,0.18);
                  --border-soft: rgba(255,255,255,0.06);
                  --text:        #F0F6FA;
                  --text-muted:  #7a9ab0;
                  --text-dim:    #3d5a6e;
                  --radius-card: 16px;
                  --radius-btn:  10px;
                  --font-head:   'Syne', sans-serif;
                  --font-body:   'DM Sans', sans-serif;
                  --ease:        cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                /* ============================================================
                   RESET & BASE
                ============================================================ */
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html { scroll-behavior: smooth; font-size: 16px; }
                body {
                  background: var(--bg);
                  color: var(--text);
                  font-family: var(--font-body);
                  overflow-x: hidden;
                  -webkit-font-smoothing: antialiased;
                }
                a { text-decoration: none; color: inherit; }
                img { max-width: 100%; display: block; }
                ::selection { background: var(--teal); color: white; }

                /* ============================================================
                   SCROLLBAR
                ============================================================ */
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: var(--bg); }
                ::-webkit-scrollbar-thumb { background: var(--teal); border-radius: 4px; }

                /* ============================================================
                   ANIMATED GRADIENT NOISE BACKGROUND
                ============================================================ */
                .bg-canvas {
                  position: fixed;
                  inset: 0;
                  z-index: 0;
                  pointer-events: none;
                  overflow: hidden;
                }
                .bg-canvas::before {
                  content: '';
                  position: absolute;
                  width: 900px; height: 900px;
                  border-radius: 50%;
                  background: radial-gradient(circle, rgba(70,138,154,0.15) 0%, transparent 70%);
                  top: -300px; left: -200px;
                  animation: orb1 18s ease-in-out infinite alternate;
                }
                .bg-canvas::after {
                  content: '';
                  position: absolute;
                  width: 700px; height: 700px;
                  border-radius: 50%;
                  background: radial-gradient(circle, rgba(255,122,48,0.10) 0%, transparent 70%);
                  bottom: -200px; right: -100px;
                  animation: orb2 22s ease-in-out infinite alternate;
                }
                @keyframes orb1 {
                  0%   { transform: translate(0,0) scale(1); }
                  100% { transform: translate(120px, 80px) scale(1.2); }
                }
                @keyframes orb2 {
                  0%   { transform: translate(0,0) scale(1); }
                  100% { transform: translate(-80px, -100px) scale(1.15); }
                }
                .noise-layer {
                  position: fixed;
                  inset: 0;
                  z-index: 1;
                  pointer-events: none;
                  opacity: 0.025;
                  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                  background-size: 256px 256px;
                }
                .main-content { position: relative; z-index: 2; }

                /* ============================================================
                   GRID LINES (Decorative)
                ============================================================ */
                .grid-overlay {
                  position: fixed;
                  inset: 0;
                  z-index: 1;
                  pointer-events: none;
                  background-image:
                    linear-gradient(rgba(70,138,154,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(70,138,154,0.04) 1px, transparent 1px);
                  background-size: 60px 60px;
                }

                /* ============================================================
                   NAVIGATION
                ============================================================ */
                nav {
                  position: fixed;
                  top: 0; left: 0; right: 0;
                  z-index: 100;
                  padding: 0 40px;
                  height: 68px;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  background: rgba(5,10,15,0.6);
                  backdrop-filter: blur(20px) saturate(1.5);
                  -webkit-backdrop-filter: blur(20px) saturate(1.5);
                  border-bottom: 1px solid var(--border-soft);
                  animation: navSlide 0.7s var(--ease) both;
                }
                @keyframes navSlide {
                  from { transform: translateY(-100%); opacity: 0; }
                  to   { transform: translateY(0);    opacity: 1; }
                }
                .nav-logo {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  font-family: var(--font-head);
                  font-weight: 800;
                  font-size: 1.25rem;
                  letter-spacing: -0.02em;
                  color: var(--text);
                }
                .nav-logo .logo-icon {
                  width: 34px; height: 34px;
                  background: linear-gradient(135deg, var(--teal), var(--orange));
                  border-radius: 9px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 16px;
                }
                .nav-links {
                  display: flex;
                  align-items: center;
                  gap: 32px;
                  list-style: none;
                }
                .nav-links a {
                  font-size: 0.875rem;
                  font-weight: 500;
                  color: var(--text-muted);
                  transition: color 0.2s;
                }
                .nav-links a:hover { color: var(--text); }
                .nav-cta {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                }
                .btn-ghost {
                  padding: 8px 18px;
                  font-family: var(--font-body);
                  font-size: 0.875rem;
                  font-weight: 500;
                  color: var(--text-muted);
                  border-radius: var(--radius-btn);
                  border: 1px solid var(--border-soft);
                  background: transparent;
                  cursor: pointer;
                  transition: all 0.2s;
                }
                .btn-ghost:hover { color: var(--text); border-color: var(--border); }
                .btn-primary {
                  padding: 9px 22px;
                  font-family: var(--font-body);
                  font-size: 0.875rem;
                  font-weight: 600;
                  color: white;
                  background: var(--orange);
                  border: none;
                  border-radius: var(--radius-btn);
                  cursor: pointer;
                  transition: all 0.25s var(--ease);
                  position: relative;
                  overflow: hidden;
                }
                .btn-primary::after {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background: rgba(255,255,255,0.12);
                  opacity: 0;
                  transition: opacity 0.2s;
                }
                .btn-primary:hover { background: var(--orange-hover); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,122,48,0.35); }
                .btn-primary:hover::after { opacity: 1; }

                /* ============================================================
                   HERO SECTION
                ============================================================ */
                .hero {
                  min-height: 100vh;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                  padding: 120px 24px 80px;
                  position: relative;
                }
                .hero-badge {
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 6px 16px;
                  background: var(--teal-muted);
                  border: 1px solid var(--border);
                  border-radius: 100px;
                  font-size: 0.78rem;
                  font-weight: 600;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                  color: var(--teal-light);
                  margin-bottom: 32px;
                  animation: fadeUp 0.8s 0.2s var(--ease) both;
                }
                .hero-badge .dot {
                  width: 6px; height: 6px;
                  background: var(--teal-light);
                  border-radius: 50%;
                  animation: pulse-dot 2s infinite;
                }
                @keyframes pulse-dot {
                  0%,100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.5; transform: scale(0.8); }
                }
                .hero h1 {
                  font-family: var(--font-head);
                  font-size: clamp(2.8rem, 6vw, 5.5rem);
                  font-weight: 800;
                  line-height: 1.06;
                  letter-spacing: -0.03em;
                  max-width: 900px;
                  animation: fadeUp 0.9s 0.35s var(--ease) both;
                }
                .hero h1 .word-ai {
                  background: linear-gradient(135deg, var(--teal-light) 0%, #a8d8e2 50%, var(--orange) 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                  position: relative;
                }
                .hero-sub {
                  font-size: clamp(1rem, 1.8vw, 1.2rem);
                  color: var(--text-muted);
                  max-width: 600px;
                  line-height: 1.7;
                  margin-top: 24px;
                  font-weight: 400;
                  animation: fadeUp 0.9s 0.5s var(--ease) both;
                }
                .hero-actions {
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  margin-top: 40px;
                  flex-wrap: wrap;
                  justify-content: center;
                  animation: fadeUp 0.9s 0.65s var(--ease) both;
                }
                .btn-hero-primary {
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 14px 32px;
                  font-family: var(--font-body);
                  font-weight: 600;
                  font-size: 1rem;
                  color: white;
                  background: linear-gradient(135deg, var(--orange), #ff9a5c);
                  border: none;
                  border-radius: 12px;
                  cursor: pointer;
                  transition: all 0.3s var(--ease);
                  box-shadow: 0 4px 24px rgba(255,122,48,0.4);
                }
                .btn-hero-primary:hover {
                  transform: translateY(-3px);
                  box-shadow: 0 12px 40px rgba(255,122,48,0.5);
                }
                .btn-hero-secondary {
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 14px 32px;
                  font-family: var(--font-body);
                  font-weight: 500;
                  font-size: 1rem;
                  color: var(--text);
                  background: transparent;
                  border: 1px solid var(--border);
                  border-radius: 12px;
                  cursor: pointer;
                  transition: all 0.3s var(--ease);
                }
                .btn-hero-secondary:hover {
                  border-color: var(--teal);
                  color: var(--teal-light);
                  background: var(--teal-muted);
                }
                .hero-stats {
                  display: flex;
                  align-items: center;
                  gap: 40px;
                  margin-top: 64px;
                  animation: fadeUp 0.9s 0.8s var(--ease) both;
                  flex-wrap: wrap;
                  justify-content: center;
                }
                .hero-stat { text-align: center; }
                .hero-stat .num {
                  font-family: var(--font-head);
                  font-size: 2rem;
                  font-weight: 800;
                  color: var(--text);
                  line-height: 1;
                }
                .hero-stat .num span { color: var(--teal-light); }
                .hero-stat .label { font-size: 0.8rem; color: var(--text-dim); margin-top: 4px; font-weight: 500; letter-spacing: 0.04em; }
                .hero-stat-divider { width: 1px; height: 36px; background: var(--border-soft); }

                /* ============================================================
                   HERO DEMO / IMAGE SHOWCASE
                ============================================================ */
                .hero-visual {
                  margin-top: 72px;
                  width: 100%;
                  max-width: 1100px;
                  animation: fadeUp 1s 1s var(--ease) both;
                  position: relative;
                }
                .demo-window {
                  background: var(--surface);
                  border: 1px solid var(--border-soft);
                  border-radius: 20px;
                  overflow: hidden;
                  box-shadow:
                    0 0 0 1px rgba(70,138,154,0.1),
                    0 40px 100px rgba(0,0,0,0.5),
                    0 0 80px rgba(70,138,154,0.06);
                }
                .demo-topbar {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 14px 20px;
                  background: var(--surface2);
                  border-bottom: 1px solid var(--border-soft);
                }
                .demo-dot { width: 11px; height: 11px; border-radius: 50%; }
                .demo-dot.red { background: #ff5f57; }
                .demo-dot.yellow { background: #ffbd2e; }
                .demo-dot.green { background: #28c840; }
                .demo-bar {
                  flex: 1;
                  height: 26px;
                  background: rgba(255,255,255,0.04);
                  border-radius: 6px;
                  margin: 0 16px;
                }
                .demo-body {
                  padding: 28px;
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 16px;
                }
                .demo-card {
                  aspect-ratio: 4/5;
                  border-radius: 12px;
                  overflow: hidden;
                  position: relative;
                  border: 1px solid var(--border-soft);
                  background: var(--bg2);
                }
                .demo-card img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  transition: transform 0.6s var(--ease);
                }
                .demo-card:hover img { transform: scale(1.04); }
                .demo-card-label {
                  position: absolute;
                  bottom: 10px;
                  left: 10px;
                  padding: 4px 10px;
                  background: rgba(5,10,15,0.8);
                  backdrop-filter: blur(8px);
                  border-radius: 6px;
                  font-size: 0.72rem;
                  font-weight: 600;
                  letter-spacing: 0.04em;
                  color: var(--teal-light);
                  border: 1px solid var(--border);
                }

                /* ============================================================
                   SECTION LAYOUT
                ============================================================ */
                section { position: relative; }
                .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 0 24px;
                }
                .section-badge {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  padding: 5px 14px;
                  background: var(--teal-muted);
                  border: 1px solid var(--border);
                  border-radius: 100px;
                  font-size: 0.72rem;
                  font-weight: 700;
                  letter-spacing: 0.1em;
                  text-transform: uppercase;
                  color: var(--teal-light);
                  margin-bottom: 20px;
                }
                .section-title {
                  font-family: var(--font-head);
                  font-size: clamp(2rem, 3.5vw, 3.2rem);
                  font-weight: 800;
                  letter-spacing: -0.025em;
                  line-height: 1.1;
                  color: var(--text);
                }
                .section-title .accent { color: var(--teal-light); }
                .section-desc {
                  font-size: 1.05rem;
                  color: var(--text-muted);
                  line-height: 1.75;
                  max-width: 560px;
                  margin-top: 16px;
                }

                /* ============================================================
                   TOOLS SECTION
                ============================================================ */
                .tools-section {
                  padding: 140px 0;
                }
                .tools-header {
                  text-align: center;
                  margin-bottom: 72px;
                }
                .tools-header .section-desc { margin: 16px auto 0; }
                .tools-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 20px;
                }
                .tool-card {
                  background: var(--surface);
                  border: 1px solid var(--border-soft);
                  border-radius: var(--radius-card);
                  padding: 32px;
                  position: relative;
                  overflow: hidden;
                  transition: all 0.4s var(--ease);
                  cursor: default;
                }
                .tool-card::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background: var(--teal-muted);
                  opacity: 0;
                  transition: opacity 0.3s;
                }
                .tool-card:hover {
                  border-color: var(--border);
                  transform: translateY(-4px);
                  box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(70,138,154,0.15);
                }
                .tool-card:hover::before { opacity: 1; }
                .tool-card.featured {
                  border-color: rgba(255,122,48,0.3);
                  background: linear-gradient(135deg, var(--surface) 0%, rgba(255,122,48,0.05) 100%);
                }
                .tool-card.featured:hover { border-color: rgba(255,122,48,0.5); }
                .tool-icon {
                  width: 52px; height: 52px;
                  border-radius: 13px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 24px;
                  margin-bottom: 20px;
                  position: relative;
                  z-index: 1;
                }
                .tool-icon.teal { background: var(--teal-muted); border: 1px solid var(--border); }
                .tool-icon.orange { background: var(--orange-muted); border: 1px solid rgba(255,122,48,0.2); }
                .tool-card h3 {
                  font-family: var(--font-head);
                  font-size: 1.15rem;
                  font-weight: 700;
                  color: var(--text);
                  margin-bottom: 10px;
                  position: relative;
                  z-index: 1;
                }
                .tool-card p {
                  font-size: 0.9rem;
                  color: var(--text-muted);
                  line-height: 1.65;
                  position: relative;
                  z-index: 1;
                }
                .tool-model-tag {
                  display: inline-flex;
                  align-items: center;
                  gap: 5px;
                  margin-top: 16px;
                  padding: 4px 10px;
                  background: rgba(255,255,255,0.04);
                  border: 1px solid var(--border-soft);
                  border-radius: 6px;
                  font-size: 0.72rem;
                  font-weight: 600;
                  color: var(--text-dim);
                  letter-spacing: 0.04em;
                  position: relative;
                  z-index: 1;
                }
                .tool-model-tag .model-dot {
                  width: 5px; height: 5px;
                  border-radius: 50%;
                  background: var(--teal);
                }
                .tool-model-tag.orange-tag .model-dot { background: var(--orange); }

                /* ============================================================
                   AI MODELS SECTION
                ============================================================ */
                .models-section {
                  padding: 120px 0;
                  background: linear-gradient(180deg, transparent 0%, rgba(70,138,154,0.03) 50%, transparent 100%);
                }
                .models-layout {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 80px;
                  align-items: center;
                }
                .models-visual {
                  position: relative;
                }
                .models-stack {
                  display: flex;
                  flex-direction: column;
                  gap: 14px;
                }
                .model-card-item {
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  background: var(--surface);
                  border: 1px solid var(--border-soft);
                  border-radius: 14px;
                  padding: 18px 22px;
                  transition: all 0.3s var(--ease);
                  cursor: default;
                }
                .model-card-item:hover {
                  border-color: var(--border);
                  transform: translateX(6px);
                  box-shadow: -4px 0 24px rgba(70,138,154,0.1);
                }
                .model-card-item.active {
                  border-color: rgba(70,138,154,0.4);
                  background: linear-gradient(90deg, var(--teal-muted), transparent);
                }
                .model-logo {
                  width: 44px; height: 44px;
                  border-radius: 11px;
                  background: var(--teal-muted);
                  border: 1px solid var(--border);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 20px;
                  flex-shrink: 0;
                }
                .model-info { flex: 1; min-width: 0; }
                .model-name {
                  font-family: var(--font-head);
                  font-size: 0.95rem;
                  font-weight: 700;
                  color: var(--text);
                }
                .model-desc {
                  font-size: 0.8rem;
                  color: var(--text-muted);
                  margin-top: 2px;
                }
                .model-badge {
                  flex-shrink: 0;
                  padding: 3px 10px;
                  border-radius: 100px;
                  font-size: 0.7rem;
                  font-weight: 700;
                  letter-spacing: 0.04em;
                }
                .model-badge.teal { background: var(--teal-muted); color: var(--teal-light); border: 1px solid var(--border); }
                .model-badge.orange { background: var(--orange-muted); color: var(--orange); border: 1px solid rgba(255,122,48,0.2); }

                /* ============================================================
                   BEFORE / AFTER TRANSFORMATION SECTION
                ============================================================ */
                .transform-section {
                  padding: 140px 0;
                }
                .transform-header {
                  text-align: center;
                  margin-bottom: 64px;
                }
                .transform-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 24px;
                }
                .transform-item {
                  background: var(--surface);
                  border: 1px solid var(--border-soft);
                  border-radius: var(--radius-card);
                  overflow: hidden;
                  transition: all 0.4s var(--ease);
                }
                .transform-item:hover {
                  border-color: var(--border);
                  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
                }
                .transform-item-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 16px 20px;
                  border-bottom: 1px solid var(--border-soft);
                }
                .transform-item-title {
                  font-family: var(--font-head);
                  font-size: 0.9rem;
                  font-weight: 700;
                  color: var(--text);
                }
                .transform-item-model {
                  font-size: 0.72rem;
                  color: var(--text-dim);
                  font-weight: 600;
                }
                .transform-images {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 0;
                }
                .transform-image-wrap {
                  position: relative;
                  aspect-ratio: 1;
                  overflow: hidden;
                }
                .transform-image-wrap img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  transition: transform 0.5s var(--ease);
                }
                .transform-item:hover .transform-image-wrap img { transform: scale(1.03); }
                .transform-image-tag {
                  position: absolute;
                  top: 10px;
                  left: 10px;
                  padding: 3px 9px;
                  border-radius: 5px;
                  font-size: 0.68rem;
                  font-weight: 700;
                  letter-spacing: 0.06em;
                  text-transform: uppercase;
                }
                .transform-image-tag.before { background: rgba(0,0,0,0.7); color: #aaa; }
                .transform-image-tag.after { background: rgba(70,138,154,0.85); color: white; }

                /* ============================================================
                   PRICING SECTION
                ============================================================ */
                .pricing-section {
                  padding: 140px 0;
                  background: linear-gradient(180deg, transparent 0%, rgba(255,122,48,0.02) 50%, transparent 100%);
                }
                .pricing-header {
                  text-align: center;
                  margin-bottom: 64px;
                }
                .pricing-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 20px;
                  align-items: start;
                }
                .plan-card {
                  background: var(--surface);
                  border: 1px solid var(--border-soft);
                  border-radius: 18px;
                  padding: 36px 32px;
                  position: relative;
                  transition: all 0.4s var(--ease);
                }
                .plan-card:hover {
                  transform: translateY(-6px);
                  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
                }
                .plan-card.popular {
                  border-color: rgba(70,138,154,0.4);
                  background: linear-gradient(135deg, var(--surface), rgba(70,138,154,0.06));
                }
                .plan-card.popular::before {
                  content: 'MOST POPULAR';
                  position: absolute;
                  top: -12px;
                  left: 50%;
                  transform: translateX(-50%);
                  padding: 4px 16px;
                  background: var(--teal);
                  border-radius: 100px;
                  font-size: 0.68rem;
                  font-weight: 800;
                  letter-spacing: 0.1em;
                  color: white;
                }
                .plan-name {
                  font-family: var(--font-head);
                  font-size: 1rem;
                  font-weight: 700;
                  color: var(--text-muted);
                  letter-spacing: 0.06em;
                  text-transform: uppercase;
                  font-size: 0.82rem;
                }
                .plan-price {
                  margin-top: 16px;
                  font-family: var(--font-head);
                  font-size: 3rem;
                  font-weight: 800;
                  color: var(--text);
                  line-height: 1;
                }
                .plan-price sup { font-size: 1.2rem; vertical-align: super; }
                .plan-price span { font-size: 1rem; color: var(--text-muted); font-weight: 400; }
                .plan-credits {
                  margin-top: 10px;
                  font-size: 0.85rem;
                  color: var(--teal-light);
                  font-weight: 600;
                }
                .plan-divider {
                  height: 1px;
                  background: var(--border-soft);
                  margin: 24px 0;
                }
                .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; }
                .plan-features li {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  font-size: 0.88rem;
                  color: var(--text-muted);
                }
                .plan-features li .check {
                  width: 18px; height: 18px;
                  border-radius: 50%;
                  background: var(--teal-muted);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  flex-shrink: 0;
                  color: var(--teal-light);
                }
                .plan-cta {
                  margin-top: 28px;
                  width: 100%;
                  padding: 13px;
                  font-family: var(--font-body);
                  font-size: 0.95rem;
                  font-weight: 600;
                  border-radius: 10px;
                  cursor: pointer;
                  transition: all 0.25s var(--ease);
                  border: 1px solid var(--border);
                  background: transparent;
                  color: var(--text-muted);
                }
                .plan-cta:hover { background: var(--teal-muted); border-color: var(--border); color: var(--text); }
                .plan-card.popular .plan-cta {
                  background: var(--teal);
                  border-color: var(--teal);
                  color: white;
                }
                .plan-card.popular .plan-cta:hover {
                  background: var(--teal-light);
                  box-shadow: 0 8px 24px rgba(70,138,154,0.4);
                }

                /* ============================================================
                   TESTIMONIALS
                ============================================================ */
                .testimonials-section {
                  padding: 120px 0;
                }
                .testimonials-header {
                  text-align: center;
                  margin-bottom: 56px;
                }
                .testimonials-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 20px;
                }
                .testimonial-card {
                  background: var(--surface);
                  border: 1px solid var(--border-soft);
                  border-radius: var(--radius-card);
                  padding: 28px;
                  transition: all 0.3s var(--ease);
                }
                .testimonial-card:hover {
                  border-color: var(--border);
                  transform: translateY(-3px);
                }
                .testimonial-stars {
                  display: flex;
                  gap: 4px;
                  margin-bottom: 16px;
                  color: var(--orange);
                  font-size: 14px;
                }
                .testimonial-text {
                  font-size: 0.92rem;
                  color: var(--text-muted);
                  line-height: 1.7;
                  font-style: italic;
                }
                .testimonial-author {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid var(--border-soft);
                }
                .testimonial-avatar {
                  width: 38px; height: 38px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 16px;
                  font-weight: 700;
                  color: white;
                }
                .testimonial-name {
                  font-family: var(--font-head);
                  font-size: 0.88rem;
                  font-weight: 700;
                  color: var(--text);
                }
                .testimonial-store {
                  font-size: 0.75rem;
                  color: var(--text-dim);
                  margin-top: 1px;
                }

                /* ============================================================
                   CTA SECTION
                ============================================================ */
                .cta-section {
                  padding: 120px 0;
                }
                .cta-box {
                  background: linear-gradient(135deg, var(--surface) 0%, rgba(70,138,154,0.08) 100%);
                  border: 1px solid rgba(70,138,154,0.2);
                  border-radius: 24px;
                  padding: 80px;
                  text-align: center;
                  position: relative;
                  overflow: hidden;
                }
                .cta-box::before {
                  content: '';
                  position: absolute;
                  width: 400px; height: 400px;
                  border-radius: 50%;
                  background: radial-gradient(circle, rgba(70,138,154,0.12), transparent 70%);
                  top: -100px; left: -100px;
                  pointer-events: none;
                }
                .cta-box::after {
                  content: '';
                  position: absolute;
                  width: 300px; height: 300px;
                  border-radius: 50%;
                  background: radial-gradient(circle, rgba(255,122,48,0.08), transparent 70%);
                  bottom: -80px; right: -60px;
                  pointer-events: none;
                }
                .cta-box h2 {
                  font-family: var(--font-head);
                  font-size: clamp(2rem, 3.5vw, 3rem);
                  font-weight: 800;
                  letter-spacing: -0.025em;
                  position: relative;
                  z-index: 1;
                }
                .cta-box p {
                  font-size: 1.05rem;
                  color: var(--text-muted);
                  margin-top: 16px;
                  line-height: 1.7;
                  max-width: 500px;
                  margin-left: auto;
                  margin-right: auto;
                  position: relative;
                  z-index: 1;
                }
                .cta-actions {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 16px;
                  margin-top: 40px;
                  position: relative;
                  z-index: 1;
                }
                .cta-note {
                  margin-top: 16px;
                  font-size: 0.8rem;
                  color: var(--text-dim);
                  position: relative;
                  z-index: 1;
                }

                /* ============================================================
                   FOOTER
                ============================================================ */
                footer {
                  padding: 60px 0 40px;
                  border-top: 1px solid var(--border-soft);
                }
                .footer-inner {
                  display: grid;
                  grid-template-columns: 2fr 1fr 1fr 1fr;
                  gap: 48px;
                }
                .footer-brand p {
                  font-size: 0.88rem;
                  color: var(--text-dim);
                  line-height: 1.7;
                  margin-top: 14px;
                  max-width: 260px;
                }
                .footer-col h4 {
                  font-family: var(--font-head);
                  font-size: 0.82rem;
                  font-weight: 700;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                  color: var(--text-muted);
                  margin-bottom: 16px;
                }
                .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
                .footer-col ul li a {
                  font-size: 0.875rem;
                  color: var(--text-dim);
                  transition: color 0.2s;
                }
                .footer-col ul li a:hover { color: var(--teal-light); }
                .footer-bottom {
                  margin-top: 48px;
                  padding-top: 24px;
                  border-top: 1px solid var(--border-soft);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                }
                .footer-bottom p { font-size: 0.8rem; color: var(--text-dim); }

                /* ============================================================
                   FLOATING TICKER (Marquee)
                ============================================================ */
                .ticker-section {
                  padding: 28px 0;
                  overflow: hidden;
                  border-top: 1px solid var(--border-soft);
                  border-bottom: 1px solid var(--border-soft);
                  background: rgba(70,138,154,0.02);
                }
                .ticker-track {
                  display: flex;
                  gap: 48px;
                  animation: ticker 30s linear infinite;
                  white-space: nowrap;
                }
                .ticker-item {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  font-size: 0.82rem;
                  font-weight: 600;
                  color: var(--text-dim);
                  letter-spacing: 0.06em;
                  text-transform: uppercase;
                  flex-shrink: 0;
                }
                .ticker-item .ti-dot { color: var(--teal); }
                @keyframes ticker {
                  from { transform: translateX(0); }
                  to { transform: translateX(-50%); }
                }

                /* ============================================================
                   ANIMATIONS
                ============================================================ */
                @keyframes fadeUp {
                  from { opacity: 0; transform: translateY(28px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up {
                  opacity: 0;
                  transform: translateY(32px);
                  transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
                }
                .fade-up.visible {
                  opacity: 1;
                  transform: translateY(0);
                }

                /* ============================================================
                   FLOATING BADGE
                ============================================================ */
                .float-badge {
                  position: absolute;
                  background: var(--surface);
                  border: 1px solid var(--border);
                  border-radius: 12px;
                  padding: 10px 14px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 0.78rem;
                  font-weight: 600;
                  color: var(--text);
                  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                  animation: floatBadge 4s ease-in-out infinite;
                }
                @keyframes floatBadge {
                  0%,100% { transform: translateY(0); }
                  50% { transform: translateY(-8px); }
                }
                .float-badge.badge-1 { bottom: 40px; left: -30px; animation-delay: 0s; }
                .float-badge.badge-2 { top: 60px; right: -20px; animation-delay: 2s; }
                .float-badge .badge-icon { font-size: 18px; }

                /* ============================================================
                   FEATURE HIGHLIGHTS STRIP
                ============================================================ */
                .highlights-strip {
                  padding: 80px 0;
                }
                .highlights-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 2px;
                }
                .highlight-item {
                  background: var(--surface);
                  padding: 32px 28px;
                  text-align: center;
                  border: 1px solid var(--border-soft);
                  transition: background 0.3s;
                }
                .highlight-item:hover { background: var(--surface2); }
                .highlight-item:first-child { border-radius: 14px 0 0 14px; }
                .highlight-item:last-child { border-radius: 0 14px 14px 0; }
                .highlight-num {
                  font-family: var(--font-head);
                  font-size: 2.2rem;
                  font-weight: 800;
                  color: var(--teal-light);
                }
                .highlight-label {
                  font-size: 0.82rem;
                  color: var(--text-dim);
                  margin-top: 6px;
                  font-weight: 500;
                }

                /* ============================================================
                   RESPONSIVE
                ============================================================ */
                @media (max-width: 900px) {
                  nav { padding: 0 20px; }
                  .nav-links { display: none; }
                  .demo-body { grid-template-columns: 1fr 1fr; }
                  .tools-grid { grid-template-columns: 1fr 1fr; }
                  .models-layout { grid-template-columns: 1fr; gap: 48px; }
                  .transform-grid { grid-template-columns: 1fr; }
                  .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
                  .testimonials-grid { grid-template-columns: 1fr; }
                  .footer-inner { grid-template-columns: 1fr 1fr; }
                  .cta-box { padding: 48px 24px; }
                }
                @media (max-width: 600px) {
                  .hero-visual { display: none; }
                  .tools-grid { grid-template-columns: 1fr; }
                  .footer-inner { grid-template-columns: 1fr; }
                }
            `}}),e.jsx("div",{className:"bg-canvas"}),e.jsx("div",{className:"noise-layer"}),e.jsx("div",{className:"grid-overlay"}),e.jsx("div",{className:"scroll-progress",id:"scrollProgress"}),e.jsxs("div",{className:"main-content",children:[e.jsxs("nav",{children:[e.jsxs("div",{className:"nav-logo",children:[e.jsx("div",{className:"logo-icon",children:"✦"}),"PixelForge AI"]}),e.jsxs("ul",{className:"nav-links",children:[e.jsx("li",{children:e.jsx("a",{href:"#tools",children:"Tools"})}),e.jsx("li",{children:e.jsx("a",{href:"#models",children:"AI Models"})}),e.jsx("li",{children:e.jsx("a",{href:"#pricing",children:"Pricing"})}),e.jsx("li",{children:e.jsx("a",{href:"#testimonials",children:"Reviews"})})]}),e.jsxs("div",{className:"nav-cta",children:[e.jsx("button",{className:"btn-ghost",children:"Log In"}),e.jsx("button",{className:"btn-primary",children:"Install Free ↗"})]})]}),e.jsx("section",{className:"hero",children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"hero-badge",children:[e.jsx("span",{className:"dot"}),"Powered by Replicate & Nano Banana 2"]}),e.jsxs("h1",{children:["Your Shopify Store Deserves",e.jsx("br",{}),e.jsx("span",{className:"word-ai",children:"AI-Powered Photography"})]}),e.jsx("p",{className:"hero-sub",children:"Six professional AI tools in one embedded app. Remove backgrounds, fix lighting, upscale 8×, erase objects — all in seconds. No photographer needed."}),e.jsxs("div",{className:"hero-actions",children:[e.jsxs("a",{href:"#",className:"btn-hero-primary",children:[e.jsx("span",{children:"⚡"})," Install Free on Shopify"]}),e.jsxs("a",{href:"#tools",className:"btn-hero-secondary",children:[e.jsx("span",{children:"▶"})," See All Tools"]})]}),e.jsxs("div",{className:"hero-stats",children:[e.jsxs("div",{className:"hero-stat",children:[e.jsxs("div",{className:"num",children:["50",e.jsx("span",{children:"+"})]}),e.jsx("div",{className:"label",children:"Lighting Presets"})]}),e.jsx("div",{className:"hero-stat-divider"}),e.jsxs("div",{className:"hero-stat",children:[e.jsxs("div",{className:"num",children:["8",e.jsx("span",{children:"×"})]}),e.jsx("div",{className:"label",children:"Upscale Resolution"})]}),e.jsx("div",{className:"hero-stat-divider"}),e.jsxs("div",{className:"hero-stat",children:[e.jsx("div",{className:"num",children:"6"}),e.jsx("div",{className:"label",children:"AI Tools"})]}),e.jsx("div",{className:"hero-stat-divider"}),e.jsxs("div",{className:"hero-stat",children:[e.jsxs("div",{className:"num",children:["24",e.jsx("span",{children:"/7"})]}),e.jsx("div",{className:"label",children:"AI Photographer"})]})]}),e.jsxs("div",{className:"hero-visual",id:"heroVisual",children:[e.jsxs("div",{className:"demo-window",children:[e.jsxs("div",{className:"demo-topbar",children:[e.jsx("div",{className:"demo-dot red"}),e.jsx("div",{className:"demo-dot yellow"}),e.jsx("div",{className:"demo-dot green"}),e.jsx("div",{className:"demo-bar"})]}),e.jsxs("div",{className:"demo-body",children:[e.jsxs("div",{className:"demo-card",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=500&fit=crop&auto=format",alt:"Product - Watch",loading:"lazy"}),e.jsx("div",{className:"demo-card-label",children:"✦ Background Removed"})]}),e.jsxs("div",{className:"demo-card",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=500&fit=crop&auto=format",alt:"Product - Perfume",loading:"lazy"}),e.jsx("div",{className:"demo-card-label",children:"💡 Lighting Fixed"})]}),e.jsxs("div",{className:"demo-card",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=500&fit=crop&auto=format",alt:"Product - Shoes",loading:"lazy"}),e.jsx("div",{className:"demo-card-label",children:"⬆ 8× Upscaled"})]})]})]}),e.jsxs("div",{className:"float-badge badge-1",children:[e.jsx("span",{className:"badge-icon",children:"🧠"}),e.jsxs("span",{children:["Nano Banana 2",e.jsx("br",{}),e.jsx("span",{style:{color:"var(--text-dim)",fontWeight:"400"},children:"Inpainting model"})]})]}),e.jsxs("div",{className:"float-badge badge-2",children:[e.jsx("span",{className:"badge-icon",children:"✅"}),e.jsxs("span",{children:["Shopify Embedded",e.jsx("br",{}),e.jsx("span",{style:{color:"var(--text-dim)",fontWeight:"400"},children:"One-click install"})]})]})]})]})}),e.jsx("div",{className:"ticker-section",children:e.jsxs("div",{className:"ticker-track",children:[e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Magic Eraser"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Background Remover"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," 8× Image Upscaler"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," IC-Light Relighting"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," RestoreFormer v1.4"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Nano Banana 2"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Photoroom API"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Replicate AI"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Virtual Try-On"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Real-Time Updates"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Magic Eraser"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Background Remover"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," 8× Image Upscaler"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," IC-Light Relighting"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," RestoreFormer v1.4"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Nano Banana 2"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Photoroom API"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Replicate AI"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Virtual Try-On"]}),e.jsxs("span",{className:"ticker-item",children:[e.jsx("span",{className:"ti-dot",children:"✦"})," Real-Time Updates"]})]})}),e.jsx("div",{className:"highlights-strip fade-up",children:e.jsx("div",{className:"container",children:e.jsxs("div",{className:"highlights-grid",children:[e.jsxs("div",{className:"highlight-item",children:[e.jsx("div",{className:"highlight-num",children:"24/7"}),e.jsx("div",{className:"highlight-label",children:"AI Photographer Available"})]}),e.jsxs("div",{className:"highlight-item",children:[e.jsx("div",{className:"highlight-num",children:"6"}),e.jsx("div",{className:"highlight-label",children:"Pro AI Tools Built-In"})]}),e.jsxs("div",{className:"highlight-item",children:[e.jsxs("div",{className:"highlight-num",children:["8",e.jsx("span",{children:"×"})]}),e.jsx("div",{className:"highlight-label",children:"Max Upscale Factor"})]}),e.jsxs("div",{className:"highlight-item",children:[e.jsx("div",{className:"highlight-num",children:"50+"}),e.jsx("div",{className:"highlight-label",children:"Lighting Presets"})]})]})})}),e.jsx("section",{className:"tools-section",id:"tools",children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"tools-header fade-up",children:[e.jsx("div",{className:"section-badge",children:"✦ The Toolkit"}),e.jsxs("div",{className:"section-title",children:["Six AI Tools.",e.jsx("br",{}),e.jsx("span",{className:"accent",children:"One Powerful App."})]}),e.jsx("p",{className:"section-desc",children:"Every tool you need to create stunning product photography — from removing backgrounds to fixing professional studio lighting, powered by cutting-edge AI models."})]}),e.jsxs("div",{className:"tools-grid",children:[e.jsxs("div",{className:"tool-card featured fade-up",children:[e.jsx("div",{className:"tool-icon orange",children:"🪄"}),e.jsx("h3",{children:"Magic Eraser"}),e.jsx("p",{children:"Remove unwanted objects, blemishes, or distractions from your product images with intelligent inpainting. Simply brush over what you want gone."}),e.jsxs("div",{className:"tool-model-tag orange-tag",children:[e.jsx("span",{className:"model-dot"}),"Nano Banana 2 — Replicate Inpainting"]})]}),e.jsxs("div",{className:"tool-card fade-up",children:[e.jsx("div",{className:"tool-icon teal",children:"✂️"}),e.jsx("h3",{children:"Background Remover"}),e.jsx("p",{children:"Pixel-perfect product cutouts in seconds. Clean, professional transparent backgrounds ready for any marketplace listing or custom scene."}),e.jsxs("div",{className:"tool-model-tag",children:[e.jsx("span",{className:"model-dot"}),"Replicate API + Photoroom Fallback"]})]}),e.jsxs("div",{className:"tool-card fade-up",children:[e.jsx("div",{className:"tool-icon teal",children:"🔍"}),e.jsx("h3",{children:"Image Upscaler"}),e.jsx("p",{children:"Transform low-resolution product shots into crisp, print-quality images. Scale up to 8× original resolution with AI-powered detail synthesis."}),e.jsxs("div",{className:"tool-model-tag",children:[e.jsx("span",{className:"model-dot"}),"Nano Banana 2 — AI Super Resolution"]})]}),e.jsxs("div",{className:"tool-card fade-up",children:[e.jsx("div",{className:"tool-icon teal",children:"✨"}),e.jsx("h3",{children:"Image Enhancer"}),e.jsx("p",{children:"Automatically fix exposure, color balance, sharpness, and detail. Trained on professional photography standards to instantly elevate any shot."}),e.jsxs("div",{className:"tool-model-tag",children:[e.jsx("span",{className:"model-dot"}),"RestoreFormer v1.4 / v1.3 — Replicate"]})]}),e.jsxs("div",{className:"tool-card fade-up",children:[e.jsx("div",{className:"tool-icon teal",children:"⚡"}),e.jsx("h3",{children:"Image Compressor"}),e.jsx("p",{children:"Reduce file sizes intelligently without sacrificing visible quality. Faster store load times, better Core Web Vitals, and improved conversion rates."}),e.jsxs("div",{className:"tool-model-tag",children:[e.jsx("span",{className:"model-dot"}),"GD-Based Smart Compression — Sync"]})]}),e.jsxs("div",{className:"tool-card featured fade-up",children:[e.jsx("div",{className:"tool-icon orange",children:"💡"}),e.jsx("h3",{children:"Lighting Fix / AI Relighting"}),e.jsx("p",{children:"Apply any of 50+ professional studio lighting presets to your products. Transform flat, dull photos into dramatic, eye-catching studio shots."}),e.jsxs("div",{className:"tool-model-tag orange-tag",children:[e.jsx("span",{className:"model-dot"}),"IC-Light Model — 50+ Presets — Replicate"]})]})]})]})}),e.jsx("section",{className:"models-section",id:"models",children:e.jsx("div",{className:"container",children:e.jsxs("div",{className:"models-layout",children:[e.jsxs("div",{className:"fade-up",children:[e.jsx("div",{className:"section-badge",children:"🧠 Under the Hood"}),e.jsxs("h2",{className:"section-title",children:["Powered by",e.jsx("br",{}),e.jsxs("span",{className:"accent",children:["Industry-Leading",e.jsx("br",{}),"AI Models"]})]}),e.jsx("p",{className:"section-desc",children:"We've curated and integrated the most powerful open-source and commercial AI models available today, so you always get the best possible results for every task."}),e.jsx("div",{style:{marginTop:"32px",display:"flex",gap:"12px",flexWrap:"wrap"},children:e.jsx("a",{href:"#",className:"btn-hero-secondary",style:{fontSize:"0.85rem",padding:"10px 20px"},children:"View Documentation ↗"})})]}),e.jsx("div",{className:"models-visual fade-up",children:e.jsxs("div",{className:"models-stack",children:[e.jsxs("div",{className:"model-card-item active",children:[e.jsx("div",{className:"model-logo",children:"🍌"}),e.jsxs("div",{className:"model-info",children:[e.jsx("div",{className:"model-name",children:"Nano Banana 2"}),e.jsx("div",{className:"model-desc",children:"Inpainting, upscaling & object removal via Replicate"})]}),e.jsx("span",{className:"model-badge teal",children:"Magic Eraser"})]}),e.jsxs("div",{className:"model-card-item",children:[e.jsx("div",{className:"model-logo",children:"💡"}),e.jsxs("div",{className:"model-info",children:[e.jsx("div",{className:"model-name",children:"IC-Light"}),e.jsx("div",{className:"model-desc",children:"Advanced relighting with 50+ professional presets"})]}),e.jsx("span",{className:"model-badge orange",children:"Lighting Fix"})]}),e.jsxs("div",{className:"model-card-item",children:[e.jsx("div",{className:"model-logo",children:"🔬"}),e.jsxs("div",{className:"model-info",children:[e.jsx("div",{className:"model-name",children:"RestoreFormer v1.4"}),e.jsx("div",{className:"model-desc",children:"Face & product restoration, auto quality enhancement"})]}),e.jsx("span",{className:"model-badge teal",children:"Enhancer"})]}),e.jsxs("div",{className:"model-card-item",children:[e.jsx("div",{className:"model-logo",children:"✂️"}),e.jsxs("div",{className:"model-info",children:[e.jsx("div",{className:"model-name",children:"Replicate BG Model"}),e.jsx("div",{className:"model-desc",children:"Pixel-perfect background removal + Photoroom fallback"})]}),e.jsx("span",{className:"model-badge teal",children:"BG Remove"})]}),e.jsxs("div",{className:"model-card-item",children:[e.jsx("div",{className:"model-logo",children:"🏠"}),e.jsxs("div",{className:"model-info",children:[e.jsx("div",{className:"model-name",children:"Photoroom API"}),e.jsx("div",{className:"model-desc",children:"Commercial-grade fallback for background processing"})]}),e.jsx("span",{className:"model-badge orange",children:"Fallback"})]})]})})]})})}),e.jsx("section",{className:"transform-section",id:"transform",children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"transform-header fade-up",children:[e.jsx("div",{className:"section-badge",children:"📸 Before & After"}),e.jsxs("div",{className:"section-title",children:["See the ",e.jsx("span",{className:"accent",children:"Transformation"})]}),e.jsx("p",{className:"section-desc",style:{margin:"16px auto 0"},children:"Real product images processed by our AI tools. The difference is immediate and dramatic."})]}),e.jsxs("div",{className:"transform-grid",children:[e.jsxs("div",{className:"transform-item fade-up",children:[e.jsxs("div",{className:"transform-item-header",children:[e.jsx("span",{className:"transform-item-title",children:"✂️ Background Removal"}),e.jsx("span",{className:"transform-item-model",children:"Replicate + Photoroom"})]}),e.jsxs("div",{className:"transform-images",style:{position:"relative"},children:[e.jsxs("div",{className:"transform-image-wrap",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop&auto=format",alt:"Before",loading:"lazy"}),e.jsx("span",{className:"transform-image-tag before",children:"Before"})]}),e.jsxs("div",{className:"transform-image-wrap",style:{background:"linear-gradient(135deg, #0d1620, #111d2b)"},children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&auto=format&bg=transparent",alt:"After",loading:"lazy",style:{mixBlendMode:"luminosity",opacity:.9}}),e.jsx("span",{className:"transform-image-tag after",children:"After"})]}),e.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"28px",height:"28px",background:"var(--teal)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",zIndex:5,boxShadow:"0 2px 12px rgba(70,138,154,0.5)"},children:"→"})]})]}),e.jsxs("div",{className:"transform-item fade-up",children:[e.jsxs("div",{className:"transform-item-header",children:[e.jsx("span",{className:"transform-item-title",children:"💡 AI Relighting"}),e.jsx("span",{className:"transform-item-model",children:"IC-Light Model"})]}),e.jsxs("div",{className:"transform-images",style:{position:"relative"},children:[e.jsxs("div",{className:"transform-image-wrap",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=300&fit=crop&auto=format&q=40&bri=-30",alt:"Before",loading:"lazy",style:{filter:"brightness(0.65) contrast(0.9)"}}),e.jsx("span",{className:"transform-image-tag before",children:"Before"})]}),e.jsxs("div",{className:"transform-image-wrap",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&h=300&fit=crop&auto=format",alt:"After",loading:"lazy"}),e.jsx("span",{className:"transform-image-tag after",children:"After"})]}),e.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"28px",height:"28px",background:"var(--orange)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",zIndex:5,boxShadow:"0 2px 12px rgba(255,122,48,0.5)"},children:"→"})]})]}),e.jsxs("div",{className:"transform-item fade-up",children:[e.jsxs("div",{className:"transform-item-header",children:[e.jsx("span",{className:"transform-item-title",children:"🔍 8× Upscaling"}),e.jsx("span",{className:"transform-item-model",children:"Nano Banana 2"})]}),e.jsxs("div",{className:"transform-images",style:{position:"relative"},children:[e.jsxs("div",{className:"transform-image-wrap",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop&auto=format",alt:"Before",loading:"lazy",style:{imageRendering:"pixelated",filter:"blur(1px)"}}),e.jsx("span",{className:"transform-image-tag before",children:"Before"})]}),e.jsxs("div",{className:"transform-image-wrap",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&auto=format",alt:"After",loading:"lazy"}),e.jsx("span",{className:"transform-image-tag after",children:"After"})]}),e.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"28px",height:"28px",background:"var(--teal)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",zIndex:5,boxShadow:"0 2px 12px rgba(70,138,154,0.5)"},children:"→"})]})]}),e.jsxs("div",{className:"transform-item fade-up",children:[e.jsxs("div",{className:"transform-item-header",children:[e.jsx("span",{className:"transform-item-title",children:"🪄 Magic Eraser"}),e.jsx("span",{className:"transform-item-model",children:"Nano Banana 2 Inpainting"})]}),e.jsxs("div",{className:"transform-images",style:{position:"relative"},children:[e.jsxs("div",{className:"transform-image-wrap",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300&h=300&fit=crop&auto=format",alt:"Before",loading:"lazy"}),e.jsx("span",{className:"transform-image-tag before",children:"Before"})]}),e.jsxs("div",{className:"transform-image-wrap",children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop&auto=format",alt:"After",loading:"lazy"}),e.jsx("span",{className:"transform-image-tag after",children:"After"})]}),e.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"28px",height:"28px",background:"var(--orange)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",zIndex:5,boxShadow:"0 2px 12px rgba(255,122,48,0.5)"},children:"→"})]})]})]})]})}),e.jsx("section",{className:"pricing-section",id:"pricing",children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"pricing-header fade-up",children:[e.jsx("div",{className:"section-badge",children:"💳 Pricing"}),e.jsxs("div",{className:"section-title",children:["Predictable Credits.",e.jsx("br",{}),e.jsx("span",{className:"accent",children:"No Surprises."})]}),e.jsx("p",{className:"section-desc",style:{margin:"16px auto 0"},children:"Start free. Scale as you grow. Top-up credits anytime. No minimum commitment."})]}),e.jsxs("div",{className:"pricing-grid",children:[e.jsxs("div",{className:"plan-card fade-up",children:[e.jsx("div",{className:"plan-name",children:"Starter"}),e.jsxs("div",{className:"plan-price",children:[e.jsx("sup",{children:"$"}),"0",e.jsx("span",{children:"/mo"})]}),e.jsx("div",{className:"plan-credits",children:"50 credits / month"}),e.jsx("div",{className:"plan-divider"}),e.jsxs("ul",{className:"plan-features",children:[e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," All 6 AI Tools"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Background Remover"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Image Compressor"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Shopify Integration"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Generations Gallery"]})]}),e.jsx("button",{className:"plan-cta",children:"Get Started Free"})]}),e.jsxs("div",{className:"plan-card popular fade-up",children:[e.jsx("div",{className:"plan-name",children:"Growth"}),e.jsxs("div",{className:"plan-price",children:[e.jsx("sup",{children:"$"}),"29",e.jsx("span",{children:"/mo"})]}),e.jsx("div",{className:"plan-credits",children:"500 credits / month"}),e.jsx("div",{className:"plan-divider"}),e.jsxs("ul",{className:"plan-features",children:[e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Everything in Starter"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," IC-Light Relighting"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Nano Banana 2 Eraser"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," RestoreFormer Enhance"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," 8× AI Upscaling"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Virtual Try-On Lab"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Priority Processing"]})]}),e.jsx("button",{className:"plan-cta",children:"Start Growth Plan"})]}),e.jsxs("div",{className:"plan-card fade-up",children:[e.jsx("div",{className:"plan-name",children:"Pro"}),e.jsxs("div",{className:"plan-price",children:[e.jsx("sup",{children:"$"}),"79",e.jsx("span",{children:"/mo"})]}),e.jsx("div",{className:"plan-credits",children:"Unlimited credits"}),e.jsx("div",{className:"plan-divider"}),e.jsxs("ul",{className:"plan-features",children:[e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Everything in Growth"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Unlimited Generations"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," API Access"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Dedicated Support"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Custom Lighting Presets"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," Bulk Processing"]}),e.jsxs("li",{children:[e.jsx("span",{className:"check",children:"✓"})," White-Label Option"]})]}),e.jsx("button",{className:"plan-cta",children:"Go Pro"})]})]})]})}),e.jsx("section",{className:"testimonials-section",id:"testimonials",children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"testimonials-header fade-up",children:[e.jsx("div",{className:"section-badge",children:"⭐ Reviews"}),e.jsxs("div",{className:"section-title",children:["Merchants ",e.jsx("span",{className:"accent",children:"Love It"})]})]}),e.jsxs("div",{className:"testimonials-grid",children:[e.jsxs("div",{className:"testimonial-card fade-up",children:[e.jsx("div",{className:"testimonial-stars",children:"★★★★★"}),e.jsx("p",{className:"testimonial-text",children:'"The Magic Eraser and lighting tools alone saved us thousands in photography costs. The Nano Banana model results are genuinely impressive."'}),e.jsxs("div",{className:"testimonial-author",children:[e.jsx("div",{className:"testimonial-avatar",style:{background:"linear-gradient(135deg,#468A9A,#5a9faf)"},children:"S"}),e.jsxs("div",{children:[e.jsx("div",{className:"testimonial-name",children:"Sarah K."}),e.jsx("div",{className:"testimonial-store",children:"Luxe Beauty Co. — Shopify Plus"})]})]})]}),e.jsxs("div",{className:"testimonial-card fade-up",children:[e.jsx("div",{className:"testimonial-stars",children:"★★★★★"}),e.jsx("p",{className:"testimonial-text",children:'"Background removal is insanely accurate. The IC-Light relighting makes our jewelry photos look like they were shot in a $10k studio."'}),e.jsxs("div",{className:"testimonial-author",children:[e.jsx("div",{className:"testimonial-avatar",style:{background:"linear-gradient(135deg,#FF7A30,#ff9a5c)"},children:"M"}),e.jsxs("div",{children:[e.jsx("div",{className:"testimonial-name",children:"Marcus T."}),e.jsx("div",{className:"testimonial-store",children:"Gold & Stone Jewelry"})]})]})]}),e.jsxs("div",{className:"testimonial-card fade-up",children:[e.jsx("div",{className:"testimonial-stars",children:"★★★★★"}),e.jsx("p",{className:"testimonial-text",children:'"Went from spending 3 days on product photos to 3 hours. The 8× upscaler is ridiculous — customers love the crisp detail in our listings."'}),e.jsxs("div",{className:"testimonial-author",children:[e.jsx("div",{className:"testimonial-avatar",style:{background:"linear-gradient(135deg,#5a4adc,#7c6aff)"},children:"A"}),e.jsxs("div",{children:[e.jsx("div",{className:"testimonial-name",children:"Aisha R."}),e.jsx("div",{className:"testimonial-store",children:"StreetWear Republic"})]})]})]})]})]})}),e.jsx("section",{className:"cta-section",children:e.jsx("div",{className:"container",children:e.jsxs("div",{className:"cta-box fade-up",children:[e.jsxs("h2",{children:["Your Professional",e.jsx("br",{}),e.jsx("span",{style:{color:"var(--teal-light)"},children:"AI Photographer"})," is Ready."]}),e.jsx("p",{children:"Join thousands of Shopify merchants who've replaced expensive photo shoots with instant AI-powered results."}),e.jsxs("div",{className:"cta-actions",children:[e.jsxs("a",{href:"#",className:"btn-hero-primary",children:[e.jsx("span",{children:"⚡"})," Install Free on Shopify"]}),e.jsx("a",{href:"#",className:"btn-hero-secondary",children:"Schedule a Demo →"})]}),e.jsx("p",{className:"cta-note",children:"No credit card required · Free plan available · 2-minute setup"})]})})}),e.jsx("footer",{children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"footer-inner",children:[e.jsxs("div",{className:"footer-brand",children:[e.jsxs("div",{className:"nav-logo",style:{justifyContent:"flex-start"},children:[e.jsx("div",{className:"logo-icon",children:"✦"}),"PixelForge AI"]}),e.jsx("p",{children:"Professional AI product photography for Shopify merchants. Powered by Replicate, Nano Banana 2, IC-Light, and RestoreFormer."})]}),e.jsxs("div",{className:"footer-col",children:[e.jsx("h4",{children:"Product"}),e.jsxs("ul",{children:[e.jsx("li",{children:e.jsx("a",{href:"#",children:"Magic Eraser"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Background Remover"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Image Upscaler"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Lighting Fix"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Image Enhancer"})})]})]}),e.jsxs("div",{className:"footer-col",children:[e.jsx("h4",{children:"Company"}),e.jsxs("ul",{children:[e.jsx("li",{children:e.jsx("a",{href:"#",children:"About"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Pricing"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Blog"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Changelog"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Shopify App Store"})})]})]}),e.jsxs("div",{className:"footer-col",children:[e.jsx("h4",{children:"Support"}),e.jsxs("ul",{children:[e.jsx("li",{children:e.jsx("a",{href:"#",children:"Documentation"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Live Chat"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Submit Ticket"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Privacy Policy"})}),e.jsx("li",{children:e.jsx("a",{href:"#",children:"Terms of Service"})})]})]})]}),e.jsxs("div",{className:"footer-bottom",children:[e.jsx("p",{children:"© 2025 PixelForge AI. All rights reserved. Built for Shopify merchants worldwide."}),e.jsxs("p",{style:{display:"flex",gap:"6px",alignItems:"center"},children:[e.jsx("span",{style:{color:"var(--teal)"},children:"●"})," All systems operational"]})]})]})})]})]})}export{I as default};
