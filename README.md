# Dom Sharpe Fitness

Personal training website for Dom Sharpe, Personal Trainer at Bannatyne Fairfield
in Hitchin and Studio 180 in Letchworth.

Live site: https://sharpestrength.com
Instagram: @sharpe.strength


## Tech

Plain HTML, CSS and JavaScript on the front end. No frameworks, no build step.

- Fonts: Oswald (headings), IBM Plex Sans (body) and IBM Plex Mono (numbers) via Google Fonts
- Icons: Font Awesome 6.5.1 via CDN
- Hosting: Netlify, auto-deploys from the main branch
- Forms: Netlify Forms handles the consultation form; no backend of any kind


## File Structure

```
DomSharpeFitness/
├── index.html                   # Single-page marketing site
├── privacy.html                 # Privacy policy (UK GDPR)
├── personal-trainer-hitchin.html     # Location landing page
├── personal-trainer-letchworth.html  # Location landing page
├── gyms-in-hitchin.html              # Content guide targeting "gyms in hitchin" (1,600/mo)
├── robots.txt
├── sitemap.xml
├── netlify.toml                 # Security headers + CSP
├── css/styles.css
├── js/
│   ├── analytics.js             # GA4 + Google Ads + consent
│   └── scripts.js
├── img/
│   ├── dom-transformation.jpg   # 2x2 collage: left column 2022, right column 2025
│   ├── inbody-progress.jpg      # InBody scan used by the featured ring chart
│   ├── result-21kg-cut.jpg      # results gallery (see note below)
│   ├── result-10kg-cut.jpg
│   ├── result-first-month.jpg
│   ├── result-recomp.jpg
│   └── favicon.ico
```


## Sections

- Navbar: fixed, goes solid on scroll, collapses to a hamburger below 1024px
- Hero: two-column above 900px (copy plus an illustration), with a compact
  stats bar beneath (1:1 coaching, clients transformed, coaching locations)
- Results: featured InBody scan (toggle between "what the scale saw" and "what
  the InBody saw"), a hand-built line chart plotting the 4-year client's real
  numbers, plus the client results gallery. Sits directly after the hero so
  proof is the first thing a visitor reads
- About: Dom's 2022 to 2025 collage shown whole, with a year caption
- Services: 1:1 Training, Weight Loss, Mobility and Strength, Accountability
- Why Dom: "What I Won't Do", six flat statements, no icons or cards
- First Session: minute-by-minute timeline of what an hour with Dom looks like
- Two Locations: Bannatyne Fairfield vs Studio 180, side by side with honest
  framing and a map pin each
- Quiz: three questions, recommends a programme, price and sessions/week,
  and hands the answers to the form. "Skip to pricing" bypasses the
  questions and shows the general recommendation straight away
- Testimonials: Kat's result (first marathon, zero pain) gets its own
  full-width feature; the other three run in a carousel, each leading with
  a pulled sentence and collapsing the full quote behind "Read the whole
  thing"
- Calculators: BMI and 1 Rep Max. Desktop only, hidden below 768px
- Pricing: 1-2-1 session, 6-Week Coaching, 6-Week Coaching + App (the one
  Recommended badge on the site), 6-Week Programme + Check-ins, plus a
  comparison table below the cards instead of four repeating tick lists
- FAQ: seven questions, also emitted as FAQPage structured data
- Consultation form: goal, experience, availability, consent, success state
- Footer: quick links (including First Session and Locations), Instagram,
  WhatsApp, privacy policy


## Things that need Dom's input

- **Hero photo.** The hero is deliberately single column with no photo until a
  proper training shot exists. To bring one back, add a `.hero-portrait` div
  after `.hero-content` and set `.hero-grid` to two columns. There is a comment
  marking the spot in `index.html`.
- **Form notification email (one dashboard step).** Netlify dashboard, the
  site, Forms, "consultation", Form notifications, add "Email notification" to
  sharpe.strength1@gmail.com. Without this, submissions collect in the Netlify
  Forms tab but no email is sent.
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
- **Instagram feed.** The dedicated Instagram section was removed: it only
  ever talked about content ("session clips, posted between sessions")
  without showing any, which reads as a placeholder. The footer and About
  section still link out to @sharpe.strength. To bring back a real section,
  sign up free at behold.so, connect @sharpe.strength, and add the embed
  as its own section in `index.html`.
- **"What I won't do" copy.** The six statements in the Why Dom section
  (no crash diets, no contracts, no 6am bookings, etc.) are draft copy written
  in Dom's voice from a design brief, not confirmed claims. Check each one is
  actually true to how he runs things before treating it as final.
- **Hero headline copy.** "The scale isn't what matters." is also draft
  copy from the design brief, replacing "Train hard. Live stronger." It's a
  specific claim rather than a safe generic line, so it's worth Dom
  confirming it's the message he wants leading the site.
- **First Session and Two Locations photography.** Both new sections
  (`#first-session`, `#locations`) are built on the site's graphic/mono
  language rather than real photos, because none exist yet. Once Dom shoots
  at both venues, give `.session-timeline` a full-bleed backdrop photo and
  swap the map embeds in `.location-panel-map` for real venue shots.
- **Drive time / parking notes.** Deliberately left out of the Two Locations
  section rather than guessed at. Add them once Dom confirms specifics for
  each venue.


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


## Forms

The consultation form is handled entirely by Netlify Forms. The form in
index.html carries `data-netlify="true"`, a hidden `form-name` field and a
honeypot; scripts.js submits it by AJAX to the site's own origin so the inline
success state still shows. Submissions appear in the Netlify dashboard under
Forms, and email notifications are configured there (see above). Netlify's free
tier includes 100 submissions a month, far above what this form will see.

There is no backend. The old Railway API and the admin dashboard were removed
when Railway was decommissioned; leads live in the Netlify Forms tab and in
Dom's inbox.


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
