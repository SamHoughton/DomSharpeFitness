/* ===================================================
   DOM SHARPE FITNESS - Scripts
=================================================== */

// === NAVBAR: scroll effect ===
const navbar = document.getElementById('navbar');
const paperBand = document.querySelector('.progress-chart-block');

window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Invert the nav any time the paper band is on screen, not only once it
    // reaches the strip directly under the nav - checked geometrically
    // against the viewport so it can't drift if the band's content reflows.
    if (paperBand) {
        const rect = paperBand.getBoundingClientRect();
        navbar.classList.toggle('over-paper', rect.top < window.innerHeight && rect.bottom > 0);
    }
}, { passive: true });


// === HERO PARALLAX + CURSOR SPOTLIGHT ===
// Desktop-with-a-mouse only: pointer:fine rules out touch, and it's skipped
// entirely under prefers-reduced-motion rather than relying on the global
// transition-duration override, since this is continuous pointer-driven
// motion rather than a one-off transition.
(function () {
    // Track relative to the inset card, not the outer amber frame, since
    // that's the visible surface the spotlight/parallax actually draw on.
    const hero = document.querySelector('.hero-inset');
    if (!hero) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const spot = hero.querySelector('.hero-spotlight');
    if (!spot) return;

    let raf = null;
    let pending = null;

    function apply() {
        raf = null;
        if (!pending) return;
        const { px, py } = pending;

        spot.style.setProperty('--spot-x', px + 'px');
        spot.style.setProperty('--spot-y', py + 'px');
    }

    hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        pending = { px, py };
        if (!raf) raf = requestAnimationFrame(apply);
    });

    hero.addEventListener('pointerenter', () => {
        spot.classList.add('is-active');
    });

    hero.addEventListener('pointerleave', () => {
        spot.classList.remove('is-active');
    });
})();


// === MOBILE MENU ===
// Guarded as a whole: pages without a hamburger nav (legal/location pages)
// simply skip this feature rather than crashing the rest of the script.
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
const overlay   = document.getElementById('mobile-overlay');

if (hamburger && navLinks && overlay) {
    const openMenu = () => {
        navLinks.classList.add('open');
        overlay.classList.add('show');
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        navLinks.classList.remove('open');
        overlay.classList.remove('show');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', () => {
        if (navLinks.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    overlay.addEventListener('click', closeMenu);

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}


// === SMOOTH SCROLL for anchor links ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
});


// === EXPERIENCE LEVEL TOGGLE (single select) ===
const experienceGroup = document.getElementById('experience-group');
const experienceInput = document.getElementById('experience');

if (experienceGroup) {
    experienceGroup.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            experienceGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            experienceInput.value = btn.dataset.value;
        });
    });
}


// === AVAILABILITY TOGGLE (multi select) ===
const availabilityGroup = document.getElementById('availability-group');

if (availabilityGroup) {
    availabilityGroup.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });
}


// === CONSULTATION FORM SUBMISSION ===
const form        = document.getElementById('consultation-form');
const formSuccess = document.getElementById('form-success');

if (form) {
    const formError = document.getElementById('form-error');

    function showFormError(msg) {
        if (!formError) return;
        formError.textContent = msg;
        formError.hidden = false;
    }

    function clearFormError() {
        if (formError) formError.hidden = true;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearFormError();

        const name       = document.getElementById('name').value.trim();
        const email      = document.getElementById('email').value.trim();
        const goal       = document.getElementById('goal').value;
        const experience = document.getElementById('experience').value;
        const consent    = document.getElementById('consent');

        if (!name || !email || !goal || !experience || (consent && !consent.checked)) {
            if (!name)       shakeBorder(document.getElementById('name'));
            if (!email)      shakeBorder(document.getElementById('email'));
            if (!goal)       shakeBorder(document.getElementById('goal'));
            if (!experience) shakeBorder(experienceGroup);
            if (consent && !consent.checked) shakeBorder(consent.closest('.form-consent'));
            showFormError('Please fill in the required fields marked with an asterisk.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            shakeBorder(document.getElementById('email'));
            showFormError('That email address does not look right, please check it.');
            return;
        }

        // Collect multi-select availability values into the hidden field
        const availabilityInput = document.getElementById('availability');
        if (availabilityInput && availabilityGroup) {
            const selected = [...availabilityGroup.querySelectorAll('.toggle-btn.active')]
                .map(b => b.dataset.value);
            availabilityInput.value = selected.join(', ');
        }

        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        function succeed() {
            form.style.display = 'none';
            formSuccess.classList.add('show');
            // The conversion that matters. Fires once, only on a real send.
            if (window.SharpeAnalytics) {
                window.SharpeAnalytics.lead('consultation', {
                    goal: goal,
                    experience: experience
                });
            }
        }

        function resetBtn() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send Consultation Request</span> <i class="fa-solid fa-paper-plane"></i>';
        }

        // Netlify Forms. The form is registered at deploy time from the static
        // HTML (data-netlify on the form plus the hidden form-name field); an
        // AJAX POST of the URL-encoded fields to our own origin files the
        // submission. Email notifications are configured in the Netlify
        // dashboard under Forms, form notifications.
        const data = new FormData(form);
        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString()
        })
        .then(r => {
            if (!r.ok) throw new Error('Form submission failed: ' + r.status);
            succeed();
        })
        .catch(() => {
            resetBtn();
            shakeBorder(submitBtn);
            showFormError(
                'Something went wrong sending that. Please message Dom on WhatsApp on 07375 219353 ' +
                'and he will get straight back to you.'
            );
        });
    });
}

