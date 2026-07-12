# aussiesrus.com.au — Complete Build Specification

**Project:** Independent Australian solar & battery guide
**Stack:** Astro (static) on Cloudflare Pages
**Version:** 1.0 — 12 July 2026
**Owner:** Michel Borrer
**Audience for this document:** the developer building the site end-to-end

---

## 0. How to use this document

This spec is intended to be buildable in a single pass. It defines strategy (so you understand *why* pages exist), brand and design tokens (exact values, no interpretation needed), information architecture, data schemas with seed values, component specs, per-page content briefs, and technical/deployment configuration.

**Definition of done:** every item in §12 (Launch checklist) passes. Anything not listed in this document is out of scope for v1 (see §13).

**Placeholder convention:** values marked `⚠ VERIFY` are correct as of writing but change on a legislated schedule or need confirmation against the primary source before launch. They live in data files (§5), never hardcoded in templates. The owner signs off on data-file values before go-live.

**Inputs the owner supplies before/during the build (§11):**
1. Top ~20 backlink target URLs from Ahrefs (for link-reclaim redirects/stubs)
2. GoHighLevel webhook URL + Turnstile keys (as Cloudflare env vars)
3. ABN and contact email for footer/legal pages
4. Final sign-off on data-file seed values

---

## 1. Strategy

### 1.1 What this site is

An **independent information and comparison site** for Australian home solar and battery buyers. The editorial product is *verified, current rebate data* — the federal Cheaper Home Batteries Program changes its rates on a legislated schedule (every 6 months from 2027, with a major structural change on 1 May 2026), which strands stale content across the web at each step-down. This site wins by being demonstrably current: every data page carries a visible "last verified" date, and rate data is templated from a single source of truth so a rate change is a one-file update that refreshes the whole site.

### 1.2 Positioning

**"Australia's independent solar & battery guide."** The two dominant comparison sites are no longer independent — SolarQuotes is owned by Origin Energy (an energy retailer) and Solar Choice by Flow Power. Independence is stated explicitly on the About page and implicitly everywhere through tone: numbers first, no hype, we tell you when the rebate drops and by how much.

Brand voice in one sentence: **a mate who's good with numbers and doesn't sell anything.**

### 1.3 Business model (phased — build for Phase 1, scaffold Phase 2)

- **Phase 1 (launch):** Display ads (AdSense) + affiliate links. Site is a pure content asset. The quote form page is built but hidden from nav (`noindex`, direct URL only) so Phase 2 is a config flip, not a build.
- **Phase 2 (post-traffic):** Quote form → Cloudflare Pages Function → GoHighLevel webhook. Leads sold to aggregators first, direct installer deals later. Not in v1 scope beyond the gated form page and the working function.

### 1.4 Audience

Australian homeowners, roughly 35–70, researching a $3,000–$20,000 purchase decision (battery, solar, or both). They arrive from Google mid-research, confused by conflicting rebate figures. Secondary audience (Phase 2): solar installers evaluating the site as a lead source — the site must look credible to them too.

### 1.5 SEO thesis

1. **Primary cluster — battery rebate** (highest volume, highest confusion, resets at every step-down): hub page + calculator + state stacking pages + "what changed" page.
2. **Secondary cluster — costs and worth-it** (buyer intent): cost-after-rebate pages, payback guide.
3. **Conquest cluster** (low volume, high trust-transfer): "who owns SolarQuotes", "SolarQuotes alternatives".
4. Aged-domain link equity reclaimed via 301s/stubs to the top ~20 historical link targets (§11).

Freshness is the ranking strategy: `dateModified` in schema and visible "Last verified" dates are wired to the data files, so every rate update legitimately refreshes every data-driven page.

### 1.6 KPIs (owner-facing, not build requirements)

Phase 1: indexed within 2 weeks; ranking movement on 5 money terms within 90 days; 50+ organic clicks/day by month 4–6. Phase 2 trigger: consistent organic clicks on money pages.

---

## 2. Brand

### 2.1 Name treatment

- Site name: **Aussies R Us** (never "AussiesRUs" or "Aussies'R'Us")
- Full lockup: **Aussies R Us — Australia's independent solar & battery guide**
- The name is casual and a bit retro. Don't fight it and don't camp on it — the design treats it as plainspoken signage (see logo direction), and the seriousness comes from the data presentation.

### 2.2 Logo direction (dev builds this — no external designer)

Text wordmark only, set in the display face (Archivo, 800 weight, semi-expanded), all caps, ink colour: `AUSSIES R US`. The "R" sits in a solid sun-yellow rounded square (the only graphic element), yellow `--sun` with the R in ink. Renders as inline SVG in the header (crisp at all sizes, no image request). Favicon: the yellow square-R alone.

### 2.3 Voice and copy rules

