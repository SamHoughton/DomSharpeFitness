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
- Results (`#transformations`): the featured InBody scan. Defaults to the
  InBody view; toggle to see what a bathroom scale would have shown for the
  same 8 weeks. Sits directly after the hero so proof comes first
- About: Dom's 2022 to 2025 collage shown whole, with a year caption.
  Deliberately sits *between* the two results sections: three consecutive
  screens of body composition data before any sign of a human read cold
- The receipts (`#results-detail`): the four-year line chart, then three
  gallery cards (a straight cut, a recomposition, and a month where the
  scale said nothing happened)
- Why Dom: "What I Won't Do", four flat statements, no icons or cards
- First Session: minute-by-minute timeline, asymmetric with a sticky heading
  column above 900px
- Two Locations: Bannatyne Fairfield vs Studio 180, full-bleed and split down
  the middle of the viewport, honest framing and a click-to-load map each
- What Dom coaches + Quiz (`#services`): four flat rows stating what's on
  offer, then the quiz that works out which one applies. These were two
  separate sections until they were folded together, since the quiz was
  already answering what the service cards described. Quiz names a
  programme, price and sessions/week, hands answers to the form, and
  "Skip to pricing" bypasses the questions
- Testimonials: Kat's result (first marathon, zero pain) gets its own
  full-width feature; the other three run in a carousel, each leading with
  a pulled sentence and collapsing the full quote behind "Read the whole
  thing"
- Calculators: BMI and 1 Rep Max. Desktop only, hidden below 768px
- Pricing: 1-2-1 session, 6-Week Coaching, 6-Week Coaching + App (the one
  Recommended badge on the site), 6-Week Programme + Check-ins. Cards carry
  the price and pitch; a ten-row comparison table below carries the detail,
  instead of four separately-worded tick lists that were hard to compare
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
- **Don't add sections to fix sections.** The page has been through two rounds
  of "this feels samey" and the answer both times was fewer blocks, not more.
  Before adding one, check whether an existing section already makes the point:
  the results gallery lost two cards to the chart above it, and the services
  grid was folded into the quiz for exactly this reason.
- **No third-party embeds on first paint.** Google Maps loads behind a
  click-to-load facade (`.map-facade`). If another embed goes in, do the same.
- **Nav order matches scroll order.** Both the navbar and the footer quick
  links are in page order. If a section moves, move its link.
- **Numbers in number slots.** The hero trust bar reads as three statistics,
  so all three have to be countable facts. "1:1 Personal Coaching" and
  "100% Commitment to You" were both cut for sitting in that slot without
  being numbers.
- **Motion is already built, extend it rather than rebuilding.** Stat
  counters, InBody rings, the progress chart draw-on and the tagline reveal
  all run off IntersectionObserver and fire once. A global
  `prefers-reduced-motion` guard at the end of styles.css covers the lot.
- **Grain, not flat fills.** Large flat dark blocks get `.has-grain`, which
  layers the shared `--grain` data URI behind the content.
- **Plate colours are encoded, not decorative.** `--plate-25/20/15/10/5` are
  Olympic plate colours, meant to be recognised by lifters and invisible to
  everyone else. They appear in exactly one place: the `.plate-rule`
  (32px &times; 2px) under each section's eyebrow, cycled in page order.
  Never on text, buttons, links, focus states, section backgrounds or card
  borders, and never more than one visible in a viewport at rest. `--accent`
  stays the only interactive colour. All five must clear 3:1 against `--bg`
  as a non-text graphic (checked; `--plate-20` is `#0068D6` rather than the
  true IWF blue `#0057B8`, which measured 2.79).
- **Micro-labels are IBM Plex Mono, 11px, 2px letter-spacing, `--text-faint`.**
  Applies to small uppercase captions (`.data-label`, `.stat-label`, table
  headers). `.section-index` is the one exception: it's primary navigational
  text repeated on every section, not a decorative caption, so it keeps
  `--text-muted` and a smaller 0.1em tracking rather than the full spec.
- **Hairlines replace card borders only where they're a content separator**,
  not a card's outer edge: `border-top: 0.5px solid var(--text-faint)` on
  repeating list items (`.wont-item`, `.coaches-item`, `.testimonial-author`).
  Boxed cards (`.result-card`, `.pricing-card`, `.testimonial-card`,
  `.location-panel`) keep their existing 1px `--border` outline; a blanket
  sweep would have restyled three major grid components sight-unseen.
- **Section rhythm is deliberate, never uniform.** Every section used to be
  `padding: 100px 0`, and that even beat is what read as machine-made before
  any of the words did. Use `--section-tight` where a section continues the
  one above it, `--section-loose` where the subject genuinely changes (About,
  Pricing, Contact), `--section-normal` otherwise. The gap between two
  sections is the sum of the first's bottom and the second's top, so set both
  ends explicitly. Do not add a media query that resets them all to one value.
- **Three widths, not one.** `--w-prose` for sentences, `--w-default`, and
  `--w-wide` for data. Apply with `.section-container--prose` / `--wide`.
- **One light section, and only one.** The four-year chart band is the single
  inversion on the site, because an InBody printout is black ink on white
  paper. Its ink colours are scoped to `.progress-chart-block` and all clear
  WCAG AA against the paper. Do not add a second light section.
- **Reveal animations must have a visible resting state.** The bar wipe and
  panel swap are CSS animations with `fill-mode: none` over an
  already-visible default, restarted by a reflow rather than by
  `requestAnimationFrame`. Never reveal by removing an `opacity: 0` via rAF:
  a throttled tab or a skipped frame strands the content invisible.


## To Do

- Add a Calendly (or similar) booking link so the free consultation can be
  booked directly rather than via the form
- Photography, which is the biggest outstanding item: the First Session
  timeline wants a full-bleed gym shot behind it, and the two location panels
  want photographs of the two rooms rather than maps. See "Things that need
  Dom's input"
- Google Ads conversion labels: `ADS_ID` is set, but each conversion action's
  `send_to` label still needs pasting into `ADS_CONVERSIONS` in
  `js/analytics.js` before phone/WhatsApp/form conversions register
- `img/inbody-progress5.jpeg` is no longer referenced (its gallery card was
  cut as a duplicate of the four-year chart). Left in place rather than
  deleted in case it's wanted elsewhere
- The `.reveal` utility in scripts.js fades in every section heading on
  scroll, which contradicts the "no scroll-reveal" house rule above. It
  arrived via a separate branch and has been left alone rather than
  unilaterally reverted, but the two should be reconciled one way or the
  other