function shakeBorder(el) {
    el.style.borderColor = '#ff4444';
    el.style.boxShadow = '0 0 0 3px rgba(255,68,68,0.15)';
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
    }, 2000);
}


// === ANIMATED STAT COUNTERS ===
const statCounters = document.querySelectorAll('.stat-value[data-count]');

if (statCounters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el      = entry.target;
            const target  = parseInt(el.dataset.count, 10);
            const suffix  = el.dataset.suffix || '';
            const duration = 1600;
            const start    = performance.now();

            function tick(now) {
                const elapsed  = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target) + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    statCounters.forEach(el => counterObserver.observe(el));
}


// === TAGLINE REVEAL ===
const taglineText = document.querySelector('.tagline-reveal-text');

if (taglineText) {
    const taglineObserver = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        taglineText.classList.add('in-view');
        taglineObserver.disconnect();
    }, { threshold: 0.5 });

    taglineObserver.observe(taglineText);
}


// === SECTION SCROLL REVEAL ===
// Section headers fade/slide/blur in as they're scrolled into view, the same
// technique proven above on the tagline. Elements only get the hidden
// .reveal state added here at runtime, so if JS never runs the headings stay
// visible by default instead of getting stuck invisible.
const revealTargets = document.querySelectorAll(
    '.section-index, .section-title, .section-sub'
);

if (revealTargets.length) {
    revealTargets.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.2 });

    revealTargets.forEach(el => revealObserver.observe(el));
}


// === MOBILE ACTION BAR ===
// Appears once the hero CTA has scrolled away, hides again over the contact
// form so it never covers the thing it is pointing at.
(function () {
    const bar = document.getElementById('action-bar');
    if (!bar) return;

    const hero    = document.getElementById('home');
    const contact = document.getElementById('contact');
    let visible = false;

    function update() {
        const past  = hero ? window.scrollY > hero.offsetHeight * 0.6 : true;
        const atForm = contact
            ? contact.getBoundingClientRect().top < window.innerHeight * 0.8
            : false;
        const next = past && !atForm;
        if (next !== visible) {
            visible = next;
            bar.classList.toggle('is-visible', next);
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
})();


// === SCROLL PROGRESS BAR ===
const scrollProgress = document.getElementById('scroll-progress');

if (scrollProgress) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct       = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgress.style.width = pct + '%';
    }, { passive: true });
}


