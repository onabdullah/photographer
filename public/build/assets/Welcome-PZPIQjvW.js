import{r as w,j as i}from"./react-BHrScvB_.js";import{H as k}from"./inertia-DhWMRYOf.js";const S=`
    :root {
        --teal:       #468A9A;
        --teal-mid:   #3a7585;
        --teal-dark:  #2c5c69;
        --teal-pale:  rgba(70,138,154,.08);
        --teal-line:  rgba(70,138,154,.18);
        --orange:     #FF7A30;
        --orange-dk:  #e56218;
        --white:      #ffffff;
        --off:        #f7f9fa;
        --ink:        #0d1a1f;
        --ink-2:      #2a3d44;
        --ink-3:      #5a7880;
        --ink-4:      #a8bec4;
        --rule:       rgba(70,138,154,.12);
        --fS:         'Cormorant Garamond', Georgia, serif;
        --fB:         'Figtree', sans-serif;
        --ease:       cubic-bezier(.22,.68,0,1.2);
        --ease-s:     cubic-bezier(.25,.46,.45,.94);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; font-size: 16px; }
    body {
        background: var(--white);
        color: var(--ink);
        font-family: var(--fB);
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
    }
    a { text-decoration: none; color: inherit; }
    img { display: block; max-width: 100%; }
    ::selection { background: var(--teal); color: #fff; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: var(--off); }
    ::-webkit-scrollbar-thumb { background: var(--teal); }

    #bar {
        position: fixed; top: 0; left: 0;
        height: 2px; width: 0%;
        background: var(--teal);
        z-index: 999;
        transition: width .1s linear;
    }

    nav {
        position: fixed; top: 0; left: 0; right: 0;
        height: 64px;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 56px;
        background: rgba(255,255,255,.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--rule);
        z-index: 100;
        animation: navIn .6s var(--ease-s) both;
    }
    @keyframes navIn {
        from { transform: translateY(-100%); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
    }
    .nav-logo {
        font-family: var(--fS);
        font-weight: 600;
        font-size: 1.3rem;
        letter-spacing: .02em;
        color: var(--ink);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .logo-sq {
        width: 28px; height: 28px;
        background: var(--teal);
        border-radius: 6px;
        flex-shrink: 0;
    }
    .nav-links {
        display: flex; align-items: center; gap: 36px;
        list-style: none;
    }
    .nav-links a {
        font-size: .82rem;
        font-weight: 500;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--ink-3);
        transition: color .2s;
    }
    .nav-links a:hover { color: var(--teal); }
    .nav-right { display: flex; align-items: center; gap: 12px; }
    .btn-text {
        font-family: var(--fB);
        font-size: .82rem;
        font-weight: 500;
        letter-spacing: .04em;
        color: var(--ink-3);
        background: none; border: none; cursor: pointer;
        transition: color .2s;
    }
    .btn-text:hover { color: var(--teal); }
    .btn-primary {
        font-family: var(--fB);
        font-size: .82rem;
        font-weight: 600;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--white);
        background: var(--teal);
        border: none;
        border-radius: 6px;
        padding: 10px 22px;
        cursor: pointer;
        transition: all .25s var(--ease-s);
    }
    .btn-primary:hover {
        background: var(--teal-mid);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(70,138,154,.3);
    }

    .container { max-width: 1160px; margin: 0 auto; padding: 0 56px; }

    .hero {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        padding-top: 64px;
        overflow: hidden;
    }
    .hero-left {
        padding: 100px 56px 100px 56px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    .hero-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-family: var(--fB);
        font-size: .72rem;
        font-weight: 600;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--teal);
        margin-bottom: 28px;
        animation: fadeUp .7s .1s var(--ease-s) both;
    }
    .hero-eyebrow::before {
        content: '';
        width: 28px; height: 1px;
        background: var(--teal);
        flex-shrink: 0;
    }
    .hero h1 {
        font-family: var(--fS);
        font-size: clamp(2.8rem, 4.5vw, 5rem);
        font-weight: 300;
        line-height: 1.12;
        letter-spacing: -.01em;
        color: var(--ink);
        animation: fadeUp .8s .25s var(--ease-s) both;
    }
    .hero h1 strong {
        font-weight: 600;
        color: var(--teal);
    }
    .hero-body {
        font-size: 1.05rem;
        font-weight: 300;
        line-height: 1.8;
        color: var(--ink-3);
        max-width: 420px;
        margin-top: 28px;
        animation: fadeUp .8s .4s var(--ease-s) both;
    }
    .hero-actions {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-top: 40px;
        animation: fadeUp .8s .55s var(--ease-s) both;
    }
    .btn-hero {
        font-family: var(--fB);
        font-size: .82rem;
        font-weight: 600;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--white);
        background: var(--orange);
        border: none;
        border-radius: 6px;
        padding: 14px 32px;
        cursor: pointer;
        transition: all .28s var(--ease-s);
    }
    .btn-hero:hover {
        background: var(--orange-dk);
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(255,122,48,.32);
    }
    .btn-outline {
        font-family: var(--fB);
        font-size: .82rem;
        font-weight: 500;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--ink-3);
        background: none;
        border: 1px solid var(--rule);
        border-radius: 6px;
        padding: 14px 28px;
        cursor: pointer;
        transition: all .25s var(--ease-s);
    }
    .btn-outline:hover {
        border-color: var(--teal);
        color: var(--teal);
    }
    .hero-meta {
        display: flex;
        align-items: center;
        gap: 28px;
        margin-top: 56px;
        animation: fadeUp .8s .7s var(--ease-s) both;
    }
    .hero-stat .num {
        font-family: var(--fS);
        font-size: 2rem;
        font-weight: 500;
        color: var(--ink);
        line-height: 1;
    }
    .hero-stat .lbl {
        font-size: .72rem;
        font-weight: 500;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--ink-4);
        margin-top: 4px;
    }
    .meta-rule { width: 1px; height: 32px; background: var(--rule); }

    .hero-right {
        height: 100vh;
        position: relative;
        overflow: hidden;
        background: var(--off);
    }
    .hero-mosaic {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 2px;
    }
    .mosaic-cell {
        overflow: hidden;
        position: relative;
    }
    .mosaic-cell img {
        width: 100%; height: 100%;
        object-fit: cover;
        transition: transform 8s ease;
    }
    .mosaic-cell:hover img { transform: scale(1.04); }
    .mosaic-cell.span2 { grid-column: span 2; }
    .mosaic-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 60%, rgba(70,138,154,.12));
    }
    .hero-right-label {
        position: absolute;
        bottom: 36px;
        left: 36px;
        right: 36px;
        background: rgba(255,255,255,.94);
        backdrop-filter: blur(12px);
        border-radius: 8px;
        padding: 18px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid var(--rule);
        animation: fadeUp .9s 1.1s var(--ease-s) both;
        opacity: 0;
        animation-fill-mode: both;
    }
    .hrl-left { font-size: .78rem; color: var(--ink-3); font-weight: 400; }
    .hrl-left strong { display: block; font-size: .92rem; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
    .hrl-dot {
        width: 8px; height: 8px;
        background: #22c55e;
        border-radius: 50%;
        animation: blink 2s infinite;
    }
    @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:.3 } }

    .sec-label {
        font-family: var(--fB);
        font-size: .72rem;
        font-weight: 600;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--teal);
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
    }
    .sec-label::before {
        content: '';
        width: 24px; height: 1px;
        background: var(--teal);
        flex-shrink: 0;
    }
    .sec-title {
        font-family: var(--fS);
        font-weight: 300;
        line-height: 1.1;
        letter-spacing: -.01em;
        color: var(--ink);
    }
    .sec-title strong { font-weight: 600; }

    .ticker {
        border-top: 1px solid var(--rule);
        border-bottom: 1px solid var(--rule);
        overflow: hidden;
        padding: 14px 0;
    }
    .ticker-track {
        display: flex;
        width: max-content;
        animation: tick 35s linear infinite;
    }
    .ticker-track:hover { animation-play-state: paused; }
    .ti {
        display: flex;
        align-items: center;
        gap: 0;
        padding: 0 40px;
        font-size: .72rem;
        font-weight: 600;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--ink-4);
        flex-shrink: 0;
        white-space: nowrap;
    }
    .ti-sep {
        width: 4px; height: 4px;
        background: var(--teal);
        border-radius: 50%;
        margin: 0 40px;
        flex-shrink: 0;
    }
    @keyframes tick {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
    }

    .numbers-section {
        padding: 120px 0;
        border-bottom: 1px solid var(--rule);
    }
    .numbers-grid {
        display: grid;
        grid-template-columns: repeat(4,1fr);
        gap: 0;
        border: 1px solid var(--rule);
        border-radius: 10px;
        overflow: hidden;
    }
    .nitem {
        padding: 48px 40px;
        border-right: 1px solid var(--rule);
        transition: background .3s;
    }
    .nitem:last-child { border-right: none; }
    .nitem:hover { background: var(--teal-pale); }
    .nitem .big {
        font-family: var(--fS);
        font-size: 3.5rem;
        font-weight: 500;
        color: var(--teal);
        line-height: 1;
        letter-spacing: -.02em;
    }
    .nitem .big.orange { color: var(--orange); }
    .nitem .nlbl {
        font-size: .78rem;
        font-weight: 500;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--ink-3);
        margin-top: 12px;
        line-height: 1.5;
    }

    .tools-section {
        padding: 140px 0;
    }
    .tools-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 80px;
        align-items: start;
        margin-top: 72px;
    }
    .tools-sticky {
        position: sticky;
        top: 100px;
    }
    .tools-sticky .sec-title {
        font-size: clamp(1.8rem, 2.5vw, 2.6rem);
    }
    .tools-sticky p {
        font-size: .92rem;
        color: var(--ink-3);
        line-height: 1.75;
        margin-top: 16px;
        font-weight: 300;
    }
    .tools-sticky .btn-primary {
        margin-top: 32px;
    }
    .tools-list {
        display: flex;
        flex-direction: column;
        gap: 0;
        border: 1px solid var(--rule);
        border-radius: 10px;
        overflow: hidden;
    }
    .tool-item {
        display: grid;
        grid-template-columns: 56px 1fr;
        gap: 0;
        border-bottom: 1px solid var(--rule);
        transition: background .25s;
        cursor: default;
    }
    .tool-item:last-child { border-bottom: none; }
    .tool-item:hover { background: var(--teal-pale); }
    .tool-num {
        padding: 28px 0 28px 24px;
        font-family: var(--fS);
        font-size: .9rem;
        font-weight: 500;
        color: var(--teal);
        letter-spacing: .04em;
        display: flex;
        align-items: flex-start;
        padding-top: 30px;
    }
    .tool-body {
        padding: 28px 32px 28px 20px;
        border-left: 1px solid var(--rule);
    }
    .tool-name {
        font-family: var(--fS);
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--ink);
        letter-spacing: -.01em;
    }
    .tool-desc {
        font-size: .875rem;
        color: var(--ink-3);
        line-height: 1.7;
        margin-top: 6px;
        font-weight: 300;
    }

    .value-section {
        padding: 140px 0;
        background: var(--ink);
        color: var(--white);
    }
    .value-section .sec-label { color: var(--teal-pale); }
    .value-section .sec-label::before { background: rgba(70,138,154,.4); }
    .value-section .sec-label { color: rgba(70,138,154,.8); }
    .value-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: end;
        margin-bottom: 72px;
    }
    .value-section .sec-title { color: var(--white); }
    .value-section .sec-title { font-size: clamp(2.2rem, 3.5vw, 3.8rem); }
    .value-header-right {
        font-size: .95rem;
        color: rgba(255,255,255,.45);
        line-height: 1.8;
        font-weight: 300;
        align-self: end;
        padding-bottom: 4px;
    }
    .value-grid {
        display: grid;
        grid-template-columns: repeat(3,1fr);
        gap: 1px;
        background: rgba(255,255,255,.08);
        border-radius: 10px;
        overflow: hidden;
    }
    .vcard {
        background: var(--ink);
        padding: 48px 36px;
        transition: background .3s;
    }
    .vcard:hover { background: var(--ink-2); }
    .vcard-num {
        font-family: var(--fS);
        font-size: 3rem;
        font-weight: 300;
        color: var(--teal);
        line-height: 1;
    }
    .vcard-title {
        font-family: var(--fS);
        font-size: 1.2rem;
        font-weight: 500;
        color: var(--white);
        margin-top: 20px;
        letter-spacing: -.01em;
    }
    .vcard-body {
        font-size: .875rem;
        color: rgba(255,255,255,.45);
        line-height: 1.75;
        margin-top: 10px;
        font-weight: 300;
    }

    .gen-section {
        padding: 140px 0;
        border-bottom: 1px solid var(--rule);
    }
    .gen-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: center;
        margin-top: 0;
    }
    .gen-copy .sec-title { font-size: clamp(2rem, 3vw, 3.2rem); margin-top: 20px; }
    .gen-copy p {
        font-size: .95rem;
        color: var(--ink-3);
        line-height: 1.8;
        margin-top: 20px;
        font-weight: 300;
        max-width: 420px;
    }
    .gen-feats {
        margin-top: 36px;
        display: flex;
        flex-direction: column;
        gap: 0;
        border: 1px solid var(--rule);
        border-radius: 8px;
        overflow: hidden;
    }
    .gen-feat {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 20px;
        border-bottom: 1px solid var(--rule);
        font-size: .85rem;
        color: var(--ink-3);
        font-weight: 400;
        transition: background .2s, color .2s;
    }
    .gen-feat:last-child { border-bottom: none; }
    .gen-feat:hover { background: var(--teal-pale); color: var(--ink); }
    .gen-feat-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: var(--teal);
        flex-shrink: 0;
    }
    .gen-visual {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    .gv-img {
        border-radius: 8px;
        overflow: hidden;
        position: relative;
    }
    .gv-img img {
        width: 100%; height: 100%;
        object-fit: cover;
        transition: transform .5s var(--ease-s);
        display: block;
    }
    .gv-img:hover img { transform: scale(1.04); }
    .gv-img.tall { grid-row: span 2; }
    .gv-img-tag {
        position: absolute;
        bottom: 10px; left: 10px;
        background: rgba(255,255,255,.95);
        border-radius: 4px;
        padding: 4px 10px;
        font-size: .68rem;
        font-weight: 600;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--teal-dark);
    }

    .support-section {
        padding: 140px 0;
    }
    .support-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: start;
        margin-top: 64px;
    }
    .support-card {
        padding: 36px;
        border: 1px solid var(--rule);
        border-radius: 10px;
        transition: all .3s var(--ease-s);
    }
    .support-card:hover {
        border-color: var(--teal-line);
        transform: translateY(-3px);
        box-shadow: 0 12px 40px rgba(70,138,154,.08);
    }
    .sup-title {
        font-family: var(--fS);
        font-size: 1.2rem;
        font-weight: 500;
        color: var(--ink);
        letter-spacing: -.01em;
        margin-bottom: 10px;
    }
    .sup-body {
        font-size: .875rem;
        color: var(--ink-3);
        line-height: 1.75;
        font-weight: 300;
    }
    .sup-tag {
        display: inline-block;
        margin-bottom: 16px;
        padding: 4px 12px;
        background: var(--teal-pale);
        border: 1px solid var(--teal-line);
        border-radius: 4px;
        font-size: .68rem;
        font-weight: 600;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--teal);
    }
    .sup-tag.orange-tag {
        background: rgba(255,122,48,.07);
        border-color: rgba(255,122,48,.2);
        color: var(--orange-dk);
    }
    .support-headline {
        position: sticky;
        top: 100px;
    }
    .support-headline .sec-title {
        font-size: clamp(2rem, 3vw, 3.2rem);
        margin-top: 20px;
    }
    .support-headline p {
        font-size: .95rem;
        color: var(--ink-3);
        line-height: 1.8;
        font-weight: 300;
        max-width: 380px;
        margin-top: 16px;
    }
    .live-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 32px;
        font-size: .78rem;
        font-weight: 600;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--teal);
    }
    .live-dot {
        width: 8px; height: 8px;
        background: #22c55e;
        border-radius: 50%;
        animation: blink 2s infinite;
    }
    .support-cards {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .testi-section {
        padding: 140px 0;
        background: var(--off);
        border-top: 1px solid var(--rule);
    }
    .testi-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: end;
        margin-bottom: 72px;
    }
    .testi-header .sec-title { font-size: clamp(2rem, 3vw, 3.2rem); }
    .testi-note {
        font-size: .9rem;
        color: var(--ink-3);
        font-weight: 300;
        line-height: 1.75;
        align-self: end;
    }
    .testi-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }
    .tcard {
        background: var(--white);
        border: 1px solid var(--rule);
        border-radius: 10px;
        padding: 32px;
        transition: all .3s var(--ease-s);
    }
    .tcard:hover {
        border-color: var(--teal-line);
        transform: translateY(-3px);
        box-shadow: 0 12px 40px rgba(70,138,154,.07);
    }
    .tcard-text {
        font-family: var(--fS);
        font-size: 1.05rem;
        font-weight: 400;
        color: var(--ink);
        line-height: 1.75;
        font-style: italic;
    }
    .tcard-author {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 28px;
        padding-top: 24px;
        border-top: 1px solid var(--rule);
    }
    .tcard-av {
        width: 34px; height: 34px;
        border-radius: 50%;
        background: var(--teal);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--fS);
        font-size: .95rem;
        font-weight: 600;
        color: white;
        flex-shrink: 0;
    }
    .tcard-name {
        font-size: .85rem;
        font-weight: 600;
        color: var(--ink);
        letter-spacing: -.01em;
    }
    .tcard-store {
        font-size: .75rem;
        color: var(--ink-4);
        margin-top: 1px;
    }

    .cta-section {
        padding: 140px 0;
        border-top: 1px solid var(--rule);
    }
    .cta-inner {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: center;
    }
    .cta-inner .sec-title { font-size: clamp(2.2rem, 3.5vw, 4rem); }
    .cta-right {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }
    .cta-right p {
        font-size: .95rem;
        color: var(--ink-3);
        line-height: 1.8;
        font-weight: 300;
    }
    .cta-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }
    .cta-note {
        font-size: .75rem;
        color: var(--ink-4);
        font-weight: 400;
        letter-spacing: .04em;
    }

    footer {
        padding: 60px 0 40px;
        border-top: 1px solid var(--rule);
        background: var(--white);
    }
    .footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 48px;
        padding-bottom: 48px;
        border-bottom: 1px solid var(--rule);
    }
    .footer-brand-desc {
        font-size: .85rem;
        color: var(--ink-4);
        line-height: 1.7;
        margin-top: 12px;
        max-width: 240px;
        font-weight: 300;
    }
    .footer-col h4 {
        font-family: var(--fB);
        font-size: .68rem;
        font-weight: 700;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: var(--ink-3);
        margin-bottom: 16px;
    }
    .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .footer-col ul li a {
        font-size: .85rem;
        color: var(--ink-4);
        font-weight: 300;
        transition: color .2s;
    }
    .footer-col ul li a:hover { color: var(--teal); }
    .footer-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 24px;
        flex-wrap: wrap;
        gap: 12px;
    }
    .footer-bottom p { font-size: .78rem; color: var(--ink-4); font-weight: 300; }
    .footer-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: .75rem;
        color: var(--ink-4);
        font-weight: 400;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }

    .sr {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity .8s var(--ease-s), transform .8s var(--ease-s);
    }
    .sr.in { opacity: 1; transform: translateY(0); }
    .sl {
        opacity: 0;
        transform: translateX(-24px);
        transition: opacity .8s var(--ease-s), transform .8s var(--ease-s);
    }
    .sl.in { opacity: 1; transform: translateX(0); }
    .sfr {
        opacity: 0;
        transform: translateX(24px);
        transition: opacity .8s var(--ease-s), transform .8s var(--ease-s);
    }
    .sfr.in { opacity: 1; transform: translateX(0); }

    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1024px) {
        .container { padding: 0 32px; }
        .hero { grid-template-columns: 1fr; }
        .hero-left { padding: 100px 32px 60px; }
        .hero-right { height: 50vw; min-height: 400px; }
        .tools-layout { grid-template-columns: 1fr; gap: 48px; }
        .tools-sticky { position: static; }
        .value-header, .gen-layout, .support-layout,
        .cta-inner, .testi-header { grid-template-columns: 1fr; gap: 40px; }
        .numbers-grid { grid-template-columns: 1fr 1fr; }
        .nitem:nth-child(2) { border-right: none; }
        .nitem:nth-child(3) { border-right: 1px solid var(--rule); border-top: 1px solid var(--rule); }
        .nitem:nth-child(4) { border-top: 1px solid var(--rule); border-right: none; }
    }
    @media (max-width: 768px) {
        nav { padding: 0 24px; }
        .nav-links { display: none; }
        .container { padding: 0 24px; }
        .hero-left { padding: 90px 24px 48px; }
        .footer-grid { grid-template-columns: 1fr 1fr; }
        .testi-grid { grid-template-columns: 1fr; }
        .value-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
        .hero-meta { gap: 16px; }
        .numbers-grid { grid-template-columns: 1fr; }
        .nitem { border-right: none; border-top: 1px solid var(--rule); }
        .nitem:first-child { border-top: none; }
        .gen-visual { grid-template-columns: 1fr; }
        .gv-img.tall { grid-row: auto; }
        .footer-grid { grid-template-columns: 1fr; }
    }
`,z=`
<div id="bar"></div>

<nav id="nav">
    <div class="nav-logo">
        <div class="logo-sq"></div>
        PixelForge AI
    </div>
    <ul class="nav-links">
        <li><a href="#tools">Tools</a></li>
        <li><a href="#generation">Generation</a></li>
        <li><a href="#support">Support</a></li>
    </ul>
    <div class="nav-right">
        <button class="btn-text">Sign In</button>
        <button class="btn-primary">Install Free</button>
    </div>
</nav>

<section class="hero">
    <div class="hero-left">
        <div class="hero-eyebrow">Shopify AI Photography</div>
        <h1>
            Professional<br>product images.<br>
            <strong>Without the cost.</strong>
        </h1>
        <p class="hero-body">
            Your customers judge your products by how they look.
            PixelForge AI gives every Shopify merchant access to
            studio-quality photography at a fraction of the cost,
            in a fraction of the time.
        </p>
        <div class="hero-actions">
            <button class="btn-hero">Install Free on Shopify</button>
            <button class="btn-outline">See It in Action</button>
        </div>
        <div class="hero-meta">
            <div class="hero-stat">
                <div class="num">8x</div>
                <div class="lbl">AI Upscaling</div>
            </div>
            <div class="meta-rule"></div>
            <div class="hero-stat">
                <div class="num">50+</div>
                <div class="lbl">Lighting Presets</div>
            </div>
            <div class="meta-rule"></div>
            <div class="hero-stat">
                <div class="num">6</div>
                <div class="lbl">AI Tools</div>
            </div>
        </div>
    </div>

    <div class="hero-right">
        <div class="hero-mosaic">
            <div class="mosaic-cell">
                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&auto=format" alt="Watch" loading="eager">
                <div class="mosaic-overlay"></div>
            </div>
            <div class="mosaic-cell">
                <img src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop&auto=format" alt="Perfume" loading="eager">
                <div class="mosaic-overlay"></div>
            </div>
            <div class="mosaic-cell">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format" alt="Shoes" loading="lazy">
                <div class="mosaic-overlay"></div>
            </div>
            <div class="mosaic-cell">
                <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop&auto=format" alt="Sneaker" loading="lazy">
                <div class="mosaic-overlay"></div>
            </div>
        </div>
        <div class="hero-right-label">
            <div class="hrl-left">
                <strong>AI processing complete</strong>
                Background removed in 1.8s
            </div>
            <div class="hrl-dot"></div>
        </div>
    </div>
</section>

<div class="ticker">
    <div class="ticker-track">
        <span class="ti">Save on Photography</span><span class="ti-sep"></span>
        <span class="ti">Grow Your Sales</span><span class="ti-sep"></span>
        <span class="ti">Professional Results in Seconds</span><span class="ti-sep"></span>
        <span class="ti">Shopify Native</span><span class="ti-sep"></span>
        <span class="ti">8x AI Upscaling</span><span class="ti-sep"></span>
        <span class="ti">24/7 Support</span><span class="ti-sep"></span>
        <span class="ti">Background Removal</span><span class="ti-sep"></span>
        <span class="ti">Studio Lighting AI</span><span class="ti-sep"></span>
        <span class="ti">No Photographer Needed</span><span class="ti-sep"></span>
        <span class="ti">Real-Time Processing</span><span class="ti-sep"></span>
        <span class="ti">Save on Photography</span><span class="ti-sep"></span>
        <span class="ti">Grow Your Sales</span><span class="ti-sep"></span>
        <span class="ti">Professional Results in Seconds</span><span class="ti-sep"></span>
        <span class="ti">Shopify Native</span><span class="ti-sep"></span>
        <span class="ti">8x AI Upscaling</span><span class="ti-sep"></span>
        <span class="ti">24/7 Support</span><span class="ti-sep"></span>
        <span class="ti">Background Removal</span><span class="ti-sep"></span>
        <span class="ti">Studio Lighting AI</span><span class="ti-sep"></span>
        <span class="ti">No Photographer Needed</span><span class="ti-sep"></span>
        <span class="ti">Real-Time Processing</span><span class="ti-sep"></span>
    </div>
</div>

<section class="numbers-section sr">
    <div class="container">
        <div class="numbers-grid" id="numGrid">
            <div class="nitem">
                <div class="big" data-target="8" data-suffix="x">8x</div>
                <div class="nlbl">Maximum image<br>upscale factor</div>
            </div>
            <div class="nitem">
                <div class="big orange" data-target="50" data-suffix="+">50+</div>
                <div class="nlbl">Professional<br>lighting presets</div>
            </div>
            <div class="nitem">
                <div class="big" data-target="6" data-suffix="">6</div>
                <div class="nlbl">AI tools built<br>into one app</div>
            </div>
            <div class="nitem">
                <div class="big orange" data-target="10" data-suffix="s">10s</div>
                <div class="nlbl">Average image<br>processing time</div>
            </div>
        </div>
    </div>
</section>

<section id="tools" class="tools-section" style="border-top: 1px solid var(--rule);">
    <div class="container">
        <div class="sl sr" style="margin-bottom: 0">
            <div class="sec-label">The toolkit</div>
        </div>
        <div class="tools-layout">
            <div class="tools-sticky sl">
                <h2 class="sec-title">
                    Six tools.<br>
                    <strong>One app.</strong><br>
                    Zero friction.
                </h2>
                <p>Every tool you need to produce product images that sell built directly into your Shopify dashboard. No external apps, no tab-switching, no learning curve.</p>
                <button class="btn-primary">Install on Shopify</button>
            </div>

            <div class="tools-list sfr" id="toolsList">
                <div class="tool-item">
                    <div class="tool-num">01</div>
                    <div class="tool-body">
                        <div class="tool-name">Background Remover</div>
                        <p class="tool-desc">Pixel-perfect product cutouts in one click. Clean, professional transparent backgrounds ready for any marketplace or custom scene.</p>
                    </div>
                </div>
                <div class="tool-item">
                    <div class="tool-num">02</div>
                    <div class="tool-body">
                        <div class="tool-name">Magic Eraser</div>
                        <p class="tool-desc">Remove unwanted objects, distractions, or blemishes from any image with AI-powered inpainting. Brush over what you want gone that is all.</p>
                    </div>
                </div>
                <div class="tool-item">
                    <div class="tool-num">03</div>
                    <div class="tool-body">
                        <div class="tool-name">AI Lighting Fix</div>
                        <p class="tool-desc">Apply professional studio lighting to existing photos. Choose from 50+ presets to transform flat images into dramatic, eye-catching shots.</p>
                    </div>
                </div>
                <div class="tool-item">
                    <div class="tool-num">04</div>
                    <div class="tool-body">
                        <div class="tool-name">Image Upscaler 8x</div>
                        <p class="tool-desc">Turn supplier low-res photos into sharp, print-ready images. AI synthesises detail that was not there customers see every thread and texture.</p>
                    </div>
                </div>
                <div class="tool-item">
                    <div class="tool-num">05</div>
                    <div class="tool-body">
                        <div class="tool-name">Image Enhancer</div>
                        <p class="tool-desc">Auto-correct colour, exposure and sharpness in one action. Trained on professional photography standards to produce natural, intentional results.</p>
                    </div>
                </div>
                <div class="tool-item">
                    <div class="tool-num">06</div>
                    <div class="tool-body">
                        <div class="tool-name">Image Compressor</div>
                        <p class="tool-desc">Reduce file size without hurting visible quality. Faster load speeds mean better Core Web Vitals, better rankings, and better conversion rates.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="value-section">
    <div class="container">
        <div class="value-header sr">
            <div>
                <div class="sec-label">Why it matters</div>
                <h2 class="sec-title">
                    Images that sell<br>
                    <strong>cost less than you think.</strong>
                </h2>
            </div>
            <p class="value-header-right">
                A single professional product photoshoot runs $500 to $3,000.
                PixelForge AI gives you the same output in seconds, not days
                at a cost that scales with your business, not against it.
            </p>
        </div>

        <div class="value-grid sr">
            <div class="vcard">
                <div class="vcard-num">$0</div>
                <div class="vcard-title">No photographer needed</div>
                <p class="vcard-body">Every tool works directly inside your Shopify store. No external bookings, no back-and-forth, no invoices for reshoots.</p>
            </div>
            <div class="vcard">
                <div class="vcard-num">+34%</div>
                <div class="vcard-title">Average conversion uplift</div>
                <p class="vcard-body">Better product images translate directly to higher add-to-cart rates. Merchants report measurable growth within the first week.</p>
            </div>
            <div class="vcard">
                <div class="vcard-num">10s</div>
                <div class="vcard-title">From raw to studio-ready</div>
                <p class="vcard-body">Submit a photo and our AI pipeline processes it in the background, delivering a professional result in under ten seconds.</p>
            </div>
        </div>
    </div>
</section>

<section class="gen-section" id="generation">
    <div class="container">
        <div class="gen-layout">
            <div class="gen-copy sl">
                <div class="sec-label">Beyond editing</div>
                <h2 class="sec-title">
                    Generate scenes.<br>
                    <strong>Not just images.</strong>
                </h2>
                <p>
                    Our Product AI Lab goes further than editing. Generate entirely new
                    product environments, virtual try-on contexts, and lifestyle scenes
                    all without a photographer, a studio, or a set.
                </p>
                <div class="gen-feats">
                    <div class="gen-feat"><span class="gen-feat-dot"></span> Virtual Try-On for any product category</div>
                    <div class="gen-feat"><span class="gen-feat-dot"></span> Universal background scene generation</div>
                    <div class="gen-feat"><span class="gen-feat-dot"></span> Lifestyle contexts matched to your brand</div>
                    <div class="gen-feat"><span class="gen-feat-dot"></span> Assign images directly to Shopify listings</div>
                    <div class="gen-feat"><span class="gen-feat-dot"></span> Async processing never blocks your workflow</div>
                </div>
                <div style="margin-top: 32px;">
                    <button class="btn-primary">Explore Product AI Lab</button>
                </div>
            </div>

            <div class="gen-visual sfr">
                <div class="gv-img tall" style="aspect-ratio: 4/7;">
                    <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=700&fit=crop&auto=format" alt="Generated product scene" loading="lazy">
                    <div class="gv-img-tag">Scene Generated</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="gv-img" style="aspect-ratio: 1;">
                        <img src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop&auto=format" alt="Lifestyle" loading="lazy">
                        <div class="gv-img-tag">Lighting Fixed</div>
                    </div>
                    <div class="gv-img" style="aspect-ratio: 1;">
                        <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format" alt="Studio" loading="lazy">
                        <div class="gv-img-tag">8x Upscaled</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="support-section" id="support">
    <div class="container">
        <div class="sl sr" style="margin-bottom:0">
            <div class="sec-label">Always available</div>
        </div>
        <div class="support-layout">
            <div class="support-headline sl">
                <h2 class="sec-title">
                    24/7 support,<br>
                    <strong>inside your store.</strong>
                </h2>
                <p>
                    We are always on. Our team works around the clock so you are
                    never blocked, never waiting, and never alone. Support lives
                    directly inside the app no email threads, no tickets lost
                    in queues.
                </p>
                <div class="live-indicator">
                    <div class="live-dot"></div>
                    Support is online now
                </div>
            </div>

            <div class="support-cards sfr">
                <div class="support-card">
                    <div class="sup-tag">Live Chat</div>
                    <div class="sup-title">Real answers, right now</div>
                    <p class="sup-body">Chat with a real support agent directly from your Shopify dashboard. Instant responses, full context no copy-pasting screenshots into an email.</p>
                </div>
                <div class="support-card">
                    <div class="sup-tag orange-tag">Ticket System</div>
                    <div class="sup-title">Complex issues, solved properly</div>
                    <p class="sup-body">Submit detailed tickets for technical or account issues. Our team replies with solutions not generic replies asking you to try again.</p>
                </div>
                <div class="support-card">
                    <div class="sup-tag">Documentation</div>
                    <div class="sup-title">Guides for every workflow</div>
                    <p class="sup-body">Step-by-step documentation for every tool, updated every time we ship. Searchable, visual, and always current.</p>
                </div>
                <div class="support-card">
                    <div class="sup-tag">Real-Time Updates</div>
                    <div class="sup-title">Know the moment it is ready</div>
                    <p class="sup-body">Live WebSocket notifications deliver your results the instant they are processed. No refreshing, no polling, no waiting.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="testi-section">
    <div class="container">
        <div class="testi-header sr">
            <div>
                <div class="sec-label">Merchant stories</div>
                <h2 class="sec-title">
                    Real stores.<br>
                    <strong>Real results.</strong>
                </h2>
            </div>
            <p class="testi-note">
                Merchants across fashion, beauty, electronics, and home goods use
                PixelForge AI to produce images that compete with brands many times their size.
            </p>
        </div>
        <div class="testi-grid sr">
            <div class="tcard">
                <p class="tcard-text">"We cancelled our photographer retainer the same week we installed this. Our jewellery has never looked this professional."</p>
                <div class="tcard-author">
                    <div class="tcard-av">S</div>
                    <div>
                        <div class="tcard-name">Sarah K.</div>
                        <div class="tcard-store">Luxe Beauty Co. Shopify Plus</div>
                    </div>
                </div>
            </div>
            <div class="tcard">
                <p class="tcard-text">"I removed price-tag stickers from 40 watch photos in under ten minutes. That used to take half a day in Photoshop."</p>
                <div class="tcard-author">
                    <div class="tcard-av" style="background: var(--orange);">M</div>
                    <div>
                        <div class="tcard-name">Marcus T.</div>
                        <div class="tcard-store">Gold & Stone Watches</div>
                    </div>
                </div>
            </div>
            <div class="tcard">
                <p class="tcard-text">"We only had low-res supplier photos. The AI made them look like we shot everything ourselves. Add-to-cart went up 28%."</p>
                <div class="tcard-author">
                    <div class="tcard-av" style="background: var(--teal-dark);">A</div>
                    <div>
                        <div class="tcard-name">Aisha R.</div>
                        <div class="tcard-store">StreetWear Republic</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <div class="cta-inner sr">
            <div>
                <div class="sec-label">Get started</div>
                <h2 class="sec-title">
                    Your products<br>
                    deserve to look<br>
                    <strong>their best.</strong>
                </h2>
            </div>
            <div class="cta-right">
                <p>
                    Install PixelForge AI today. Free to start, no credit card required.
                    Your first professional product images are ready in under two minutes,
                    with 24/7 support available from the moment you install.
                </p>
                <div class="cta-actions">
                    <button class="btn-hero">Install Free on Shopify</button>
                    <button class="btn-outline">Schedule a Demo</button>
                </div>
                <span class="cta-note">Free plan available &middot; No credit card required &middot; 2-minute setup</span>
            </div>
        </div>
    </div>
</section>

<footer>
    <div class="container">
        <div class="footer-grid">
            <div>
                <div class="nav-logo">
                    <div class="logo-sq"></div>
                    PixelForge AI
                </div>
                <p class="footer-brand-desc">Professional AI product photography for Shopify merchants. Studio-quality images, on demand.</p>
            </div>
            <div class="footer-col">
                <h4>Product</h4>
                <ul>
                    <li><a href="#">Background Remover</a></li>
                    <li><a href="#">Magic Eraser</a></li>
                    <li><a href="#">Image Upscaler</a></li>
                    <li><a href="#">Lighting Fix</a></li>
                    <li><a href="#">Product AI Lab</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><a href="#">About</a></li>
                    <li><a href="#">Blog</a></li>
                    <li><a href="#">Changelog</a></li>
                    <li><a href="#">Shopify App Store</a></li>
                </ul>
            </div>
            <div class="footer-col">
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
        <div class="footer-bottom">
            <p>&copy; 2025 PixelForge AI. All rights reserved.</p>
            <div class="footer-status">
                <div class="status-dot"></div>
                All systems operational
            </div>
        </div>
    </div>
</footer>
`;function P(){return w.useEffect(()=>{const l=document.getElementById("bar"),d=document.getElementById("nav"),c=document.querySelector(".hero-right"),p=document.getElementById("toolsList"),v=document.getElementById("numGrid"),g=()=>{if(!l)return;const e=window.scrollY/(document.body.scrollHeight-window.innerHeight)*100;l.style.width=`${e}%`},m=()=>{d&&(d.style.boxShadow=window.scrollY>40?"0 1px 24px rgba(70,138,154,.08)":"none")},f=()=>{c&&window.scrollY<window.innerHeight&&(c.style.transform=`translateY(${window.scrollY*.06}px)`)};window.addEventListener("scroll",g,{passive:!0}),window.addEventListener("scroll",m,{passive:!0}),window.addEventListener("scroll",f,{passive:!0});const n=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&(t.target.classList.add("in"),n.unobserve(t.target))})},{threshold:.1});document.querySelectorAll(".sr, .sl, .sfr").forEach(e=>n.observe(e));let o=null;p&&(o=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&t.target.querySelectorAll(".tool-item").forEach((a,s)=>{a.style.opacity="0",a.style.transform="translateX(20px)",setTimeout(()=>{a.style.transition="opacity .6s ease, transform .6s ease",a.style.opacity="1",a.style.transform="translateX(0)"},s*80)})})},{threshold:.05}),o.observe(p));const x=(e,t,a)=>{let s=null;const h=u=>{s||(s=u);const b=Math.min((u-s)/1400,1),y=1-(1-b)**3;e.textContent=`${Math.floor(y*t)}${a}`,b<1&&requestAnimationFrame(h)};requestAnimationFrame(h)};let r=null;return v&&(r=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&t.target.querySelectorAll("[data-target]").forEach(a=>{x(a,Number(a.dataset.target),a.dataset.suffix||"")})})},{threshold:.4}),r.observe(v)),()=>{window.removeEventListener("scroll",g),window.removeEventListener("scroll",m),window.removeEventListener("scroll",f),n.disconnect(),o&&o.disconnect(),r&&r.disconnect()}},[]),i.jsxs(i.Fragment,{children:[i.jsxs(k,{title:"PixelForge AI - Product Photography for Shopify",children:[i.jsx("meta",{charSet:"UTF-8"}),i.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1.0"}),i.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),i.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),i.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Figtree:wght@300;400;500;600&display=swap",rel:"stylesheet"})]}),i.jsx("style",{dangerouslySetInnerHTML:{__html:S}}),i.jsx("div",{dangerouslySetInnerHTML:{__html:z}})]})}export{P as default};
