/* ===================================================
   DOM SHARPE FITNESS - Scripts
=================================================== */

// === NAVBAR: scroll effect ===
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });


// === MOBILE MENU ===
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
const overlay   = document.getElementById('mobile-overlay');

function openMenu() {
    navLinks.classList.add('open');
    overlay.classList.add('show');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    navLinks.classList.remove('open');
    overlay.classList.remove('show');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

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


// === SMOOTH SCROLL for anchor links ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
});


// === REVEAL ON SCROLL ===
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const siblings = entry.target.parentElement.querySelectorAll('.reveal');
            const index = Array.from(siblings).indexOf(entry.target);
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


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

        const availability = document.getElementById('availability')?.value || '';
        const message      = document.getElementById('message')?.value || '';

        function succeed() {
            form.style.display = 'none';
            formSuccess.classList.add('show');
        }

        function resetBtn() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send Consultation Request</span> <i class="fa-solid fa-paper-plane"></i>';
        }

        // Fallback: if the API is unreachable, post the form to Netlify Forms so
        // the enquiry still reaches Dom instead of being silently lost.
        function postToNetlify() {
            const data = new FormData(form);
            return fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data).toString()
            }).then(r => {
                if (!r.ok) throw new Error('Netlify fallback failed');
            });
        }

        fetch(API_URL + '/api/consultations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, goal, experience, availability, message })
        })
        .then(r => r.json())
        .then(data => {
            if (!data.success) throw new Error(data.error || 'Failed');
            succeed();
        })
        .catch(() => postToNetlify().then(succeed))
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


// === INTERACTIVE BARBELL: mouse parallax ===
const barbell = document.getElementById('hero-barbell');
const hero    = document.getElementById('home');

if (barbell && hero) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let rafId = null;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        targetX = ((e.clientX - rect.left) - cx) / cx * 18;
        targetY = ((e.clientY - rect.top)  - cy) / cy * 10;
        if (!rafId) rafId = requestAnimationFrame(animateBarbell);
    });

    hero.addEventListener('mouseleave', () => {
        targetX = 0; targetY = 0;
        if (!rafId) rafId = requestAnimationFrame(animateBarbell);
    });

    function animateBarbell() {
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        barbell.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
        if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
            rafId = requestAnimationFrame(animateBarbell);
        } else {
            rafId = null;
        }
    }

    // Fade barbell out on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY / (hero.offsetHeight * 0.5);
        barbell.style.opacity = Math.max(0, 1 - scrolled);
    }, { passive: true });
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


// === SCROLL PROGRESS BAR ===
const scrollProgress = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
}, { passive: true });


// === 3D CARD TILT (desktop only) ===
if (!window.matchMedia('(hover: none)').matches) {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x    = (e.clientX - rect.left) / rect.width  - 0.5;
            const y    = (e.clientY - rect.top)  / rect.height - 0.5;
            card.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
            card.style.transform  = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = '';
            card.style.transform  = '';
        });
    });
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
    });
})();


// === 1 REP MAX CALCULATOR ===
(function () {
    const btn       = document.getElementById('orm-btn');
    const resultBox = document.getElementById('orm-result');
    const ormValue  = document.getElementById('orm-value');
    const ormUnit   = document.getElementById('orm-unit-label');
    const weightLbl = document.getElementById('orm-weight-label');
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

        ormValue.textContent = (Math.round(orm * 10) / 10) + ' ' + unit;
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


// === LOCATION SWITCHER (contact map) ===
(function () {
    const tabs = document.getElementById('location-tabs');
    const map  = document.getElementById('location-map');
    if (!tabs || !map) return;

    tabs.querySelectorAll('.location-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.querySelectorAll('.location-tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            map.src   = tab.dataset.map;
            map.title = tab.dataset.title;
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


// === ACTIVE NAV LINK on scroll ===
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navAnchors.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
        }
    });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));


// ============================================================
//  INTERACTIVE FEATURES - Animations & Interactivity
// ============================================================

// === REVEAL VARIANTS (left / right / scale) ===
const variantRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const siblings = el.parentElement.querySelectorAll('.reveal-left, .reveal-right, .reveal-scale');
            const idx = Array.from(siblings).indexOf(el);
            setTimeout(() => el.classList.add('visible'), idx * 100);
            variantRevealObserver.unobserve(el);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    variantRevealObserver.observe(el);
});


// === PARALLAX HERO BACKGROUND ===
const heroBgPattern = document.querySelector('.hero-bg-pattern');
const heroSection   = document.getElementById('home');

if (heroBgPattern && heroSection) {
    heroBgPattern.classList.add('hero-bg-parallax');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (scrolled < heroSection.offsetHeight * 1.2) {
            heroBgPattern.style.transform = `translateY(${scrolled * 0.35}px)`;
        }
    }, { passive: true });
}