// === BMI CALCULATOR ===
(function () {
    const btn        = document.getElementById('bmi-btn');
    const resultBox  = document.getElementById('bmi-result');
    const bmiValue   = document.getElementById('bmi-value');
    const bmiCat     = document.getElementById('bmi-category');
    const bmiMarker  = document.getElementById('bmi-marker');
    const metricEl   = document.getElementById('bmi-metric');
    const imperialEl = document.getElementById('bmi-imperial');
    if (!btn || !resultBox || !bmiValue || !bmiCat || !bmiMarker || !metricEl || !imperialEl) return;
    let   currentUnit = 'metric';

    document.querySelectorAll('.unit-btn[data-calc="bmi"]').forEach(b => {
        b.addEventListener('click', () => {
            currentUnit = b.dataset.unit;
            document.querySelectorAll('.unit-btn[data-calc="bmi"]').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            metricEl.classList.toggle('hidden', currentUnit !== 'metric');
            imperialEl.classList.toggle('hidden', currentUnit !== 'imperial');
            resultBox.classList.add('hidden');
        });
    });

    btn.addEventListener('click', () => {
        let heightM, weightKg;

        if (currentUnit === 'metric') {
            const h = parseFloat(document.getElementById('bmi-height-cm').value);
            const w = parseFloat(document.getElementById('bmi-weight-kg').value);
            if (!h || !w || h < 100 || w < 30) return shake(btn);
            heightM  = h / 100;
            weightKg = w;
        } else {
            const ft = parseFloat(document.getElementById('bmi-height-ft').value);
            const inches = parseFloat(document.getElementById('bmi-height-in').value) || 0;
            const lbs = parseFloat(document.getElementById('bmi-weight-lbs').value);
            if (!ft || !lbs) return shake(btn);
            heightM  = ((ft * 12) + inches) * 0.0254;
            weightKg = lbs * 0.453592;
        }

        const bmi = weightKg / (heightM * heightM);
        const rounded = Math.round(bmi * 10) / 10;

        let category, markerPct, colour;
        if      (bmi < 18.5) { category = 'Underweight'; markerPct = (bmi / 18.5) * 20;       colour = '#4a9eff'; }
        else if (bmi < 25)   { category = 'Healthy';     markerPct = 20 + ((bmi - 18.5) / 6.5) * 30; colour = '#4caf50'; }
        else if (bmi < 30)   { category = 'Overweight';  markerPct = 50 + ((bmi - 25) / 5) * 25;     colour = '#ff9800'; }
        else                 { category = 'Obese';        markerPct = Math.min(75 + ((bmi - 30) / 10) * 25, 98); colour = '#f44336'; }

        bmiValue.textContent  = rounded;
        bmiValue.style.color  = colour;
        bmiCat.textContent    = category;
        bmiMarker.style.left  = markerPct + '%';

        resultBox.classList.remove('hidden');

        // Replay the wipe on every calculation, not just the first. Removing
        // the class, forcing a reflow and re-adding it restarts the animation
        // synchronously; no rAF, so a throttled tab can't strand it.
        const bar = resultBox.querySelector('.bmi-bar');
        if (bar) {
            bar.classList.remove('is-filled');
            void bar.offsetWidth;
            bar.classList.add('is-filled');
        }
    });
})();


// === 1 REP MAX CALCULATOR ===
(function () {
    const btn       = document.getElementById('orm-btn');
    const resultBox = document.getElementById('orm-result');
    const ormValue  = document.getElementById('orm-value');
    const ormUnit   = document.getElementById('orm-unit-label');
    const weightLbl = document.getElementById('orm-weight-label');
    if (!btn || !resultBox || !ormValue || !ormUnit || !weightLbl) return;
    let   unit      = 'kg';

    document.querySelectorAll('.unit-btn[data-calc="orm"]').forEach(b => {
        b.addEventListener('click', () => {
            unit = b.dataset.unit;
            document.querySelectorAll('.unit-btn[data-calc="orm"]').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            weightLbl.textContent = `Weight Lifted (${unit})`;
            ormUnit.textContent   = `Estimated 1RM (${unit})`;
            resultBox.classList.add('hidden');
        });
    });

    btn.addEventListener('click', () => {
        const w = parseFloat(document.getElementById('orm-weight').value);
        const r = parseInt(document.getElementById('orm-reps').value, 10);
        if (!w || !r || r < 1 || r > 30 || w < 1) return shake(btn);

        // Epley formula
        const orm = w * (1 + r / 30);
        const fmt = (pct) => (Math.round(orm * pct / 2.5) * 2.5).toFixed(1) + ' ' + unit;

        // Settle from whatever's currently shown (0 on the first calculation,
        // the previous result on a recalculation), same landing motion as
        // the ring counters and pricing figures.
        const prevNum = parseFloat(ormValue.textContent);
        settleNumber(ormValue, isNaN(prevNum) ? 0 : prevNum, Math.round(orm * 10) / 10, { suffix: ' ' + unit });
        document.getElementById('orm-95').textContent = fmt(0.95);
        document.getElementById('orm-85').textContent = fmt(0.85);
        document.getElementById('orm-75').textContent = fmt(0.75);
        document.getElementById('orm-65').textContent = fmt(0.65);
        document.getElementById('orm-50').textContent = fmt(0.50);

        resultBox.classList.remove('hidden');
    });
})();


// === FAQ ACCORDION ===
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const answer   = btn.nextElementSibling;
        const expanded = btn.getAttribute('aria-expanded') === 'true';

        // Close all others
        document.querySelectorAll('.faq-question').forEach(other => {
            if (other !== btn) {
                other.setAttribute('aria-expanded', 'false');
                other.nextElementSibling.classList.remove('open');
            }
        });

        btn.setAttribute('aria-expanded', String(!expanded));
        answer.classList.toggle('open', !expanded);
    });
});


