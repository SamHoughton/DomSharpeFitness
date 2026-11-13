/* ===================================================
   SHARPE STRENGTH - Scripts

   Small on purpose: the menu, the form, click-to-load maps, cookie consent
   and the phone action bar. Nothing is hidden until script runs.
=================================================== */

(function () {
    'use strict';

    const $  = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

    const navbar = document.getElementById('navbar');

    // === MOBILE MENU ===
        const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('nav-links');
    const overlay   = document.getElementById('mobile-overlay');

    if (hamburger && navLinks && overlay) {
        const setMenu = (open) => {
            navLinks.classList.toggle('open', open);
            overlay.classList.toggle('show', open);
            hamburger.classList.toggle('open', open);
            hamburger.setAttribute('aria-expanded', String(open));
            document.body.style.overflow = open ? 'hidden' : '';
        };

        hamburger.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
        overlay.addEventListener('click', () => setMenu(false));
        $$('a', navLinks).forEach(a => a.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                setMenu(false);
                hamburger.focus();
            }
        });
    }

    // === ACTIVE NAV LINK ===
    const sections = $$('section[id]');
    const hashLinks = $$('.nav-link').filter(a => (a.getAttribute('href') || '').startsWith('#'));

    if (sections.length && hashLinks.length && 'IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = entry.target.getAttribute('id');
                hashLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(s => sectionObserver.observe(s));
    }

    // === TICK-BOX GROUPS IN THE FORM ===
    function bindToggles(group, multi, onChange) {
        if (!group) return;
        $$('.toggle-btn', group).forEach(btn => {
            btn.addEventListener('click', () => {
                if (multi) {
                    btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true'));
                } else {
                    $$('.toggle-btn', group).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
                }
                if (onChange) onChange(btn);
            });
        });
    }

    const experienceGroup = document.getElementById('experience-group');
    const experienceInput = document.getElementById('experience');
    const availabilityGroup = document.getElementById('availability-group');

    bindToggles(experienceGroup, false, (btn) => { experienceInput.value = btn.dataset.value; });
    bindToggles(availabilityGroup, true);

    // === CONSULTATION FORM ===
    const form        = document.getElementById('consultation-form');
    const formSuccess = document.getElementById('form-success');

    function flag(el) {
        if (!el) return;
        el.classList.add('field-invalid');
        setTimeout(() => el.classList.remove('field-invalid'), 2200);
    }

    if (form) {
        const formError = document.getElementById('form-error');
        const showError = (msg) => { if (formError) { formError.textContent = msg; formError.hidden = false; } };
        const clearError = () => { if (formError) formError.hidden = true; };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            clearError();

            const nameEl     = document.getElementById('name');
            const emailEl    = document.getElementById('email');
            const goalEl     = document.getElementById('goal');
            const consent    = document.getElementById('consent');
            const name       = nameEl.value.trim();
            const email      = emailEl.value.trim();
            const goal       = goalEl.value;
            const experience = experienceInput.value;

            if (!name || !email || !goal || !experience || (consent && !consent.checked)) {
                if (!name)       flag(nameEl);
                if (!email)      flag(emailEl);
                if (!goal)       flag(goalEl);
                if (!experience) flag(experienceGroup);
                if (consent && !consent.checked) flag(consent.closest('.form-consent'));
                showError('Please fill in the required fields marked with an asterisk.');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                flag(emailEl);
                showError('That email address does not look right, please check it.');
                return;
            }

            // Multi-select availability goes into the hidden field Netlify reads.
            const availabilityInput = document.getElementById('availability');
            if (availabilityInput && availabilityGroup) {
                availabilityInput.value = $$('.toggle-btn[aria-pressed="true"]', availabilityGroup)
                    .map(b => b.dataset.value).join(', ');
            }

            const submitBtn = form.querySelector('.btn-submit');
            const idleLabel = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Netlify Forms: registered at deploy time from the static markup
            // (data-netlify plus the hidden form-name field). An AJAX POST of
            // the URL-encoded fields to our own origin files the submission;
            // email notifications are set in the Netlify dashboard.
            fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(form)).toString()
            })
            .then(r => {
                if (!r.ok) throw new Error('Form submission failed: ' + r.status);
                form.style.display = 'none';
                formSuccess.classList.add('show');
                // The conversion that matters. Fires once, only on a real send.
                if (window.SharpeAnalytics) {
                    window.SharpeAnalytics.lead('consultation', { goal: goal, experience: experience });
                }
            })
            .catch(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = idleLabel;
                flag(submitBtn);
                showError(
                    'Something went wrong sending that. Please message Dom on WhatsApp on 07375 219353 ' +
                    'and he will get straight back to you.'
                );
            });
        });
    }

    // === MAP FACADES ===
    // Google Maps is a heavy third-party frame, so nothing loads until asked.
    $$('.map-facade').forEach(btn => {
        btn.addEventListener('click', () => {
            const frame = document.createElement('iframe');
            frame.src = btn.dataset.mapSrc;
            frame.title = btn.dataset.mapTitle;
            frame.width = '100%';
            frame.height = '200';
            frame.loading = 'lazy';
            frame.referrerPolicy = 'no-referrer-when-downgrade';
            btn.replaceWith(frame);
        });
    });

    // === MOBILE ACTION BAR ===
    // Phones only (the bar is display:none above 860px in the stylesheet).
    (function () {
        const bar = document.getElementById('action-bar');
        if (!bar) return;

        const contact = document.getElementById('contact');
        let visible = false;

        // On a phone the coupon in the hero sits below the first screen, so the
        // bar is there from the start and only steps aside at the form.
        function update() {
            const atForm = contact ? contact.getBoundingClientRect().top < window.innerHeight * 0.8 : false;
            const next = !atForm;
            if (next !== visible) {
                visible = next;
                bar.classList.toggle('is-visible', next);
            }
        }

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
    })();

    // === COOKIE CONSENT ===
    // Only shown when analytics is configured and the visitor has not chosen.
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
})();
