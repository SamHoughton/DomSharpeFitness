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


// === PARALLAX: hero deco dumbbells ===
const decoLeft  = document.querySelector('.hero-deco-left');
const decoRight = document.querySelector('.hero-deco-right');

if (decoLeft && decoRight) {
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        decoLeft.style.transform  = `translateY(calc(-50% + ${y * 0.15}px)) rotate(-20deg)`;
        decoRight.style.transform = `translateY(calc(-50% + ${y * 0.15}px)) rotate(20deg)`;
    }, { passive: true });
}