// === MAP FACADES ===
// Google Maps embeds are heavy third-party frames. Nothing loads until the
// visitor asks for a map, which keeps them off the critical path entirely.
(function () {
    document.querySelectorAll('.map-facade').forEach(btn => {
        btn.addEventListener('click', () => {
            const frame = document.createElement('iframe');
            frame.src = btn.dataset.mapSrc;
            frame.title = btn.dataset.mapTitle;
            frame.width = '100%';
            frame.height = '180';
            frame.style.border = '0';
            frame.loading = 'lazy';
            frame.referrerPolicy = 'no-referrer-when-downgrade';
            btn.replaceWith(frame);
        });
    });
})();


// === PRICING: open the "what's included" panels on wide screens ===
(function () {
    const panels = document.querySelectorAll('.pricing-details');
    if (!panels.length) return;

    const wide = window.matchMedia('(min-width: 1201px)');

    function sync() {
        panels.forEach(p => { p.open = wide.matches; });
    }

    sync();
    wide.addEventListener('change', sync);
})();


function shake(el) {
    el.style.outline = '2px solid #ff4444';
    setTimeout(() => { el.style.outline = ''; }, 1500);
}


// === DIGIT SETTLE ===
// Shared landing motion for any number appearing on the page: ease-out count
// from `from` to `to`, a small overshoot past the target, settle back, then
// one quiet flicker. Precision and prefix/suffix come from the element's
// data attributes unless overridden. Used by ring counters, scan-card
// deltas, pricing figures and the 1RM calculator output.
function settleNumber(el, from, to, opts) {
    opts = opts || {};
    const prefix = opts.prefix !== undefined ? opts.prefix : (el.dataset.prefix || '');
    const suffix = opts.suffix !== undefined ? opts.suffix : (el.dataset.suffix || '');
    const precision = (String(to).split('.')[1] || '').length;
    const fmt = (v) => prefix + v.toFixed(precision) + suffix;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = fmt(to);
        return;
    }

    const delta     = to - from;
    const overshoot = to + delta * 0.015;
    const countEnd  = 550;
    const settleEnd = 750;
    const duration  = 900;
    const start     = performance.now();
    let flickered   = false;

    function frame(now) {
        const t = now - start;
        let val;
        if (t < countEnd) {
            const p = t / countEnd;
            val = from + delta * (1 - Math.pow(1 - p, 3));
        } else if (t < settleEnd) {
            const p = (t - countEnd) / (settleEnd - countEnd);
            val = to + (overshoot - to) * Math.sin(p * Math.PI);
        } else {
            val = to;
            if (!flickered && t >= 800) {
                flickered = true;
                el.style.color = 'var(--text-muted)';
                setTimeout(() => { el.style.color = ''; }, 60);
            }
        }
        el.textContent = fmt(val);
        if (t < duration) requestAnimationFrame(frame);
        else el.textContent = fmt(to);
    }
    requestAnimationFrame(frame);
}


// === ACTIVE NAV LINK on scroll ===
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-link');

// Also used by the rail (marker snap under reduced motion) and the nav
// inversion over the paper band, both via the 'sectionchange' event rather
// than a second observer instance.
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navAnchors.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
            document.dispatchEvent(new CustomEvent('sectionchange', { detail: { id, target: entry.target } }));
        }
    });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));


// ============================================================
//  INTERACTIVE FEATURES - Animations & Interactivity
// ============================================================

