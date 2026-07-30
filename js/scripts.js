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

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
}, { passive: true });


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
