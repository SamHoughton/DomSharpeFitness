# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences on one site, and the site has to let each recognise itself:

- **Gym-shy everyday adults** in Hitchin and Letchworth (Hertfordshire). They want to lose fat or get stronger, have started and stopped before ("tired of starting again every January"), and feel out of place or judged in gyms. Testimonials describe arriving "nervous, unsure and in the worst shape of my life" and never feeling intimidated.
- **Serious lifters and HYROX racers** who already train and want proper coaching or programming. Served by the HYROX coaching page, the free HYROX plan generator and the "Competes, not just coaches" proof.

Job on the site: decide whether Dom is the right trainer, then book the free consultation (form, WhatsApp or phone). Visitors are mostly on a phone, many arriving from local search ("personal trainer Hitchin", "gyms in Letchworth").

## Product Purpose

Sharpe Strength is Dom Sharpe's 1:1 personal training business. He coaches from Bannatyne Fairfield (Hitchin) and Studio 180 (Letchworth). The website exists to turn local search and Instagram traffic into free consultation bookings. Success is a booked consultation; the first one is free and nothing is signed.

## Positioning

Every client is tracked on an InBody body-composition scanner, and progress is judged by fat and muscle, not by bathroom-scale weight. The headline claim is "The scale isn't what matters." The proof is real scan data: same client, same weeks, measured two ways; a four-year scan series; recompositions where the scale barely moved but fat dropped and muscle rose. A neighbouring trainer could copy the words but not the scans, and not Dom's own 2022 to 2025 transformation or his HYROX racing.

## Operating Context

- Sessions are 60 minutes, one to one.
- The first session is structured: 0 to 10 talk, 10 to 20 movement screen, 20 to 25 InBody scan, 25 to 55 train, 55 to 60 what's next.
- Two venues with different characters: a busy full health club (Bannatyne Fairfield, Hitchin) and a private PT studio with no gym floor (Studio 180, Letchworth).
- Packages: 1-2-1 session, 6-week coaching, 6-week coaching plus app (the one "Recommended" tier), 6-week programme plus check-ins. Prices live in `data/pricing.json`.
- Leads arrive via a Netlify Form, WhatsApp and phone.

## Capabilities and Constraints

- Static site: plain HTML, CSS and JavaScript, Netlify hosting, no framework, no build step (existing codebase; not re-opened).
- Existing functionality to preserve: consultation form, "which programme" quiz, BMI and 1RM calculators, results chart and before/after toggle, testimonial carousel, pricing table and FAQ with FAQPage structured data, GA4 and Google Ads with consent mode, click-to-load maps, HYROX plan generator tool.
- Pages: homepage, two personal-trainer landing pages (Hitchin, Letchworth), two gym guides, HYROX training plan, HYROX coaching, privacy. Landing page and guide URLs are SEO assets; keeping their paths is the default, not an explicit user commitment.
- **Every fact and number stays fixed** (user-confirmed): prices, scan figures, client quotes, addresses, times, counts. Copy may be restructured; claims may not change.
- Prices and repeated scan figures are synced by `scripts/sync-pricing.js` and `scripts/check-scan-data.js`; never hand-edit a price in HTML.
- Undecided: credentials badges (Level 3 PT, First Aid, REPs, HYROX Athlete) are still awaiting Dom's confirmation; "What I won't do" statements and the hero headline are draft copy awaiting Dom's confirmation; Bannatyne access arrangement is unconfirmed.

## Brand Commitments

- Name: Sharpe Strength (sharpestrength.com), trading from the repo as Dom Sharpe Fitness. Instagram @sharpe.strength.
- Voice: plain, honest, specific, a little dry. States what he won't do. Admits "I still drink. I still eat junk food." No hype, no transformation-industry superlatives.
- House rule: no em dashes anywhere in copy.
- **Binding, user-confirmed (2026-11-03):** keep the dark theme and the existing branding. That means the near-black ground (`#0f0f0f`), the amber accent (`#C8923A`), the double-chevron logo mark with the SHARPE / STRENGTH wordmark, and the Oswald headline voice. A first redesign attempt replaced all of this with a light green card and was rejected outright ("horrid design"). Any redesign must make the site distinctive inside this identity, never by swapping it out.
- The user's goal is unchanged: after a long struggle the site still reads as generic, and they want it to stop. The difference has to come from composition, the one big idea of each section, real imagery and numbers, and interaction, not from a new palette.

## Evidence on Hand

In `img/`: Dom at HYROX London on the battle ropes (`dom-hyrox-hero.jpg`), sled push (`dom-hyrox-sled.jpg`), finish photo (`dom-hyrox-finish.jpg`, `-thumb.jpg`), Dom's 2022 and 2025 collage (`dom-transformation.jpg`), five InBody printouts (`inbody-progress*.jpg|jpeg`). Four named client testimonials (Kat, Alex, Amber, Sally-Anne). Counts: 17 clients transformed, 2 locations. HYROX Manchester finish time 1:27:37. Scan series in the homepage markup, tagged `data-key="results.*"`.

Absences future work must not fabricate: no photographs of the two venues, no photographs of Dom coaching a client, no video, no Google reviews feed, no client photo galleries beyond what is above. Hero and First Session photography is competition footage standing in for coaching.

## Product Principles

1. **Measured, not motivational.** The numbers are the argument; present them as evidence a sceptic could check, never as hype.
2. **Both rooms at once.** A first-time gym-shy visitor and a HYROX racer should each feel the site was made for them within the first screen, without a menu of audiences.
3. **Say what you won't do.** Honesty and restraint are the differentiator against the category's shouting.
4. **Local and human first.** Two real rooms in two real towns and one named coach, not a brand.
5. **Fewer, better blocks.** The page has been through repeated "feels samey" rounds; the answer has always been less, not more.

## Accessibility & Inclusion

No product-specific standard was stated. Existing house rules to preserve: 44px minimum tap targets below 1024px, inputs at 16px or larger on mobile, `prefers-reduced-motion` respected, text contrast at WCAG AA. The audience includes people anxious about gyms, so the tone of the interface itself should not feel intimidating.