// === TESTIMONIAL CAROUSEL ===
(function () {
    const carousel = document.getElementById('tc-carousel');
    const track    = document.getElementById('tc-track');
    const dots     = document.querySelectorAll('.tc-dot');
    const prevBtn  = document.getElementById('tc-prev');
    const nextBtn  = document.getElementById('tc-next');
    const playBtn  = document.getElementById('tc-play');
    if (!track) return;

    const slides = track.querySelectorAll('.tc-slide');

    // These testimonials run to ~190 words, which is 45-60 seconds of reading.
    // The old 5.5s rotation meant nobody ever finished one.
    const AUTO_MS = 12000;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let current  = 0;
    let timer    = null;
    // Autoplay is off for reduced-motion users; they drive it with the controls.
    let userWantsAuto = !reduceMotion.matches;

    function goTo(idx) {
        current = ((idx % slides.length) + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => {
            d.classList.toggle('active', i === current);
            d.setAttribute('aria-current', i === current ? 'true' : 'false');
        });
        slides.forEach((s, i) => s.setAttribute('aria-hidden', i === current ? 'false' : 'true'));
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
        stopAuto();
        if (!userWantsAuto) return;
        timer = setInterval(next, AUTO_MS);
    }

    function stopAuto() {
        clearInterval(timer);
        timer = null;
    }

    function syncPlayBtn() {
        if (!playBtn) return;
        playBtn.setAttribute('aria-label', userWantsAuto ? 'Pause testimonials' : 'Play testimonials');
        playBtn.setAttribute('aria-pressed', String(!userWantsAuto));
        playBtn.innerHTML = userWantsAuto
            ? '<i class="fa-solid fa-pause"></i>'
            : '<i class="fa-solid fa-play"></i>';
    }

    // Any manual navigation restarts the timer so the new slide gets a full read.
    function manual(fn) {
        return () => { fn(); startAuto(); };
    }

    nextBtn && nextBtn.addEventListener('click', manual(next));
    prevBtn && prevBtn.addEventListener('click', manual(prev));

    dots.forEach((dot, i) => {
        dot.addEventListener('click', manual(() => goTo(i)));
    });

    playBtn && playBtn.addEventListener('click', () => {
        userWantsAuto = !userWantsAuto;
        syncPlayBtn();
        startAuto();
    });

    reduceMotion.addEventListener('change', (e) => {
        userWantsAuto = !e.matches;
        syncPlayBtn();
        startAuto();
    });

    // Pause while hovered or keyboard-focused, resume after.
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin',  stopAuto);
    carousel.addEventListener('focusout', startAuto);

    // Pause when the tab is hidden so it does not silently advance in the background.
    document.addEventListener('visibilitychange', () => {
        document.hidden ? stopAuto() : startAuto();
    });

    // Touch swipe
    let touchStartX = null;
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 48) {
            diff > 0 ? next() : prev();
            startAuto();
        }
        touchStartX = null;
    }, { passive: true });

    goTo(0);
    syncPlayBtn();
    startAuto();
})();


// === TESTIMONIAL READ MORE ===
// Each carousel slide leads with its strongest sentence and collapses the
// full quote behind this, instead of showing 150+ words at equal weight.
(function () {
    document.querySelectorAll('.read-more-btn').forEach(btn => {
        const body = btn.previousElementSibling;
        if (!body || !body.classList.contains('testimonial-body')) return;

        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            body.classList.toggle('expanded', !expanded);
            btn.setAttribute('aria-expanded', String(!expanded));
            btn.firstChild.textContent = expanded ? 'Read the whole thing ' : 'Show less ';
        });
    });
})();