- Plain Australian English, AU spelling (litre, colour, organise). Sentence case everywhere including headings and buttons.
- Numbers carry the argument. Every claim about money is a figure with a date. Prefer "the rebate is worth about $252 per usable kWh (verified 12 Jul 2026)" over "generous rebates are available".
- No urgency theatre. The step-down schedule is stated as fact with dates; never "act now before it's too late!!". The legislated decline *is* the urgency — presenting it flatly is both more credible and more persuasive.
- Buttons say what they do: "Calculate my rebate", "See WA rates", not "Get started", "Learn more".
- First person plural ("we verify every figure against the Clean Energy Regulator"), never third person ("Aussies R Us believes…").
- Disclose everything: ownership of competitors, how the site makes money, when figures were last checked.

### 2.4 Editorial furniture (recurring content devices)

- **Last verified stamp** on every data-driven page (component, §6.4)
- **"What changed" changelog** page — every data-file update gets a dated entry; this is both a trust signal and a freshness signal
- **Worked examples** use the same three reference systems everywhere for continuity: a 10 kWh battery, a 13.5 kWh battery (Powerwall 3 class), and a 30 kWh large system

---

## 3. Design system

Design intent: **public information, not startup marketing.** The reference aesthetic is Australian roadside signage and the servo fuel-price board — big legible numbers that change on a schedule — crossed with the sober typography of government consumer information. One signature element (the Rate Board, §3.5) carries all the personality; everything else stays quiet and disciplined.

Explicitly avoid: cream-paper-and-terracotta editorial styling, dark-mode-with-acid-green energy-startup styling, and newspaper hairline broadsheet styling. This site is bright, flat, and legible.

### 3.1 Colour tokens

All colours as CSS custom properties in `src/styles/global.css`. No other colours may be introduced.

```css
:root {
  --paper:    #FBFAF7;  /* page background — warm white, not cream */
  --ink:      #17201D;  /* all body text, headings — near-black with eucalyptus undertone */
  --sun:      #F2A900;  /* signature accent — deep golden amber. Backgrounds/accents ONLY, never text on paper */
  --eucalypt: #146356;  /* links, positive deltas, savings figures */
  --panel:    #0E1B2C;  /* dark surfaces: Rate Board, footer, table headers — monocrystalline navy */
  --alert:    #B42318;  /* step-down warnings, negative deltas — sparing use */

  /* derived */
  --paper-dim: #F1EFE9; /* card/table-stripe background */
  --ink-soft:  #4A5450; /* captions, meta text (passes AA on paper) */
  --line:      #D9D6CC; /* borders, dividers */
  --sun-tint:  #FCEECB; /* callout backgrounds */
}
```

**Contrast rules (enforced):**
- Text on `--paper` is only ever `--ink`, `--ink-soft`, `--eucalypt`, or `--alert`. Never `--sun`.
- On `--panel`: text is `--paper`; figures may be `--sun` at ≥ 20px only.
- `--sun` appears as: the logo square, CTA button background (with `--ink` text), the verified-stamp tag, Rate Board accents, and active-state indicators. Nowhere else.

### 3.2 Typography

Three roles, all self-hosted via Fontsource (§9.4). `font-display: swap`, woff2 preloaded for the two files used above the fold.

| Role | Face | Weights | Usage |
|---|---|---|---|
| Display | **Archivo** (use `font-stretch: semi-expanded` via the variable font) | 700, 800 | H1–H2, wordmark, Rate Board labels. All caps only in wordmark and Rate Board; headings sentence case. |
| Body | **Public Sans** | 400, 600 | All body text, nav, H3–H4 (600), captions. The public-service plainness is the point. |
| Data | **IBM Plex Mono** | 400, 500 | **Every numeral that represents money, kWh, STCs, dates-as-data, or percentages sitewide**, plus tables of figures and calculator output. `font-variant-numeric: tabular-nums`. |

The mono-for-figures rule is a core identity decision: it makes the site read as "the numbers site" at a glance and keeps changing figures visually stable. Implement as a `.fig` utility class and apply in components — do not rely on authors remembering it in body copy (see `<Fig>` component, §6.8).

**Type scale** (fluid, `clamp()`):

```css
--t-hero: clamp(2.2rem, 5vw, 3.4rem);   /* H1, Archivo 800 */
--t-h2:   clamp(1.5rem, 3vw, 2rem);     /* Archivo 700 */
--t-h3:   1.25rem;                      /* Public Sans 600 */
--t-body: 1.0625rem;                    /* 17px, Public Sans 400, line-height 1.65 */
--t-meta: 0.875rem;                     /* captions, stamps */
--t-board: clamp(1.8rem, 4vw, 2.6rem);  /* Rate Board figures, Plex Mono 500 */
```

Measure: article text max-width `70ch`.

