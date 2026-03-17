# Dom Sharpe Fitness

Personal training website for Dom Sharpe, Personal Trainer at Bannatyne Fairfield, Hitchin.

Live site: https://domsharpefitness.netlify.app
Instagram: @sharpe.strength


## Tech

Plain HTML, CSS and JavaScript. No frameworks, no build tools.

- Fonts: Oswald (headings) and Montserrat (body) via Google Fonts
- Icons: Font Awesome 6.5.1 via CDN
- Hosting: Netlify, auto-deploys from the main branch


## File Structure

```
DomSharpeFitness/
├── index.html                   # Single-page site
├── css/
│   └── styles.css
├── js/
│   └── scripts.js
├── img/
│   ├── dom-transformation.jpg   # Dom's 2022 to 2025 collage
│   ├── inbody-progress.jpg      # InBody body composition scan
│   └── favicon.ico
└── .claude/
    └── launch.json              # Local preview server config
```


## Sections

- Navbar: fixed, goes solid on scroll, hamburger menu on mobile
- Hero: animated SVG barbell with mouse parallax, stat counters, scroll progress bar
- About: Dom's 2022 to 2025 transformation story and photo
- Services: 1:1 Training, Weight Loss, Mobility and Strength, Accountability
- Why Dom: key differentiators
- Testimonials: four real client reviews with collapsible read-more
- Results: InBody scan with body composition metrics
- Consultation form: goal selector, experience toggle, availability, success state
- Footer: quick links and Instagram


## Animations

- SVG barbell floats with keyframe animation and follows the mouse on desktop
- Sections reveal with staggered fade-up on scroll (IntersectionObserver)
- Stat counters animate in with ease-out when scrolled into view
- Orange progress bar at the top tracks scroll position
- Buttons have a shimmer sweep on hover
- The featured service card has a soft pulsing glow
- Service cards tilt in 3D when hovered on desktop
- Hero accent text pulses with an orange glow


## Running Locally

Start the preview server from `.claude/launch.json` (Node.js, port 3000), or just open `index.html` in a browser.


## To Do

- Wire up the consultation form to actually send emails (Netlify Forms or Formspree)
- Add a Calendly booking link
- Add a pricing section
- Add an FAQ section
- Embed Google Maps for local SEO
- Add client before and after photos when available
