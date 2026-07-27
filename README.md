# Dom Sharpe Fitness

Personal training website for Dom Sharpe, Personal Trainer at Bannatyne Fairfield
in Hitchin and Studio 180 in Letchworth.

Live site: https://domsharpefitness.netlify.app
Instagram: @sharpe.strength


## Tech

Plain HTML, CSS and JavaScript on the front end. No frameworks, no build step.

- Fonts: Oswald (headings) and Montserrat (body) via Google Fonts
- Icons: Font Awesome 6.5.1 via CDN
- Hosting: Netlify, auto-deploys from the main branch
- API: small Express + Postgres service in `server/`, deployed on Railway


## File Structure

```
DomSharpeFitness/
├── index.html                   # Single-page marketing site
├── privacy.html                 # Privacy policy (UK GDPR)
├── admin.html                   # Dom's consultation-leads dashboard
├── robots.txt
├── sitemap.xml
├── netlify.toml                 # Security headers + CSP
├── css/styles.css
├── js/
│   ├── config.js                # API_URL for the Railway service
│   └── scripts.js
├── img/
│   ├── dom-transformation.jpg   # 2x2 collage: left column 2022, right column 2025
│   ├── inbody-progress.jpg      # InBody scan used by the featured ring chart
│   ├── result-21kg-cut.jpg      # results gallery (see note below)
│   ├── result-10kg-cut.jpg
│   ├── result-first-month.jpg
│   ├── result-recomp.jpg
│   └── favicon.ico
└── server/                      # Express API (Railway)
    ├── server.js
    ├── db/schema.sql
    └── routes/{auth,consultations}.js
```


## Sections

- Navbar: fixed, goes solid on scroll, collapses to a hamburger below 1024px
- Hero: two columns: copy and CTAs on the left, portrait on the right, stats bar beneath
- About: Dom's 2022 to 2025 transformation with a drag-to-compare slider
- Services: 1:1 Training, Weight Loss, Mobility and Strength, Accountability
- Why Dom: key differentiators
- Quiz: three questions, recommends a programme and hands the answers to the form
- Testimonials: four real client reviews in a carousel with a pause control
- Results: featured InBody scan with animated rings, plus a client results
  gallery where the scan figures are typeset rather than left inside the photos
- Calculators: BMI and 1 Rep Max
- Pricing: 1-2-1 session, 6-Week Coaching, 6-Week Coaching + App (recommended),
  6-Week Programme + Check-ins. Each has a collapsible "what's included" panel,
  open by default above 1200px
- FAQ: seven questions, also emitted as FAQPage structured data
- Consultation form: goal, experience, availability, consent, success state
- Footer: quick links, Instagram, WhatsApp, privacy policy


## Things that need Dom's input

- **Hero photo.** The hero portrait currently crops the 2025 half of the
  transformation collage as a placeholder. Drop a proper training shot into
  `/img` and change the `background-image` on `.hero-portrait` in
  `css/styles.css` (there is a comment marking the spot).
- **Results gallery screenshots.** The four cards in the results gallery read
  their figures from typeset HTML, so they work already. The InBody photos are
  optional evidence and each card hides its own image slot if the file is
  missing. To add them, save the scans into `/img` as:
  `result-21kg-cut.jpg` (96.5kg to 74.6kg), `result-10kg-cut.jpg`
  (91.5kg to 81.8kg), `result-first-month.jpg` (99.7kg to 98.0kg) and
  `result-recomp.jpg` (muscle +1.8kg).
- **Lead emails.** `DOM_EMAIL` must be set to `sharp.strength1@gmail.com` in the
  Railway service variables, along with `RESEND_API_KEY`. Without them the form
  saves enquiries to the database but sends no email. See "API" below.
- **Credentials.** Level 3 PT / First Aid / REPs badges in the About section
  need confirming before they stay up.
- **Google Analytics.** Off by default. Set `GA_MEASUREMENT_ID` in the head of
  `index.html` to switch it on.
- **Instagram feed.** The section is an honest "follow" panel. To show real
  posts, connect @sharpe.strength at behold.so and paste the embed where the
  comment marks it in `index.html`.


## Running Locally

Start the preview server from `.claude/launch.json` (Node.js, port 3000), or
just open `index.html` in a browser.


## API

The consultation form posts to `POST /api/consultations` on the Railway
service. If that request fails, the form falls back to Netlify Forms so an
enquiry is never lost silently.

Environment variables are documented in `server/.env.example`. Without
`RESEND_API_KEY` and `DOM_EMAIL`, enquiries are still saved to the database but
no notification email is sent.

Dom's admin account is created once via `POST /api/auth/setup-dom` using
`SETUP_SECRET`. There are no client accounts, the client portal was removed.


## House style

- No em dashes anywhere in site copy. Use a comma, colon or full stop instead.


## To Do

- Add a Calendly (or similar) booking link so the free consultation can be
  booked directly rather than via the form
- Swap the hero placeholder for a real training photo
- Record video content for the hero and services sections
