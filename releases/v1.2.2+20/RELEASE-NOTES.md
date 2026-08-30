# RELEASE-NOTES — v1.2.2+20

- **Version:** 1.2.2+20 (build 20)
- **Backend:** production (`nuwqxlhuxwgevxvsyusj`)
- **Date:** 2026-08-31
- **Previous release:** v1.2.1+19 (2026-08-10)

## What's in this release

See `CHANGELOG.md` for the structured list. Headlines: **Aikarthya Agent**
(web; console roles get the bubble/panel/Agent Space, PF gets `/agent/chat`),
**Leave management** (categories/quotas/half-day + mgmt admin + office
holidays), **STF Quick Actions + fellow leave/attendance pages**, the
**Cycle End reporting pipeline** (template builder, rich text, preview,
AI generation), **Reporting AI settings**, and School Closures date ranges.

## BACKEND REQUIRED BEFORE PUBLISH (migrations 7PM–9AM IST + PROMOTE)

This app version reads new backend objects. Deploy in this order, or
features break for updated users:

1. **22 migrations** (everything after `20260827130000`): cycle-end pipeline
   (`20260815*`, `20260820*`–`20260824*`), leaves (`2026082712*`),
   meet-addon reconcile (`2026082714*`), closures (`2026082810*`),
   Aikarthya Agent (`2026082811*` ×4, `2026083110*`).
2. **Prod backfills** (these were done on staging only): cycle-end reporting
   groups + ready C1 report jobs.
3. **All Edge Functions** to prod (`scripts/deploy-functions-prod.sh`, type
   PROMOTE) — AFTER the migrations.
4. **Vault/secrets:** reporting-AI provider credential for the agent's
   model route (staging has one; prod vault is empty until seeded — add via
   the provider upsert RPC or seed `OPENAI_*` env fallbacks).
5. **Agent guest page** is live at `https://aikarthya-agent.pages.dev` and
   baked into all three artifacts via `AIK_AGENT_URL` (agent UI is web-only;
   the Android app runs it inside webviews only for console web usage).

## Known issues

- The agent is web-only (`kIsWeb` gate); Android users unaffected functionally.
- Live mobile users who do NOT update: no breakage — all pending migrations
  are additive; old clients keep v1.2.1+19 behavior.
- Cycle End queue appears empty until the prod backfill in step 2 runs.

## Artifacts

| Artifact | SHA-256 |
|---|---|
| `aikarthya-field-ops-v1.2.2+20.apk` | `7f9c203d2fe642deb901e1d5f5b01ed221a2e24fb2d9b7f28fa7b925c936a708` |
| `aikarthya-field-ops-v1.2.2+20-windows.zip` | `bc1eedf4fbcf9c14f78d1696b6e06b709a4b4a0dd401100b0ed5a96225984225` |
| `aikarthya-field-ops-v1.2.2+20-web.zip` | `dc009be544b731785cd6056268b4cff3cc6e6fd0f838d281bb77807eaabf2076` |

Agent guest URL embedded in all three: `https://aikarthya-agent.pages.dev`