// === CLIENT QUIZ ===
(function () {
    const quizWrap     = document.querySelector('.quiz-wrap');
    const steps        = quizWrap ? quizWrap.querySelectorAll('.quiz-step') : [];
    const progressFill = document.getElementById('quiz-progress-fill');
    const stepCount    = document.getElementById('quiz-step-count');
    const restartBtn   = document.getElementById('quiz-restart');
    const backBtn      = document.getElementById('quiz-back');
    const skipBtn      = document.getElementById('quiz-skip');
    const continueBtn  = document.getElementById('quiz-continue');
    const emailInput   = document.getElementById('quiz-email');
    if (!quizWrap || !steps.length) return;

    const answers = {};
    let currentStep = 1;

    // Question 1 picks the programme.
    const programmes = {
        fat: {
            name: 'Weight Loss Programme',
            desc: 'Sustainable fat loss without crash diets. Practical nutrition guidance plus training that burns fat and keeps muscle.'
        },
        muscle: {
            name: '1:1 Personal Training',
            desc: 'A full programme built around you. Technique coaching, progressive overload, and real accountability every session.'
        },
        mobility: {
            name: 'Mobility & Strength',
            desc: 'Move better, lift better, feel better. Corrective exercise, flexibility work and injury prevention built in.'
        },
        accountability: {
            name: 'Accountability Coaching',
            desc: 'Regular check-ins, honest reviews and someone in your corner every time motivation drops. Consistency guaranteed.'
        }
    };

    // Question 2 sets where the programme starts.
    const experienceNote = {
        beginner: 'You will start with the basics: technique first, nothing intimidating, no assumed knowledge.',
        some:     'You have trained before, so Dom will rebuild from what you already know rather than starting from scratch.',
        regular:  'You already train consistently, so the focus is on structure, progression and fixing whatever has stalled.'
    };

    // Question 3 sets the package.
    const frequencyPlan = {
        once:  { name: '6-Week Coaching',       price: '£252 (£42/week)', sessions: '1 coached session/week', note: 'One focused session a week, with a progressive programme to follow on your own days.' },
        few:   { name: '6-Week Coaching + App', price: '£288 (£48/week)', sessions: '1 coached + app, 2–3x/week', note: 'Weekly coaching plus a programme in the app for the days you train alone, where most clients see the fastest change.' },
        often: { name: '6-Week Coaching + App', price: '£288 (£48/week)', sessions: '1 coached + app, 4+x/week', note: 'Training four or more times a week, so your app programme will split the week so you recover properly between sessions.' }
    };

    function setStepUI(step) {
        steps.forEach(s => s.classList.remove('active'));
        const target = quizWrap.querySelector(`[data-step="${step}"]`);
        if (target) target.classList.add('active');

        const isResult = step === 'result';
        if (progressFill) progressFill.style.width = isResult ? '100%' : `${(parseInt(step, 10) - 1) / 3 * 100}%`;
        if (stepCount) {
            stepCount.style.display = isResult ? 'none' : 'block';
            if (!isResult) stepCount.textContent = `Question ${step} of 3`;
        }
        if (backBtn) backBtn.hidden = (step === 1);
        if (skipBtn) skipBtn.hidden = isResult;

        currentStep = step;
    }

    function showStep(step) {
        setStepUI(step);
        if (step === 'result') {
            renderResult();
            if (window.SharpeAnalytics) {
                window.SharpeAnalytics.track('quiz_complete', {
                    goal: answers.goal,
                    experience: answers.experience,
                    frequency: answers.frequency
                });
            }
        }
    }

    function renderResult() {
        const p    = programmes[answers.goal] || programmes.muscle;
        const plan = frequencyPlan[answers.frequency] || frequencyPlan.few;
        const note = experienceNote[answers.experience] || '';

        const nameEl     = document.getElementById('quiz-result-name');
        const descEl     = document.getElementById('quiz-result-desc');
        const planEl     = document.getElementById('quiz-plan-name');
        const priceEl    = document.getElementById('quiz-plan-price');
        const sessionsEl = document.getElementById('quiz-plan-sessions');

        if (nameEl)  nameEl.textContent  = p.name;
        // All three answers feed the result, not just the goal.
        if (descEl)  descEl.textContent  = [p.desc, note, plan.note].filter(Boolean).join(' ');
        if (planEl)  planEl.textContent  = plan.name;
        if (priceEl) priceEl.textContent = plan.price;
        if (sessionsEl) sessionsEl.textContent = plan.sessions;
    }

    quizWrap.querySelectorAll('.quiz-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            answers[opt.dataset.key] = opt.dataset.val;

            opt.closest('.quiz-options').querySelectorAll('.quiz-opt')
               .forEach(o => {
                   o.classList.remove('selected');
                   o.setAttribute('aria-pressed', 'false');
               });
            opt.classList.add('selected');
            opt.setAttribute('aria-pressed', 'true');

            // advance after brief visual confirm
            setTimeout(() => {
                showStep(currentStep === 3 ? 'result' : currentStep + 1);
            }, 320);
        });
    });

    backBtn && backBtn.addEventListener('click', () => {
        if (currentStep === 'result') return showStep(3);
        if (currentStep > 1) showStep(currentStep - 1);
    });

    // Shows the general recommendation straight away for anyone who just
    // wants pricing rather than answering three questions. The result
    // functions already fall back sensibly when an answer is missing.
    skipBtn && skipBtn.addEventListener('click', () => showStep('result'));

    restartBtn && restartBtn.addEventListener('click', () => {
        Object.keys(answers).forEach(k => delete answers[k]);
        quizWrap.querySelectorAll('.quiz-opt').forEach(o => {
            o.classList.remove('selected');
            o.setAttribute('aria-pressed', 'false');
        });
        if (emailInput) emailInput.value = '';
        showStep(1);
    });

    // Carry the quiz answers into the consultation form instead of dead-ending.
    continueBtn && continueBtn.addEventListener('click', () => {
        const goalMap = {
            fat: 'weight-loss',
            muscle: 'strength',
            mobility: 'mobility',
            accountability: 'general'
        };
        const experienceMap = {
            beginner: 'beginner',
            some: 'intermediate',
            regular: 'advanced'
        };

        const goalSelect = document.getElementById('goal');
        if (goalSelect && goalMap[answers.goal]) goalSelect.value = goalMap[answers.goal];

        const expValue = experienceMap[answers.experience];
        const expGroup = document.getElementById('experience-group');
        const expInput = document.getElementById('experience');
        if (expGroup && expInput && expValue) {
            expGroup.querySelectorAll('.toggle-btn').forEach(b => {
                const match = b.dataset.value === expValue;
                b.classList.toggle('active', match);
                if (match) expInput.value = expValue;
            });
        }

        const emailField = document.getElementById('email');
        if (emailField && emailInput && emailInput.value.trim()) {
            emailField.value = emailInput.value.trim();
        }

        const prefillNote = document.getElementById('form-prefill-note');
        if (prefillNote) prefillNote.hidden = false;

        const contact = document.getElementById('contact');
        if (contact) {
            const navHeight = navbar ? navbar.offsetHeight : 0;
            window.scrollTo({
                top: contact.getBoundingClientRect().top + window.scrollY - navHeight - 16,
                behavior: 'smooth'
            });
        }

        // Send them to the first field they still need to fill in.
        const nameField = document.getElementById('name');
        if (nameField) setTimeout(() => nameField.focus({ preventScroll: true }), 600);
    });

    setStepUI(1);
})();