// === BEFORE / AFTER TRANSFORMATION SLIDER ===
(function () {
    const slider  = document.getElementById('ba-slider');
    const baAfter = document.getElementById('ba-after');
    const baHandle = document.getElementById('ba-handle');
    const baHint  = document.getElementById('ba-drag-hint');
    if (!slider || !baAfter || !baHandle) return;

    let isDragging = false;
    let hintHidden = false;

    function getPct(clientX) {
        const rect = slider.getBoundingClientRect();
        return Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    }

    function setPosition(pct) {
        baAfter.style.clipPath  = `inset(0 0 0 ${pct}%)`;
        baHandle.style.left     = `${pct}%`;
        if (!hintHidden) {
            hintHidden = true;
            baHint && baHint.classList.add('hidden');
        }
    }

    // Mouse
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        setPosition(getPct(e.clientX));
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) setPosition(getPct(e.clientX));
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    // Touch
    slider.addEventListener('touchstart', (e) => {
        setPosition(getPct(e.touches[0].clientX));
    }, { passive: true });
    slider.addEventListener('touchmove', (e) => {
        setPosition(getPct(e.touches[0].clientX));
    }, { passive: true });

    // Intro sweep animation on scroll into view (100 → 50)
    const baObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            let startTs = null;
            function animateIntro(ts) {
                if (!startTs) startTs = ts;
                const t     = Math.min((ts - startTs) / 900, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                const pct   = 100 - eased * 50; // sweeps from 100 to 50
                baAfter.style.clipPath = `inset(0 0 0 ${pct}%)`;
                baHandle.style.left    = `${pct}%`;
                if (t < 1) requestAnimationFrame(animateIntro);
            }
            setTimeout(() => requestAnimationFrame(animateIntro), 500);
            baObserver.unobserve(entry.target);
        });
    }, { threshold: 0.3 });
    baObserver.observe(slider);
})();


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


// === CLIENT QUIZ ===
(function () {
    const quizWrap     = document.querySelector('.quiz-wrap');
    const steps        = quizWrap ? quizWrap.querySelectorAll('.quiz-step') : [];
    const progressFill = document.getElementById('quiz-progress-fill');
    const stepCount    = document.getElementById('quiz-step-count');
    const restartBtn   = document.getElementById('quiz-restart');
    const backBtn      = document.getElementById('quiz-back');
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
        once:  { name: '6-Week Coaching',            price: '£252 (£42/week)', note: 'One focused session a week, with a progressive programme to follow on your own days.' },
        few:   { name: '6-Week Coaching + App',      price: '£288 (£48/week)', note: 'Weekly coaching plus a programme in the app for the days you train alone, where most clients see the fastest change.' },
        often: { name: '6-Week Coaching + App',      price: '£288 (£48/week)', note: 'Training four or more times a week, so your app programme will split the week so you recover properly between sessions.' }
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

        currentStep = step;
    }

    function showStep(step) {
        setStepUI(step);
        if (step === 'result') renderResult();
    }

    function renderResult() {
        const p    = programmes[answers.goal] || programmes.muscle;
        const plan = frequencyPlan[answers.frequency] || frequencyPlan.few;
        const note = experienceNote[answers.experience] || '';

        const nameEl  = document.getElementById('quiz-result-name');
        const descEl  = document.getElementById('quiz-result-desc');
        const planEl  = document.getElementById('quiz-plan-name');
        const priceEl = document.getElementById('quiz-plan-price');

        if (nameEl)  nameEl.textContent  = p.name;
        // All three answers feed the result, not just the goal.
        if (descEl)  descEl.textContent  = [p.desc, note, plan.note].filter(Boolean).join(' ');
        if (planEl)  planEl.textContent  = plan.name;
        if (priceEl) priceEl.textContent = plan.price;
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

        const fills = ringsContainer.querySelectorAll('.ring-fill');
        fills.forEach((circle, i) => {
            const target = parseFloat(circle.dataset.target);
            setTimeout(() => {
                circle.style.strokeDashoffset = target;
            }, i * 180);
        });

        // Animate ring-value counters from→to
        const values = ringsContainer.querySelectorAll('.ring-value');
        values.forEach((el, i) => {
            const from     = parseFloat(el.dataset.from);
            const to       = parseFloat(el.dataset.to);
            const suffix   = el.dataset.suffix || '';
            const duration = 1200;
            const delay    = i * 180;

            setTimeout(() => {
                const start = performance.now();
                function tick(now) {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased    = 1 - Math.pow(1 - progress, 3);
                    const val      = from + (to - from) * eased;
                    el.textContent = val.toFixed(1) + suffix;
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            }, delay + 300);
        });
    }

    const ringObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateRings();
            ringObserver.disconnect();
        }
    }, { threshold: 0.3 });

    ringObserver.observe(ringsContainer);
})();



// === PAGE INTRO STING ===
(function () {
    const intro  = document.getElementById('page-intro');
    if (!intro) return;

    // Skip if reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        intro.remove();
        return;
    }

    // Only run once per browser session
    if (sessionStorage.getItem('intro-seen')) {
        intro.remove();
        return;
    }
    sessionStorage.setItem('intro-seen', '1');

    // Lock scroll while intro plays
    document.body.style.overflow = 'hidden';

    // Timing:
    //   0.08s  → ch-1 starts drawing (0.38s duration → done at 0.46s)
    //   0.26s  → ch-2 starts drawing (0.38s duration → done at 0.64s)
    //   + 0.22s hold after last chevron finishes
    //   = trigger exit at ~0.86s
    const exitDelay = 860;

    setTimeout(() => {
        intro.classList.add('intro-exit');
        document.body.style.overflow = '';

        // Remove from DOM after transition completes
        intro.addEventListener('transitionend', () => intro.remove(), { once: true });
    }, exitDelay);
})();
