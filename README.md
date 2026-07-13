# Aussies R Us

Independent Australian solar & battery guide — static Astro site on Cloudflare Pages.

## Stack

- Astro (static) + TypeScript
- Vanilla CSS design tokens (`src/styles/global.css`)
- Zod-validated data files in `src/data/`
- Vitest for rebate calculator worked examples
- Cloudflare Pages Function at `functions/api/lead.ts`

## Local development

```bash
npm install
npm run dev
```

```bash
npm test          # vitest — §7.2 worked examples
npm run check     # astro check
npm run build     # check + test + build → dist/
```

## Updating rebate / state / FiT figures (routine op)

1. Edit the relevant file under `src/data/` (`rebates.json`, `states.json`, `fits.json`, `systems.json`).
2. Add a same-day entry to `src/data/changelog.json` listing `affectedPages`.
3. Run `npm test && npm run build` locally.
4. Commit both the data change and the changelog entry together.
5. Deploy (push to `main`). The Rate Board, stamps, and `dateModified` wiring all read from these files.

Build fails if any `lastVerified` is older than 120 days.

## Environment variables (Cloudflare Pages)

| Name | Scope | Purpose |
|---|---|---|
| `GHL_WEBHOOK_URL` | Secret | GoHighLevel inbound webhook (lead/contact POST target) |
| `TURNSTILE_SECRET_KEY` | Secret | Turnstile server verify |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public | Turnstile widget |
| `OWNER_EMAIL` | Secret | MailChannels fallback recipient when GHL is unset or fails |

Local/CI: if these are unset, `/api/lead` rejects Turnstile verification and falls back to MailChannels when the webhook is missing. Unit tests mock the webhook POST (`tests/lead.test.ts`).

## Data-change changelog guard

`npm run build` runs `tests/changelog-on-data-change.mjs`: if the current commit touches `src/data/*.json` other than `changelog.json`, that commit’s date must appear in `changelog.json` `entries[]`.

## Weekly rebuild cron

`workers/weekly-rebuild.ts` hits a Pages deploy hook every Monday 06:00 AWST so the Rate Board “days until step-down” copy stays fresh. Create a Deploy Hook in Pages → set `DEPLOY_HOOK_URL` on the worker → cron `0 22 * * 1`.

## Phase 2 flip (quote form public)

`/quotes/` is built and functional but `noindex`, excluded from nav and sitemap.

To enable Phase 2:

1. Remove `noindex` from `src/pages/quotes/index.astro`
2. Add a nav item in `src/lib/site.ts`
3. Remove the `/quotes/` filter in `astro.config.mjs` sitemap
4. Confirm privacy policy lead-sharing disclosure + Turnstile + GHL webhook are live

## Owner inputs still required before launch (§11)

- Top ~20 Ahrefs backlink URLs → `public/_redirects` / archive stubs
- Final ABN (set `abn` in `src/lib/site.ts`; empty renders as “ABN pending”)
- Sign-off on all `⚠ VERIFY` values in data files
- Production Turnstile + GHL credentials

## Brand reminder

Site name is **Aussies R Us** (never AussiesRUs). Voice: a mate who’s good with numbers and doesn’t sell anything.
