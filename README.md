# Dom Sharpe Fitness

Personal training website for Dom Sharpe, Personal Trainer at Bannatyne Fairfield
in Hitchin and Studio 180 in Letchworth.

Live site: https://sharpestrength.com
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
├── personal-trainer-hitchin.html     # Location landing page
├── personal-trainer-letchworth.html  # Location landing page
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
- Hero: single column, centred, with a compact stats bar beneath
- Results: featured InBody scan plus the client results gallery. Sits directly
  after the hero so proof is the first thing a visitor reads
- About: Dom's 2022 to 2025 collage shown whole, with a year caption
- Services: 1:1 Training, Weight Loss, Mobility and Strength, Accountability
- Why Dom: key differentiators
- Quiz: three questions, recommends a programme and hands the answers to the form
- Testimonials: four real client reviews in a carousel with a pause control
- Calculators: BMI and 1 Rep Max. Desktop only, hidden below 768px
- Pricing: 1-2-1 session, 6-Week Coaching, 6-Week Coaching + App (recommended),
  6-Week Programme + Check-ins. Each has a collapsible "what's included" panel,
  open by default above 1200px
- FAQ: seven questions, also emitted as FAQPage structured data
- Consultation form: goal, experience, availability, consent, success state
- Footer: quick links, Instagram, WhatsApp, privacy policy


## Things that need Dom's input

- **Hero photo.** The hero is deliberately single column with no photo until a
  proper training shot exists. To bring one back, add a `.hero-portrait` div
  after `.hero-content` and set `.hero-grid` to two columns. There is a comment
  marking the spot in `index.html`.
- **Lead emails.** `DOM_EMAIL` must be set to `sharp.strength1@gmail.com` in the
  Railway service variables, along with `RESEND_API_KEY`. Without them the form
  saves enquiries to the database but sends no email. See "API" below.
- **Credentials.** Level 3 PT / First Aid / REPs badges in the About section
  need confirming before they stay up.
- **Bannatyne access.** The Hitchin location page hedges on whether clients
  need a Bannatyne membership ("ask Dom when you book"). Confirm the actual
  arrangement and tighten that FAQ answer.
- **Google Business Profile.** The single biggest local ranking factor and it
  cannot be done from this repo. Create/claim the profile at
  business.google.com with the exact name "Sharpe Strength", the Bannatyne
  Fairfield address, category "Personal trainer", the sharpestrength.com URL
  and weekly photo/review activity.
- **Google Ads.** GA4 is live. Ads is still off until `ADS_ID` and the
  conversion labels are set in `js/analytics.js`. See "Analytics" below.
- **Instagram feed.** The section is an honest "follow" panel. To show real
  posts, connect @sharpe.strength at behold.so and paste the embed where the
  comment marks it in `index.html`.


## Analytics

Everything is wired and waiting on IDs. Open `js/analytics.js` and set:

| Constant | Where to get it |
| --- | --- |
| `GA4_ID` | Set: `G-E7SYPMW2RL` |
| `ADS_ID` | ads.google.com, Tools, Conversions. `AW-XXXXXXXXX` |
| `ADS_CONVERSIONS` | One label per conversion action you create in Ads. `AW-XXXXXXXXX/AbC-D_efGh` |

Leave any of them `null` and that part simply does not load.

Consent is handled with Google Consent Mode v2 and starts fully denied, so no
cookies are written until a visitor accepts on the banner. This is what UK GDPR
and PECR require. The banner only appears once at least one ID is set.

Events already tracked:

| Event | Fires when |
| --- | --- |
| `generate_lead` (`consultation`) | Consultation form sends successfully |
| `generate_lead` (`whatsapp`) | Any WhatsApp link tapped, with location |
| `generate_lead` (`phone`) | Any `tel:` link tapped |
| `quiz_complete` | Quiz reaches the result, with all three answers |
| `select_item` | A pricing tier CTA is clicked, with the tier name |
| `cta_click` | Any "book" CTA, labelled hero / section / action_bar / footer |
| `email_click`, `instagram_click` | Outbound contact taps |

To check wiring before the IDs exist, run `SS_DEBUG = true` in the console and
click around: every event logs instead of sending.


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
- Animations are deliberately minimal: a short fade-up on scroll and nothing
  that loops. The floating barbell, glow pulse, 3D card tilt, mouse parallax,
  logo draw-on and intro sting were all removed as they read as dated and
  janked on mobile. Do not reintroduce looping animation.
- Tap targets are 44px minimum below 1024px. Check any new control against it.
- Inputs are never below 16px on mobile. Anything smaller makes iOS Safari zoom
  the page on focus.
- `--container-pad` is the single source of truth for the page gutter. The
  mobile swipe rails bleed to the screen edge with a matching negative margin,
  so never hardcode one without the other.
- Section numbers come from a CSS counter, not hardcoded digits, so hiding a
  section at a breakpoint renumbers the rest rather than leaving a gap.

### Deliberately avoided

These are the generic-landing-page defaults this site was pulled off. Do not
reintroduce them:

- **No eyebrows.** Sections open with a numbered index line (`01 Results`) in
  mono against a rule, not a floating uppercase label.
- **No two-tone headlines.** Headings are one colour. The accent earns its keep
  on the section numbers, the data and the CTAs. The h1 uses a rule underneath
  instead of colouring half the words.
- **Square-ish geometry.** `--radius` is 2px and `--shadow` is `none`. Racks,
  plates and bars are square. Do not add glow shadows or large radii.
- **Mono for every number.** Prices, kilos, body fat, dates and counts all use
  IBM Plex Mono with tabular figures. The measuring is the whole selling point,
  so it should look measured.
- **No icon chips.** The rounded-square Font Awesome tiles that used to head
  every card are gone. Use rules and numbers for structure.
- **No scroll-reveal.** Content is present when you reach it.
- **Vary sentence rhythm.** Every section subheading used to be
  "Statement. Statement." Read new copy aloud; if three in a row share a shape,
  rewrite one.


## To Do

- Add a Calendly (or similar) booking link so the free consultation can be
  booked directly rather than via the form
- Swap the hero placeholder for a real training photo
- Record video content for the hero and services sections
