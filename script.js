/* ==========================================================
   Dominik.web – interakce a animace (čisté JS, bez knihoven)
   ========================================================== */
(() => {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Konfety (hravé "puf" při kliknutí) ---------- */
    const CONFETTI = ['#2f6b57', '#4f9a7e', '#d98e4a', '#cfe6da', '#f3d9b8'];
    function burst(x, y, n = 14) {
        if (reduceMotion || !document.body.animate) return;
        for (let i = 0; i < n; i++) {
            const p = document.createElement('span');
            const size = 6 + Math.random() * 7;
            p.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
                `background:${CONFETTI[i % CONFETTI.length]};border:1.5px solid #1b2a23;` +
                `border-radius:${Math.random() > .5 ? '50%' : '3px'};pointer-events:none;z-index:9999;`;
            document.body.appendChild(p);
            const a = Math.random() * Math.PI * 2;
            const d = 40 + Math.random() * 70;
            const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 20;
            p.animate([
                { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
                { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 50}px)) scale(.4) rotate(${Math.random() * 540 - 270}deg)`, opacity: 0 }
            ], { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.2,.8,.3,1)' })
                .onfinish = () => p.remove();
        }
    }
    const burstAt = (el, n) => {
        const r = el.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, n);
    };
    document.addEventListener('click', e => {
        const t = e.target.closest('.btn, .btn-submit, .social-links a, .to-top');
        if (t) burstAt(t, t.matches('.social-links a, .to-top') ? 10 : 14);
    });

    /* ---------- Rok ve footeru ---------- */
    $('#year').textContent = new Date().getFullYear();

    /* ---------- Scroll: progress, nav, to-top ---------- */
    const progress = $('#progress');
    const nav = $('#nav');
    const toTop = $('#toTop');
    let lastY = 0;

    function onScroll() {
        const y = window.scrollY;
        const h = document.documentElement.scrollHeight - innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
        nav.classList.toggle('is-scrolled', y > 30);
        toTop.classList.toggle('is-shown', y > 700);
        lastY = y;
    }
    addEventListener('scroll', onScroll, { passive: true });
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

    /* ---------- Pac-Man: nakrm ho kuličkou a scrolluje tě ke kontaktu / nahoru ---------- */
    const pac = $('#pac');
    const pellet = $('#pacPellet');
    const pacTip = $('#pacTip');
    const contactSection = $('#kontakt');
    let pacBusy = false;

    // když je kontakt už vidět, Pac-Man vrací nahoru
    const goesUp = () => contactSection.getBoundingClientRect().top < innerHeight * .55;

    function updatePac() {
        const up = goesUp();
        pac.dataset.mode = up ? 'up' : 'down';
        pacTip.textContent = up ? '' : '';
        pac.setAttribute('aria-label', up
            ? 'Zpět nahoru: nakrm Pac-Mana kuličkou'
            : 'Přejít ke kontaktu: nakrm Pac-Mana kuličkou');
    }
    addEventListener('scroll', updatePac, { passive: true });
    addEventListener('resize', updatePac);
    updatePac();

    pac.addEventListener('click', () => {
        if (pacBusy) return;
        pacBusy = true;
        const up = goesUp();

        const go = () => up
            ? scrollTo({ top: 0, behavior: 'smooth' })
            : contactSection.scrollIntoView({ behavior: 'smooth' });

        if (reduceMotion) { go(); pacBusy = false; return; }

        // 1) kulička spadne, Pac-Man se otočí s otevřenou pusou
        pac.classList.add('is-eating');
        pellet.classList.add('is-falling');

        // 2) ham! žvýkání
        setTimeout(() => { pac.classList.add('is-chew'); burstAt(pac, 12); }, 620);

        // 3) po snězení odnese návštěvníka na místo určení
        setTimeout(go, 1250);

        // 4) úklid a nová kulička
        setTimeout(() => {
            pac.classList.remove('is-eating', 'is-chew');
            pellet.classList.remove('is-falling');
            pellet.classList.add('is-respawn');
        }, 1750);
        setTimeout(() => { pellet.classList.remove('is-respawn'); pacBusy = false; updatePac(); }, 2400);
    });

    /* ---------- Mobilní menu ---------- */
    const burger = $('#burger');
    const mobileMenu = $('#mobileMenu');

    function toggleMenu(force) {
        const open = force ?? !mobileMenu.classList.contains('is-open');
        mobileMenu.classList.toggle('is-open', open);
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open);
        mobileMenu.setAttribute('aria-hidden', !open);
        document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', () => toggleMenu());
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

    /* ---------- Plovoucí indikátor v navigaci + aktivní sekce ---------- */
    const navLinks = $('#navLinks');
    const indicator = $('#navIndicator');
    const linkEls = $$('a:not(.btn)', navLinks);

    function moveIndicator(el) {
        if (!el) { indicator.style.opacity = 0; return; }
        indicator.style.opacity = 1;
        indicator.style.left = el.offsetLeft + 'px';
        indicator.style.width = el.offsetWidth + 'px';
    }
    const activeLink = () => $('a.is-active', navLinks);

    linkEls.forEach(a => a.addEventListener('mouseenter', () => moveIndicator(a)));
    navLinks.addEventListener('mouseleave', () => moveIndicator(activeLink()));
    addEventListener('resize', () => moveIndicator(activeLink()));

    const sectionIds = ['nabidka', 'postup', 'cenik', 'faq', 'kontakt'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    const spy = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            const id = en.target.id;
            linkEls.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
            moveIndicator(activeLink());
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
    // hero se počítá jako "Úvod"
    new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) {
            linkEls.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#top'));
            moveIndicator(activeLink());
        }
    }), { rootMargin: '-45% 0px -50% 0px' }).observe($('#hero'));
    setTimeout(() => moveIndicator(activeLink()), 300);

    /* ---------- Reveal on scroll ---------- */
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                en.target.classList.add('is-visible');
                revealObs.unobserve(en.target);
            }
        });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => revealObs.observe(el));

    /* ---------- Počítadla ---------- */
    const counters = $$('[data-count]');
    const countObs = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            const el = en.target;
            const target = +el.dataset.count;
            const suffix = el.dataset.suffix || '';
            const dur = 1600;
            const start = performance.now();
            (function tick(now) {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 4);
                el.textContent = Math.round(target * eased) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            })(start);
            countObs.unobserve(el);
        });
    }, { threshold: .6 });
    counters.forEach(c => countObs.observe(c));

    /* ---------- Kroky: vyplnění linky ---------- */
    const stepsFill = $('#stepsFill');
    new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) stepsFill.style.width = '100%';
    }), { threshold: .4 }).observe($('.steps'));

    /* ---------- Spotlight na kartách + efekt tlačítek ---------- */
    $$('.spot').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    // výplň tlačítka vyroste z místa, kudy myš vstoupila
    $$('.btn').forEach(btn => {
        const setPos = e => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--bx', (e.clientX - r.left) + 'px');
            btn.style.setProperty('--by', (e.clientY - r.top) + 'px');
        };
        btn.addEventListener('pointerenter', setPos);
        btn.addEventListener('pointerleave', setPos);
    });

    /* ---------- Magnetická tlačítka ---------- */
    if (finePointer && !reduceMotion) {
        $$('[data-magnetic]').forEach(el => {
            const strength = el.classList.contains('btn--block') ? 6 : 14;
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - (r.left + r.width / 2);
                const y = e.clientY - (r.top + r.height / 2);
                el.style.transform = `translate(${x / r.width * strength}px, ${y / r.height * strength}px)`;
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
        });
    }

    /* ---------- 3D náklon cenových karet ---------- */
    if (finePointer && !reduceMotion) {
        $$('.tilt').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - .5;
                const py = (e.clientY - r.top) / r.height - .5;
                card.style.transform = `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 7}deg) translateY(-6px)`;
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });
    }

    /* ---------- Vlastní kurzor ---------- */
    if (finePointer && !reduceMotion) {
        const dot = $('#cursorDot');
        const ring = $('#cursorRing');
        let mx = 0, my = 0, rx = 0, ry = 0;

        addEventListener('pointermove', e => {
            mx = e.clientX; my = e.clientY;
            document.documentElement.classList.add('has-cursor');
            document.body.classList.add('has-cursor');
            dot.style.transform = `translate(${mx}px, ${my}px)`;
        });
        document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));

        (function loop() {
            rx += (mx - rx) * .16;
            ry += (my - ry) * .16;
            ring.style.transform = `translate(${rx}px, ${ry}px)`;
            requestAnimationFrame(loop);
        })();

        const hoverables = 'a, button, .faq__q, input, textarea';
        document.addEventListener('pointerover', e => { if (e.target.closest(hoverables)) ring.classList.add('is-hover'); });
        document.addEventListener('pointerout', e => { if (e.target.closest(hoverables)) ring.classList.remove('is-hover'); });
    }

    /* ---------- FAQ akordeon ---------- */
    $$('.faq__item').forEach(item => {
        const q = $('.faq__q', item);
        q.addEventListener('click', () => {
            const open = !item.classList.contains('is-open');
            $$('.faq__item').forEach(i => {
                i.classList.remove('is-open');
                $('.faq__q', i).setAttribute('aria-expanded', 'false');
            });
            if (open) {
                item.classList.add('is-open');
                q.setAttribute('aria-expanded', 'true');
            }
        });
    });

    /* ---------- Psaný kód v hero ---------- */
    const codeBody = $('#codeBody');
    const codeLines = [
        '<span class="cm">&lt;!-- váš web, krok za krokem --&gt;</span>',
        '<span class="tag">&lt;section</span> <span class="attr">class</span>=<span class="str">"hero"</span><span class="tag">&gt;</span>',
        '  <span class="tag">&lt;h1&gt;</span>Váš nápad, ožívá<span class="tag">&lt;/h1&gt;</span>',
        '  <span class="tag">&lt;p&gt;</span>Rychle. Elegantně.<span class="tag">&lt;/p&gt;</span>',
        '  <span class="tag">&lt;a</span> <span class="attr">href</span>=<span class="str">"#kontakt"</span><span class="tag">&gt;</span>',
        '    Začněme<span class="tag">&lt;/a&gt;</span>',
        '<span class="tag">&lt;/section&gt;</span>',
        '',
        '<span class="cm">/* styl, který zaujme */</span>',
        '<span class="tag">.hero</span> { <span class="attr">animation</span>: <span class="str">fadeUp .8s</span>; }',
        '<span class="tag">.btn:hover</span> { <span class="attr">transform</span>: <span class="str">scale(1.05)</span>; }',
        '<span class="caret"></span>'
    ];

    function typeCode() {
        codeBody.innerHTML = '';
        codeLines.forEach((html, i) => {
            const span = document.createElement('span');
            span.className = 'ln';
            span.innerHTML = html || '&nbsp;';
            span.style.animationDelay = (reduceMotion ? 0 : 700 + i * 260) + 'ms';
            codeBody.appendChild(span);
        });
    }
    typeCode();

    /* ---------- Náklon kódové karty + záře podle myši ---------- */
    const codeCard = $('#codeCard');
    if (finePointer && !reduceMotion) {
        const hero = $('#hero');
        hero.addEventListener('pointermove', e => {
            const r = codeCard.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const dx = (e.clientX - cx) / innerWidth;
            const dy = (e.clientY - cy) / innerHeight;
            codeCard.style.transform = `rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg)`;
            codeCard.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
            codeCard.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
        });
        hero.addEventListener('pointerleave', () => { codeCard.style.transform = ''; });

        // parallax bloby
        // (používá vlastnost `translate`, aby se nepřepisoval CSS transform/rotate)
        const blobs = $$('.blob, .doodle');
        hero.addEventListener('pointermove', e => {
            const x = e.clientX / innerWidth - .5;
            const y = e.clientY / innerHeight - .5;
            blobs.forEach(b => {
                const d = +b.dataset.depth || 0;
                b.style.translate = `${x * d}px ${y * d}px`;
            });
        });

        // kód karta: klik = přehraj psaní znovu
        codeCard.addEventListener('click', () => { typeCode(); burstAt(codeCard, 10); });
    }

    /* ---------- Hero canvas: živá "síť" reagující na myš ---------- */
    const canvas = $('#heroCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, dpr, particles = [], rafId = 0;
    const GLYPHS = ['</>', '{ }', '+', '#', '*', '=>', '( )'];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
        dpr = Math.min(devicePixelRatio || 1, 2);
        const r = canvas.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(Math.floor((W * H) / 14000), 90);
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
            r: Math.random() * 2 + 1,
            c: Math.random() > .82 ? '217,142,74' : '47,107,87',
            g: Math.random() > .72 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : null
        }));
    }
    resize();
    addEventListener('resize', resize);

    $('#hero').addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    $('#hero').addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    let running = true;
    new IntersectionObserver(es => { running = es[0].isIntersecting; if (running && !rafId) draw(); }).observe($('#hero'));

    function draw() {
        rafId = 0;
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        const LINK = 130, MOUSE_R = 170;

        for (const p of particles) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;

            // mírné odpuzení/přitažení myší
            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d < MOUSE_R) {
                const f = (1 - d / MOUSE_R) * .6;
                p.x += (dx / d) * f; p.y += (dy / d) * f;
            }

            if (p.g) {
                ctx.font = '600 13px "JetBrains Mono", monospace';
                ctx.fillStyle = `rgba(${p.c},.5)`;
                ctx.fillText(p.g, p.x, p.y);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.c},.55)`;
                ctx.fill();
            }
        }

        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < LINK) {
                    ctx.strokeStyle = `rgba(47,107,87,${(1 - d / LINK) * .22})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
            }
            // spojení s kurzorem
            const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
            if (dm < MOUSE_R) {
                ctx.strokeStyle = `rgba(217,142,74,${(1 - dm / MOUSE_R) * .55})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            }
        }
        if (!reduceMotion) rafId = requestAnimationFrame(draw);
    }
    draw();

    /* ---------- Formulář (Formspree, odeslání bez přenačtení stránky) ---------- */
    const form = $('#contactForm');
    const status = $('#formStatus');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = $('.btn-submit', form);
        const label = $('span', btn);
        const original = label.textContent;
        btn.disabled = true; label.textContent = 'Odesílám…';
        status.className = 'form-status'; status.textContent = '';

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            });
            if (res.ok) {
                status.classList.add('ok');
                status.textContent = 'Děkuji! Zpráva byla odeslána, brzy se ozvu. 🌿';
                form.reset();
                burstAt(btn, 30);
            } else {
                throw new Error('bad response');
            }
        } catch {
            status.classList.add('err');
            status.textContent = 'Něco se nepovedlo. Zkuste to prosím znovu nebo mi napište e-mail.';
        } finally {
            btn.disabled = false; label.textContent = original;
        }
    });

    onScroll();

    console.log('%c👋 Ahoj, zvědavče! Web je psaný ručně. Chceš takový taky? dominik.pospisil@outlook.cz',
        'color:#2f6b57;font:600 13px monospace');
})();