### 3.3 Spacing, radius, elevation

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px (`--s-1` … `--s-9`).
- Radius: `--r-s: 6px` (buttons, inputs, tags), `--r-m: 12px` (cards, Rate Board). Nothing pill-shaped, nothing square-cornered.
- Elevation: none. Flat surfaces separated by background colour and 1px `--line` borders. No box-shadows anywhere (signage doesn't cast shadows on itself). Depth comes from the `--panel` navy surfaces.

### 3.4 Layout system

- Max content width 1120px, centred, 24px gutters (16px < 480px).
- **Article template:** single 70ch column; right rail (280px) appears ≥ 1024px containing sticky table of contents + mini Rate Board. Below 1024px the rail content moves inline (Rate Board after intro, TOC collapses to a `<details>`).
- **Homepage:** full-width hero band on `--paper`, then 12-col grid for pathway cards (3-up desktop, 1-up mobile).
- Tables of figures may break out of the 70ch measure to the full 1120px container when needed.

Homepage wireframe:

```
┌──────────────────────────────────────────────────────┐
│ [R] AUSSIES R US        Battery rebate ▾  Costs ▾  About │  ← header, paper bg, 1px line
├──────────────────────────────────────────────────────┤
│  Australia's independent          ┌────────────────┐ │
│  solar & battery guide            │  RATE BOARD    │ │  ← hero: H1 + one-para
│                                   │  (panel navy)  │ │    thesis left, live
│  Every figure verified against    │  $ / kWh  STC  │ │    Rate Board right
│  the regulator. We tell you       │  next drop in  │ │
│  when the rebate drops.           │  ▓▓ 172 days   │ │
│  [Calculate my rebate]            └────────────────┘ │
├──────────────────────────────────────────────────────┤
│  ┌ How much rebate ┐ ┌ Is a battery ┐ ┌ Your state ┐ │  ← 3 pathway cards
│  │ will I get?     │ │ worth it?    │ │ rebates    │ │
├──────────────────────────────────────────────────────┤
│  Recently verified ──────────────────────────────    │  ← changelog feed (5 items)
├──────────────────────────────────────────────────────┤
│  footer (panel navy): disclosure, ABN, sitemap        │
└──────────────────────────────────────────────────────┘
```

### 3.5 Signature element: the Rate Board

A servo-price-board-styled component showing the current federal rebate at a glance. It is the hero visual, appears as a mini variant in article right rails, and is the OG-image motif. Everything else on the site defers to it.

Spec:
- Surface `--panel`, radius `--r-m`, padding `--s-6`. Small all-caps Archivo label top-left: `FEDERAL BATTERY REBATE — CURRENT RATES`.
- Three stacked figures in Plex Mono 500 at `--t-board`, values in `--sun`, units/labels in `--paper` at `--t-meta`:
  1. `$ per usable kWh` (computed: STC factor × STC price, tier 1)
  2. `STC factor` (current tier-1 value)
  3. `Next step-down` — date + a countdown ("in N days") computed at **build time** (site rebuilds on every data/content change and at least weekly via scheduled deploy, §9.2; no client JS for this)
- Bottom row: the verified stamp (§6.4) in its dark variant + link "See what changed →" to the changelog.
- All values read from `rebates.json`. Zero hardcoded figures.
- Subtle entrance: figures fade-slide up 200ms staggered on first paint, disabled under `prefers-reduced-motion`. This is the only animated element on the site.

### 3.6 Component states & accessibility

- WCAG 2.2 AA. Focus visible: 2px `--eucalypt` outline, 2px offset, on every interactive element.
- Hit targets ≥ 44px. Forms: labels always visible (no placeholder-as-label), errors in `--alert` text + icon, `aria-describedby` wired.
- `prefers-reduced-motion: reduce` kills all transitions/animations.
- Skip-to-content link. Semantic landmarks (`header/nav/main/footer`). Tables use `<th scope>`. Calculator outputs announced via `aria-live="polite"`.

---

## 4. Information architecture & URL map

Trailing-slash URLs. All pages static. Nav structure: **Battery rebate ▾** (hub, calculator, what changed, state pages) · **Costs & payback ▾** (cost pages, worth-it guide) · **Compare ▾** (conquest pages) · **About**.

| # | URL | Template | Purpose / primary query target |
|---|---|---|---|
| 1 | `/` | Home | Brand + routing. "aussies r us" navigational |
| 2 | `/battery-rebate/` | Article+Data | **Cluster hub.** "battery rebate", "cheaper home batteries program", "federal battery rebate 2026" |
| 3 | `/battery-rebate/calculator/` | Calculator | "battery rebate calculator" |
| 4 | `/battery-rebate/what-changed-may-2026/` | Article+Data | "battery rebate changes may 2026", "battery rebate after may 2026" |
| 5 | `/battery-rebate/wa/` | State | "wa battery rebate", "battery rebate stacking wa" |
| 6 | `/battery-rebate/nsw/` | State | "nsw battery rebate" |
| 7 | `/battery-rebate/vic/` | State | "vic battery rebate", "solar victoria battery" |
| 8 | `/battery-rebate/qld/` | State | "qld battery rebate" |
| 9 | `/battery-rebate/sa/` | State | "sa battery rebate", "reps vpp incentive" |
| 10 | `/solar-rebate/` | Article+Data | Panels STC rebate: "solar rebate 2026", "stc rebate" |
| 11 | `/feed-in-tariffs/` | Article+Data | "feed in tariff [state] 2026" — table-led page |
| 12 | `/costs/10kwh-battery-cost/` | Article+Data | "10kw battery cost", "10kwh battery price after rebate" |
| 13 | `/costs/13-5kwh-battery-cost/` | Article+Data | "powerwall 3 cost after rebate" (generic framing, brand mentioned inside) |
| 14 | `/costs/6-6kw-solar-system-cost/` | Article+Data | "6.6kw solar system cost" |
| 15 | `/costs/solar-battery-package-perth/` | Article+Data | "solar and battery package perth" — local authority page |
| 16 | `/guides/is-a-battery-worth-it/` | Article | "is a solar battery worth it 2026" |
| 17 | `/compare/who-owns-solarquotes/` | Article | "who owns solarquotes", "is solarquotes independent" |
| 18 | `/compare/solarquotes-alternatives/` | Article | "solarquotes alternatives" |
| 19 | `/about/` | Article | Independence statement, methodology, how we make money |
| 20 | `/what-changed/` | Changelog | Dated feed of every data update (freshness engine) |
| 21 | `/quotes/` | Form | Phase 2 lead form. Built, functional, `noindex`, excluded from nav & sitemap |
| 22 | `/contact/` | Article | Contact form (same function, `type: contact`) |
| 23 | `/privacy/`, `/terms/`, `/editorial-policy/` | Article | Legal (§10) |
| 24 | `/404` | — | Branded 404 with pathway cards |

**Internal linking rules:** every article links to the calculator in the first 25% of body copy; every battery page links to the hub; hub links to all state pages and calculator; cost pages cross-link to worth-it guide; every data page footer links to `/what-changed/`. Breadcrumbs on everything except home.

---

## 5. Data architecture

Single source of truth for every figure on the site. **No monetary value, STC factor, date, or tariff may be typed into a template or content file.** Zod-validated at build; build fails on schema violation or a `lastVerified` older than 120 days (tunable const).

### 5.1 `src/data/rebates.json` — federal program

```jsonc
{
  "meta": {
    "program": "Cheaper Home Batteries Program",
    "administrator": "Clean Energy Regulator",
    "sourceUrl": "https://www.dcceew.gov.au/energy/programs/cheaper-home-batteries",
    "lastVerified": "2026-07-12",          // ⚠ VERIFY at launch — drives stamps + dateModified
    "programEnd": 2030
  },
  "stcPrice": {
    "headline": 40,                         // CER clearing house benchmark, ex GST
    "netAssumed": 37,                       // after typical admin costs — calculator default ⚠ VERIFY
    "note": "Households typically receive slightly less than headline after admin costs."
  },
  "current": {
    "effectiveFrom": "2026-05-01",
    "stcFactor": 6.8,                       // ⚠ VERIFY against CER
    "tiers": [
      { "fromKwh": 0,  "toKwh": 14, "factorPct": 100 },
      { "fromKwh": 14, "toKwh": 28, "factorPct": 60 },
      { "fromKwh": 28, "toKwh": 50, "factorPct": 15 }
    ],
    "usableCapCapKwh": 50,
    "eligibleNominalRangeKwh": [5, 100]
  },
  "schedule": [
    { "effectiveFrom": "2027-01-01", "stcFactor": null, "status": "announced" },
    { "effectiveFrom": "2027-07-01", "stcFactor": null, "status": "announced" }
    // step-downs every Jan & Jul until 2030; factors filled in as CER publishes ⚠ VERIFY
  ],
  "history": [
    { "effectiveFrom": "2025-07-01", "stcFactor": 9.3, "flat": true },   // ⚠ VERIFY
    { "effectiveFrom": "2026-01-01", "stcFactor": 8.4, "flat": true },
    { "effectiveFrom": "2026-05-01", "stcFactor": 6.8, "flat": false }
  ]
}
```

`nextStepDown` is computed at build time = first `schedule` entry after today. Rate Board countdown derives from it.

### 5.2 `src/data/states.json` — state schemes (one entry per state)

Fields per state: `name`, `code`, `schemes[]` (each: `name`, `type: rebate|loan|vpp`, `value` as structured amount or per-kWh rate, `cap`, `eligibility` bullets, `stacksWithFederal: bool`, `sourceUrl`, `lastVerified`, `status: open|paused|closed`). Seed WA, NSW, VIC, QLD, SA with current schemes; **every value ⚠ VERIFY against the state source URL at launch** (state schemes change without a legislated schedule — WA in particular has Synergy vs Horizon rates).

### 5.3 `src/data/fits.json` — feed-in tariffs

Per state: representative FiT range (min/max c/kWh), reference retailers, `lastVerified`, source URLs. Table-rendered on `/feed-in-tariffs/`.

### 5.4 `src/data/systems.json` — reference systems for worked examples

The three canonical systems (§2.4): `{ id, label, usableKwh, typicalInstalledCost }` — 10 kWh, 13.5 kWh, 30 kWh. Typical costs ⚠ VERIFY quarterly.

### 5.5 `src/data/changelog.json`

Append-only: `{ date, summary, affectedPages[] }`. Renders `/what-changed/` and homepage feed. **Process rule for owner:** any edit to §5.1–5.4 requires a changelog entry in the same commit; CI check greps that a same-day entry exists when data files change.

---

## 6. Components

All Astro components, zero client JS except where marked.

1. **`Header.astro`** — wordmark SVG, nav with dropdowns (CSS-only `:focus-within`/hover, fully keyboard operable), current-section underline in `--sun`.
2. **`RateBoard.astro`** — §3.5. Props: `variant: 'hero' | 'mini'`.
3. **`TierBar.astro`** — horizontal capacity bar 0→50 kWh with the three tier bands coloured `--sun` at 100/60/15% opacity steps, tick labels at 14/28/50. Optional `markerKwh` prop drops an ink marker at the user's/example's capacity. Used on hub, what-changed, calculator.
4. **`VerifiedStamp.astro`** — small tag: sun-yellow rounded rect, ink text `VERIFIED 12 JUL 2026` (Plex Mono caps) linking to `/what-changed/`. Dark variant for panel surfaces. Date from the relevant data file's `lastVerified` — **passed in, never typed**.
5. **`DataTable.astro`** — full-bleed-capable table: `--panel` header row with `--paper` Archivo labels, zebra `--paper-dim`, figures right-aligned in Plex Mono. Mobile: horizontal scroll with sticky first column.
6. **`Callout.astro`** — `type: note|warning`. Note: `--sun-tint` bg, ink text. Warning (step-down deadlines): 1px `--alert` border, alert heading.
7. **`FaqBlock.astro`** — `<details>`-based accordions; emits FAQPage JSON-LD from the same props (content and schema can't drift).
8. **`Fig.astro`** — inline wrapper applying Plex Mono + tabular-nums to a figure, optional `delta: up|down` colouring (`--eucalypt`/`--alert`). Used for every inline number in article prose.
9. **`CtaButton.astro`** — `--sun` bg, ink text, Public Sans 600; hover darkens 8%; secondary variant: ink outline.
10. **`PathwayCard.astro`** — homepage cards: H3, one-line description, arrow; 1px line border, hover border-colour `--eucalypt`.
11. **`Breadcrumbs.astro`** — with BreadcrumbList JSON-LD.
12. **`QuoteForm.astro`** — Phase 2 form (fields §10.3), Turnstile widget, honeypot field, consent checkbox (unticked default), POSTs to `/api/lead`. *Client JS: Turnstile only.*
13. **`Footer.astro`** — `--panel`: disclosure paragraph (§10.1), ABN, nav links, "Figures verified against the Clean Energy Regulator — last update {date}".

---

## 7. Calculator — functional spec

`/battery-rebate/calculator/` — the site's core interactive asset. One vanilla-TS Astro island (`client:load` on this page only), ≤ 15 KB gzipped, no framework, no dependencies. All constants imported from `rebates.json` / `states.json` at build and inlined.

### 7.1 Inputs

1. **Usable battery capacity (kWh)** — number input + slider, 5–100, step 0.5, default 13.5. Preset chips for the three reference systems.
2. **State** — select (affects stacking section only).
3. **Installed cost before rebates ($)** — optional; enables net-cost output. Prefilled from `systems.json` when a preset chip is chosen.
4. Advanced (collapsed): **STC price** — default `stcPrice.netAssumed`, editable 30–45, with the headline-vs-net note.

### 7.2 Federal rebate logic

```
eligible = clamp(usableKwh, 0, usableCapCapKwh)          // 50
stcs = 0
for tier in tiers:
  span = clamp(eligible, tier.fromKwh, tier.toKwh) - tier.fromKwh   // width of input inside tier
  stcs += span * stcFactor * (tier.factorPct / 100)
stcCount = floor(stcs)                                    // whole certificates only
federalRebate = stcCount * stcPrice
```

**Worked examples (must appear as unit tests AND on-page examples; values with July 2026 data, ⚠ recompute if data file changes):**

| System | Calculation | STCs | Rebate @ $37 |
|---|---|---|---|
| 10 kWh | 10 × 6.8 × 100% = 68.0 | 68 | **$2,516** |
| 13.5 kWh | 13.5 × 6.8 × 100% = 91.8 | 91 | **$3,367** |
| 30 kWh | (14 × 6.8) + (14 × 6.8 × 0.6) + (2 × 6.8 × 0.15) = 95.2 + 57.12 + 2.04 = 154.36 | 154 | **$5,698** |

Edge cases: input < 5 kWh nominal → "below program minimum" notice; > 50 usable → note that only the first 50 kWh attracts the discount; non-numeric/empty → outputs blank, no NaN ever rendered.

### 7.3 Outputs

Rendered as a personal Rate Board (same visual language): **Federal rebate $X** (primary figure), STC count, effective % of cost (when cost provided), **net cost $Y**, TierBar with marker at the input capacity. State section below: applicable stacking schemes from `states.json` as rows with `stacksWithFederal` badge and source links — *displayed, not summed*, since eligibility varies; copy states this.

Below outputs, static assumptions block: install-date determines the rate; next step-down date; figures are estimates, installer's invoice governs; not financial advice.

### 7.4 Behaviour

Recompute on input (debounced 150 ms), `aria-live="polite"` on the primary figure, URL hash state (`#kwh=13.5&state=wa`) so results are shareable, "Copy link to this result" button. No localStorage. Works with JS disabled to the extent of showing the three worked examples (server-rendered) with a notice that the interactive tool needs JavaScript.


---

## 8. Content briefs (per page)

General rules: intro answers the query in the first 80 words with current figures via `<Fig>`; H2s phrased as questions where natural (they win PAA boxes); every data page ends with sources list (linked primary sources) + FaqBlock; AU spelling; reading level ~ year 9. Word counts are targets ±20%. Draft copy is produced by the owner with an AI pipeline against these briefs — the dev builds templates with real seed copy for pages 1, 2, 3, 17, 19 minimum and lorem-free placeholders keyed to these briefs elsewhere (a page ships only when its copy is in).

**1. Home** — 250 words of copy total. H1: "Australia's independent solar & battery guide". Hero paragraph = independence + verification promise. Pathway cards to calculator, worth-it guide, state hub anchors. Changelog feed (5 latest).

**2. `/battery-rebate/` hub — 2,200 words.** H1 "Federal battery rebate: current rates and how it works". Sections: current value per kWh (Rate Board embedded) → how the discount is applied (installer applies at point of sale; REC Registry self-claim option) → tier structure since 1 May 2026 (TierBar + DataTable of tiers) → step-down schedule table (from `schedule`, "announced" rows greyed) → eligibility checklist (CEC-approved list, VPP-capable if grid-connected, one system per property, accredited installer) → the three worked examples → state stacking teaser linking all 5 state pages → FAQ (8 Qs: install-date determines rate; can I claim twice; does it cover the inverter; etc.). Schema: Article + FAQPage.

**3. Calculator — 600 words** around the tool: how the maths works (the exact formula, shown honestly), assumptions, the worked examples as static content. Schema: WebApplication + Article.

**4. What changed May 2026 — 1,400 words.** The flat-rate→tier change explained; before/after DataTable at 10/13.5/30/48 kWh; why (uptake ~200/day → 1,500+/day, budget $2.3bn → $7.2bn, oversized-battery loophole); what it means at each size; forward schedule. Evergreen slug — page updates at each future step-down with the changelog noting revisions.

**5–9. State pages — 1,200 words each, one shared template.** H1 "{State} battery rebate: what stacks with the federal discount". Federal recap (2 paras + mini Rate Board) → state schemes table from `states.json` → stacking worked example using the 13.5 kWh reference → eligibility → FAQ (5). WA page gets +400 words of genuine local depth: Synergy vs Horizon values, DEBS feed-in context, Perth install-cost note — this is the authority wedge; write it first and best.

**10. Solar (panels) rebate — 1,400 words.** STCs for panels, zone ratings, deeming-period decline to 2030, worked example 6.6 kW in zone 3, relationship to the battery program (separate but combinable).

**11. Feed-in tariffs — 1,000 words** + the state DataTable from `fits.json`. Angle: FiTs are falling, which is the battery case — links to worth-it guide.

**12–14. Cost pages — 1,100 words each.** Structure: typical installed price range → rebate at that size (from calculator logic, static) → net cost → price-per-kWh comparison DataTable → what drives quotes up/down → FAQ. No installer recommendations in v1.

**15. Perth package page — 1,300 words.** Local: WA stacking applied to a real package example, SWIS/Synergy specifics, DEBS. Links to WA state page + calculator.

**16. Worth-it guide — 2,000 words.** Honest payback framing: the variables that matter (usage timing, tariff, FiT, VPP income), simple payback maths shown for the three reference systems with stated assumptions, when a battery is NOT worth it (low evening usage, tight budget vs panels-first). This page earns trust precisely by being willing to say "not yet" — that's the independence positioning doing work. Schema: Article + FAQPage.

**17. Who owns SolarQuotes — 900 words.** Factual corporate-ownership rundown (Origin acquisition Dec 2024; Solar Choice → Flow Power 2025; CHOICE's commercial partnership with SolarQuotes), what ownership means and doesn't mean for consumers, our independence statement. Tone: scrupulously factual, zero sneering — every claim sourced and dated. Legal note §10.4.

**18. SolarQuotes alternatives — 1,100 words.** Fair comparison table of quote services incl. SolarQuotes itself (rated fairly), government resources, going direct. We appear only as "us — an information site, not (yet) a quote service" — honesty converts here.

**19. About — 700 words.** Who runs it (Michel, WA-based), why it exists, verification methodology (primary sources, dated stamps, public changelog), **how we make money** (ads/affiliate now; may introduce a quote service later — will be disclosed), what we'll never do (sell placement in editorial rankings).

**20. Changelog** — auto-rendered from `changelog.json`, one dated entry per data update with affected-page links.

**21. Quote form page** — H1 "Get battery quotes", 150 words, form per §6.12. `noindex,nofollow`, not in sitemap/nav.

**22–23. Contact + legal** — §10 dictates legal content requirements.

---

## 9. Technical implementation

### 9.1 Stack & repo

- **Astro ^5.x**, `output: 'static'`, TypeScript strict. Content Collections (glob loader) for articles with zod frontmatter: `title, description, template, cluster, dataDeps[], faq[], updated`.
- Styling: vanilla CSS — `global.css` (tokens, reset, base type) + scoped styles per component. **No Tailwind, no CSS framework** (tokens map 1:1 to this spec; nothing to fight).
- Integrations: `@astrojs/sitemap` (exclude `/quotes/`), RSS for `/what-changed/` via `@astrojs/rss`.

```
/
├── astro.config.mjs
├── functions/api/lead.ts          # Cloudflare Pages Function (§9.3)
├── public/ _redirects _headers robots.txt favicon.svg og/
├── src/
│   ├── styles/global.css
│   ├── data/ rebates.json states.json fits.json systems.json changelog.json
│   ├── lib/ rebate.ts (calc logic + tests) schema.ts (zod) build-checks.ts
│   ├── components/ (…§6)
│   ├── layouts/ Base.astro Article.astro
│   ├── islands/calculator.ts
│   └── content/ guides/ …
└── tests/ rebate.test.ts (vitest — the §7.2 worked examples ARE the test cases)
```

### 9.2 Cloudflare

- **Cloudflare Pages**, production branch `main`, build `npm run build` (runs `astro check`, vitest, then `astro build`), output `dist`.
- Custom domain `aussiesrus.com.au` + `www` → apex redirect (301) via Bulk Redirects or `_redirects`.
- **Scheduled weekly rebuild** (Pages deploy hook hit by a Cloudflare Worker cron, Mondays 06:00 AWST) so the Rate Board countdown and "days until step-down" copy never staleness-drift more than a week.
- Env vars (production, encrypted): `GHL_WEBHOOK_URL`, `TURNSTILE_SECRET_KEY`; public: `PUBLIC_TURNSTILE_SITE_KEY`.
- `_headers`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo off), CSP: `default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; frame-src https://challenges.cloudflare.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'`. Long-cache immutable for hashed assets.
- Analytics: **Cloudflare Web Analytics** beacon only. No GA4, no cookies → no cookie banner.

### 9.3 Lead/contact function (`functions/api/lead.ts`)

POST only. Steps: verify Turnstile token server-side → reject if honeypot filled → validate payload (zod: name, email, phone AU-format, postcode, `type: lead|contact`, `consent === true` for leads) → forward JSON to `GHL_WEBHOOK_URL` with 5s timeout → 303 redirect to `/quotes/thanks/` (noindex) or JSON `{ok:true}` for fetch. On webhook failure: queue-less fallback — email payload via MailChannels to owner address and still return success to the user. Rate-limit 5/min/IP (Cloudflare rules). Log nothing beyond CF defaults; no PII in logs.

### 9.4 Fonts & assets

`@fontsource-variable/archivo`, `@fontsource/public-sans` (400,600), `@fontsource/ibm-plex-mono` (400,500) — latin subsets only; preload archivo-variable + public-sans-400 woff2 in Base layout. Images: none decorative in v1; any diagrams are inline SVG using tokens. OG images: static 1200×630 SVG-rendered-to-PNG template per cluster (panel navy, Rate Board motif, page title in Archivo) generated at build with `satori` + `resvg` — if that adds friction, ship one site-wide OG PNG and defer per-page.

### 9.5 SEO wiring

- Canonicals absolute; sitemap auto; robots.txt allows all except `/quotes/`.
- JSON-LD: `Organization` + `WebSite` (Base), `Article` with `dateModified` = max(page frontmatter `updated`, `lastVerified` of its `dataDeps`) — this is the freshness wiring, `BreadcrumbList`, `FAQPage` via FaqBlock, `WebApplication` on calculator.
- Titles ≤ 60 chars from frontmatter; meta descriptions 140–155 with a current figure where possible (they'll date — acceptable, the data-driven rebuild refreshes them if written as template strings from data, which is the required approach for data pages: e.g. `Currently ${perKwh} per usable kWh.`).

### 9.6 Performance budgets (enforced at review)

JS: 0 KB on all pages except calculator (≤ 15 KB gz) and Turnstile on form pages. CSS ≤ 30 KB gz. LCP < 1.8 s (Fast 4G), CLS = 0 (reserve Rate Board dimensions), Lighthouse ≥ 95 across all four categories on Home, hub, calculator.

---

## 10. Compliance & legal (content requirements)

1. **Sitewide footer disclosure:** "Aussies R Us is an independent information site. We may earn a commission from some links, and this is always disclosed. Figures are general information only, not financial advice — rebate values depend on your installation date and eligibility; confirm with the Clean Energy Regulator and your installer." + ABN + operator entity.
2. **Affiliate marking:** affiliate links `rel="sponsored noopener"`, page-level disclosure line above the first affiliate link.
3. **Quote form (Phase 2) consent:** required unticked checkbox: "I agree to be contacted about my quote request by Aussies R Us and up to three installers or quoting partners, by phone, SMS or email." Privacy policy must disclose that lead details are shared with quoting partners (this is the lead-sale disclosure), Spam Act 2003 compliance (consent + identify sender + unsubscribe in any marketing), and data storage in GoHighLevel.
4. **Conquest pages:** statements of fact only (ownership, dates, sourced), no misleading-conduct exposure: never state or imply competitors give bad advice — only that ownership is a fact consumers may weigh.
5. **Editorial policy page:** methodology, primary sources, correction process, AI-assisted drafting disclosure with human verification of all figures.

---

## 11. Link reclaim & redirects (owner input required)

Owner supplies the top ~20 historical link targets from Ahrefs (Best by Links) with Wayback snapshots. Dev implements in `public/_redirects`:
- Historical URL topically matched by a v1 page → `301` to it.
- Valuable link, no matching page → thin recreated stub under `/archive/{slug}/` (indexable, honest "this page has moved on" note linking into the cluster) — owner decides per-URL.
- Everything else → `301 /` is **not** acceptable; unmatched old URLs 404 to the branded 404. (Blanket homepage redirects are treated as soft-404s and waste the equity anyway.)
- `www` → apex, `http` → `https` (Cloudflare-level).

---

## 12. Launch checklist (definition of done)

**Build integrity:** `astro check` clean; vitest green (worked examples §7.2 as assertions); zod build-time validation of all five data files; build fails if any `lastVerified` > 120 days old; changelog-entry-on-data-change CI check active.
**Pages:** all §4 pages render with real copy for #1, 2, 3, 4, 5(WA), 16, 17, 19, 20 and brief-keyed drafts staged for the rest; no lorem anywhere deployed; `/quotes/` functional end-to-end into GHL (test lead visible in CRM) and noindexed.
**Design:** tokens only (grep: no hex values outside `global.css`); mono-figures rule holds on every data page; Rate Board matches §3.5 incl. reduced-motion; focus states visible everywhere; keyboard-only pass of nav, calculator, form.
**SEO:** sitemap + robots correct; JSON-LD validates (Rich Results test) on hub, calculator, a state page, an FAQ page; canonicals absolute; unique titles/descriptions.
**Performance:** §9.6 budgets met, verified in Lighthouse CI or manual runs, screenshots attached.
**Redirects:** §11 map implemented and spot-checked (10 random old URLs).
**Legal:** §10 items live; ABN present; privacy policy covers lead-sharing before `/quotes/` is ever linked publicly.
**Ops handover:** README covering: how to update a data file + changelog (the routine op), how the weekly rebuild cron works, where env vars live, how to flip Phase 2 on (add `/quotes/` to nav + sitemap + remove noindex — one PR).

## 13. Explicitly out of scope for v1

Installer directory/reviews; user accounts; CMS (content is git); dark mode; blog/news cadence; per-page satori OG images if they add friction (§9.4); payback modelling beyond the simple stated-assumptions version; email capture/newsletter; A/B testing; any paid-traffic landing pages.

---

## Appendix A — UI copy strings

- Hero H1: `Australia's independent solar & battery guide`
- Hero sub: `Every figure on this site is verified against the regulator and stamped with the date we checked it. When the rebate drops, we tell you — before it happens.`
- Primary CTA: `Calculate my rebate`
- Rate Board labels: `FEDERAL BATTERY REBATE — CURRENT RATES` / `per usable kWh` / `STC factor` / `next step-down`
- Verified stamp: `VERIFIED {DD MMM YYYY}`
- Step-down warning callout: `Rates are set by your installation date. The next legislated reduction takes effect {date}.`
- Calculator empty state: `Enter your battery's usable capacity to see the current federal discount.`
- Form consent: see §10.3 verbatim.
- 404: `That page doesn't exist — but the rebate still does.` + pathway cards.

## Appendix B — build-order suggestion (one-shot sequencing)

1. Tokens + Base/Article layouts + Header/Footer → 2. data files + zod + `rebate.ts` + tests → 3. RateBoard, TierBar, VerifiedStamp, DataTable, Fig, Callout, FaqBlock → 4. Hub page (#2) end-to-end as the reference implementation → 5. Calculator → 6. Remaining templates/pages → 7. Function + form → 8. SEO wiring, redirects, headers → 9. Checklist pass.
