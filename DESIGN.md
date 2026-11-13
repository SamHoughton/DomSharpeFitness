# Design: Sharpe Strength

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: editorial
- Shape of the first page: the homepage (draw e46c34): a Ledge hero, then an editorial column of ledgers and rows, with a bento for the About block
- Theme: the project's own brand, not a dealt theme: near-black ground, one amber, the double-chevron logo, Oswald headlines
- Axes: dark/display-condensed/warm · posture: Restrained

## Tokens
`css/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: #0f0f0f;  --color-paper-2: #1a1a1a;  --color-paper-3: #222222;
  --color-ink: oklch(95% 0.008 85);  --color-ink-2: oklch(84% 0.008 85);  --color-muted: oklch(70% 0.008 85);  --color-rule: oklch(34% 0.006 85);
  --color-accent: #C8923A;  --color-accent-2: oklch(76% 0.13 75);  --color-accent-ink: #0f0f0f;  --color-focus: oklch(82% 0.16 80);
  --font-display: "Oswald", "Arial Narrow", sans-serif;  --font-body: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;  --font-outlier: Impact (the SVG wordmark only);
  --radius-card: 3px;  --radius-input: 2px;  --rule-hair: 1px;  --shadow-card: none;
}
```
The spacing scale, the type scale, the easings and the durations are the scaffold's and live in `css/tokens.css`. The logo keeps its original values (`--color-logo`, `--font-wordmark`); never retint it.

## Type
- Headlines: Oswald 600, uppercase for h1 and h2, line-height 1.04 or more; h3 uppercase at the title size.
- Body: IBM Plex Sans 400 and 600. Dom's and his clients' own words (quotes, "What I won't do", the closing statement) are set in Plex, mixed case, never in uppercase Oswald.
- Figures: Oswald with tabular numerals. In an InBody reading only the number takes the amber; its unit stays in ink.

## Colour
- Amber marks two things and nothing else: the one action (a single filled button recipe) and the InBody reading. The bathroom-scale reading is `--color-ink-2`.
- One lighter band at most per stretch of page (`--color-paper-2`): the client stories and the booking form.

## Controls
- Primary: amber fill, `--color-accent-ink` text, 2px radius, 52px tall (48px in the phone action bar).
- Secondary: 1px amber outline on transparent, ink text, 2px radius, 44px tall.
- Inputs: paper fill, 1px `--color-muted` border, 52px tall, focus shown as an inset outline in `--color-focus`.

## Motion
- Character: still. No reveal on scroll; the scale and scan switch cross-fades in 220ms; under reduced motion everything ends at once.

## Rolling it out
The other seven pages still load `css/styles.css`. Moving one onto this system means loading `css/tokens.css` and `css/base.css`, writing its page CSS on these tokens, and keeping its URL, copy and `data-key` tags exactly as they are.

## Exports
`css/tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request.
