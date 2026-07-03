# Release Notes — Aikarthya Field Ops v1.1.1+16

| Field | Value |
|-------|-------|
| Version | 1.1.1 |
| Build | 16 |
| Platforms | Android (APK), Windows desktop (zip), Web/PWA (Cloudflare Pages) |
| Backend | production (`nuwqxlhuxwgevxvsyusj`) |
| Date | 2026-07-03 |
| Previous release | v1.1.0+15 (M&E console; commit `d1db813`) |
| Commits since previous | 22 |
| Supabase `app_versions` rows | android 1.1.1+16, windows 1.1.1+16 (force_update = false) |
| Web `app_versions` row | web 1.1.1+16 (bookkeeping only; web is served live) |

> This release ships the Super Teacher Fellowship (STF) app layer (P0 -> Phase 8)
> plus the G01-G17 + G05/G06 gap-fix. The web/PWA is deployed to
> `app-aikarthya.pages.dev` (Cloudflare Pages Production, branch `main`).
> `force_update = false`: PFs are not forced to update; the in-app updater offers
> the Drive download page and is dismissible.

## Artifacts

| Artifact | Size | SHA-256 |
|----------|------|---------|
| `aikarthya-field-ops-v1.1.1+16.apk` | 100,099,041 B (~95.5 MB) | `8dcc8f683fcff442b0b0d1d349cb970821023d4677f6bc77b0d26617832dd89a` |
| `aikarthya-field-ops-v1.1.1+16-windows.zip` | 28,179,912 B (~26.9 MB) | `f6101832cc0bfd3767c7b1f2b7427c32e9adcbbc4d9acafd0953722f5ce3c47a` |

## What changed

See `CHANGELOG.md` for the full grouped list. Highlights:

- **STF app layer (P0-Phase 8):** roles + route shell, fellow web check-in/out,
  STF session / observation forms (cloned from PF, rewired to STF persistence),
  facilitator home dashboard with real-month metrics + resync, OCR submission +
  SLA dashboard, fellow feedback form, DCR journal with draft / submitted
  states, classroom assignments, facilitator 3-tab shell.
- **STF gap-fix (G01-G17 + G05/G06):** email templates + sender drain, question
  engine `options` / `answer_key`, DCR partial-save + edit/delete, offline
  `stf_sessions` area support, geofence gate, SLA 8h warning, School Profile
  "follows govt holidays?", me_associate STF nav, session geo + handout, OCR
  observed-teacher selector fix, mgmt `/mgmt/stf/checkins` page.
- **PF / shared fixes:** SkillUp assessment cast, observation submit hang, cycle
  bucketing, report attendance scope, mgmt/pf_home/auth/profile polish.
- **Web:** HTML renderer kept (insufficient-internet stakeholders).

## Backend (production)

- `schools.follows_govt_holidays`, `stf_attendance`, and the `stf_*` tables
  (incl. `stf_dcr` status columns) are already present on production, so the
  additive app changes are safe against the live prod DB during the release
  window. The remaining STF migrations (`questions.options` / `answer_key`,
  `stf_sessions` area constraint, `stf_dcr` status) are STF-only and invisible
  (no STF fellows provisioned yet); they are scheduled for the 7 PM-9 AM IST prod
  migration window.

## Known issues

- STF email sending is non-functional until the operator sets
  `STF_SMTP_USER` / `STF_SMTP_APP_PASSWORD` (G23, out of code scope).
- The `v_teacher_report_status` view row-multiplies on `report_shares`
  (pre-existing; app-side Set dedup corrects Teacher Reach; tracked separately).
- Background location + offline stay are Android-only; the web PWA runs PF
  online/foreground (GPS check-in, photo capture).
- STF fellows are not provisioned yet, so all STF surfaces are present but
  unused in production until STF onboarding begins.

## Min SDK

- Android: `min_sdk_version = 21`
- Windows: `min_sdk_version = NULL` (n/a)