// === INBODY ANIMATED RING CHARTS ===
(function () {
    const ringsContainer = document.getElementById('inbody-rings');
    if (!ringsContainer) return;

    let animated = false;

    function animateRings() {
        if (animated) return;
        animated = true;

        // Ring fill is derived from the metric's own from/to values, not a
        // hand-typed guess: every ring gets a real minimum arc (15%) plus a
        // share proportional to how much of its data-ref reference range
        // (the size of change worth calling out for that metric) the actual
        // change covers. A bigger real change always fills more of the ring.
        const metrics = ringsContainer.querySelectorAll('.ring-metric');
        metrics.forEach((metric, i) => {
            const circle  = metric.querySelector('.ring-fill');
            const valueEl = metric.querySelector('.ring-value');
            if (!circle || !valueEl) return;

            const circumference = parseFloat(circle.getAttribute('stroke-dasharray'));
            const from = parseFloat(valueEl.dataset.from);
            const to   = parseFloat(valueEl.dataset.to);
            const ref  = parseFloat(circle.dataset.ref);

            const raw      = Math.min(Math.abs(to - from) / ref, 1);
            const fraction = 0.15 + raw * 0.85;
            const offset   = circumference * (1 - fraction);

            setTimeout(() => {
                circle.style.strokeDashoffset = offset;
            }, i * 180);
        });

        // Animate ring-value counters from→to, with a settle rather than a
        // flat landing.
        const values = ringsContainer.querySelectorAll('.ring-value');
        values.forEach((el, i) => {
            const from = parseFloat(el.dataset.from);
            const to   = parseFloat(el.dataset.to);
            setTimeout(() => settleNumber(el, from, to), i * 180 + 300);
        });
    }

    const ringObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateRings();
            ringObserver.disconnect();
        }
    }, { threshold: 0.3 });

    ringObserver.observe(ringsContainer);

    // The scale/InBody toggle below reveals this container from `hidden`,
    // which the observer above may or may not re-fire on depending on the
    // browser. Exposing the trigger here lets that toggle call it directly
    // and guarantees the rings animate the first time they're actually shown.
    ringsContainer.__animateRings = animateRings;
})();


// === DIGIT SETTLE: scan-card deltas, pricing figures ===
// Ring counters trigger via animateRings above; these fire the same landing
// motion individually as each figure scrolls into view.
(function () {
    const els = document.querySelectorAll('.settle-value');
    if (!els.length) return;

    const settleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            settleObserver.unobserve(el);
            settleNumber(el, parseFloat(el.dataset.from), parseFloat(el.dataset.to));
        });
    }, { threshold: 0.6 });

    els.forEach(el => settleObserver.observe(el));
})();


// === "THE SCALE LIED" TOGGLE ===
// Same eight weeks of data already rendered above, just switched between the
// number a bathroom scale would show and the InBody breakdown. No new data,
// just the naive view shown first so the InBody view lands as a reveal.
(function () {
    const toggle = document.querySelector('.scale-toggle');
    if (!toggle) return;

    const buttons = toggle.querySelectorAll('.scale-toggle-btn');
    const panels  = document.querySelectorAll('.scale-panel');
    const rings   = document.getElementById('inbody-rings');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            buttons.forEach(b => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-pressed', String(active));
            });

            panels.forEach(panel => {
                const show = panel.dataset.panel === view;
                panel.hidden = !show;

                // Fade and lift the incoming panel in rather than cutting to
                // it. Restarting the animation only needs a reflow between
                // removing and re-adding the class.
                if (show) {
                    panel.classList.remove('is-entering');
                    void panel.offsetWidth;
                    panel.classList.add('is-entering');
                }
            });

            if (view === 'inbody' && rings && rings.__animateRings) {
                rings.__animateRings();
            }
        });
    });
})();


