/* ===================================================
   DOM SHARPE FITNESS — Scripts
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
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name       = document.getElementById('name').value.trim();
        const email      = document.getElementById('email').value.trim();
        const goal       = document.getElementById('goal').value;
        const experience = document.getElementById('experience').value;

        if (!name || !email || !goal || !experience) {
            if (!name)       shakeBorder(document.getElementById('name'));
            if (!email)      shakeBorder(document.getElementById('email'));
            if (!goal)       shakeBorder(document.getElementById('goal'));
            if (!experience) shakeBorder(experienceGroup);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            shakeBorder(document.getElementById('email'));
            return;
        }

        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        setTimeout(() => {
            form.style.display = 'none';
            formSuccess.classList.add('show');
        }, 1200);
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


// === READ MORE: testimonial quotes ===
document.querySelectorAll('.read-more-btn').forEach(btn => {
    const body = btn.previousElementSibling; // .testimonial-body

    btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
            body.classList.remove('expanded');
            btn.setAttribute('aria-expanded', 'false');
            btn.innerHTML = 'Read more <i class="fa-solid fa-chevron-down"></i>';
        } else {
            body.classList.add('expanded');
            btn.setAttribute('aria-expanded', 'true');
            btn.innerHTML = 'Read less <i class="fa-solid fa-chevron-down"></i>';
        }
    });
});


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