// === FOUR-YEAR PROGRESS CHART: draw-on-scroll ===
// Fires once, like the ring charts above. Not a loop.
(function () {
    const chart = document.querySelector('.progress-chart');
    if (!chart) return;

    const chartObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            chart.classList.add('is-drawn');
            chartObserver.disconnect();
        }
    }, { threshold: 0.3 });

    chartObserver.observe(chart);
})();


// === COOKIE CONSENT ===
// Only shown when analytics is actually configured and the visitor has not
// already chosen. Sits above the mobile action bar so neither blocks the other.
(function () {
    const banner = document.getElementById('consent-banner');
    const A = window.SharpeAnalytics;
    if (!banner || !A) return;

    if (!A.enabled || A.storedConsent()) return;

    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('is-visible'));
    document.body.classList.add('has-consent-banner');

    function close() {
        banner.classList.remove('is-visible');
        document.body.classList.remove('has-consent-banner');
        setTimeout(() => { banner.hidden = true; }, 220);
    }

    document.getElementById('consent-accept').addEventListener('click', () => { A.grant(); close(); });
    document.getElementById('consent-decline').addEventListener('click', () => { A.deny(); close(); });
})();


// === SECTION RAIL ===
// A minimap of the page: major ticks at each numbered section's real scroll
// offset, minor ticks subdividing the gaps, and a marker tracking scroll
// position. Positions are computed from actual layout since section heights
// vary - there's no way to hard-code them in CSS.
(function () {
    const rail   = document.getElementById('rail');
    const ticksEl = document.getElementById('rail-ticks');
    const marker  = document.getElementById('rail-marker');
    if (!rail || !ticksEl || !marker) return;

    const desktopMQ = window.matchMedia('(min-width: 1024px)');
    const reduceMQ  = window.matchMedia('(prefers-reduced-motion: reduce)');

    let majors = []; // [{ id, frac, num }], sorted top to bottom
    let built  = false;

    function scrollableHeight() {
        return Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
    }

    function layout() {
        ticksEl.innerHTML = '';
        majors = [];

        const totalH = scrollableHeight();
        if (totalH <= 0) return;

        const indexEls = document.querySelectorAll('.section-index');
        const frag = document.createDocumentFragment();

        indexEls.forEach((el, i) => {
            const section = el.closest('section');
            if (!section) return;
            const top  = section.getBoundingClientRect().top + window.scrollY;
            const frac = Math.max(0, Math.min(1, top / totalH));
            majors.push({ id: section.getAttribute('id'), frac, num: i + 1 });
        });

        majors.forEach((m, i) => {
            const tick = document.createElement('div');
            tick.className = 'rail-tick rail-tick--major';
            tick.style.top = (m.frac * 100) + '%';

            const label = document.createElement('span');
            label.className = 'rail-tick-label';
            label.textContent = String(m.num).padStart(2, '0');
            tick.appendChild(label);
            frag.appendChild(tick);

            const nextFrac = majors[i + 1] ? majors[i + 1].frac : 1;
            for (let k = 1; k <= 4; k++) {
                const minor = document.createElement('div');
                minor.className = 'rail-tick rail-tick--minor';
                minor.style.top = (m.frac + (nextFrac - m.frac) * (k / 5)) * 100 + '%';
                frag.appendChild(minor);
            }
        });

        ticksEl.appendChild(frag);
        built = true;
    }

    function setMarkerFrac(frac) {
        marker.style.transform = `translateY(${frac * window.innerHeight}px)`;
    }

    let ticking = false;
    function onScroll() {
        if (reduceMQ.matches || !built) return;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const totalH = scrollableHeight();
            setMarkerFrac(totalH > 0 ? Math.max(0, Math.min(1, window.scrollY / totalH)) : 0);
            ticking = false;
        });
    }

    function snapToSection(id) {
        const m = majors.find(x => x.id === id);
        if (m) setMarkerFrac(m.frac);
    }

    function init() {
        if (!desktopMQ.matches) return;
        layout();
        if (reduceMQ.matches) {
            const activeLink = document.querySelector('.nav-link.active');
            const current = majors.find(m => m.id === (activeLink && activeLink.getAttribute('href') || '').slice(1));
            setMarkerFrac(current ? current.frac : 0);
        } else {
            setMarkerFrac(0);
        }
    }

    init();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('sectionchange', (e) => {
        if (reduceMQ.matches) snapToSection(e.detail.id);
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { built = false; init(); }, 150);
    });
})();
