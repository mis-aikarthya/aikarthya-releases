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

> **Build re-spin (03-Jul-2026, ~17:45 IST).** The first 1.1.1+16 APK/Windows
> build (sha256 `8dcc8f68...` / `f6101832...`, built ~16:25) had a cold-boot
> crash: the G10 Brick migration `20260702204008` re-inserted `Observation.next_step`,
> which already exists via the `RenameColumn` in migration `20260616140256`, so
> `ALTER TABLE Observation ADD next_step` threw `duplicate column name: next_step`
> at boot and the app was stuck on the first screen on every Android/Windows
> install (web was unaffected — `main.dart` gates Brick behind `kIsBrickSupported`,
> false on web). Fixed by stripping the spurious `InsertColumn`/`DropColumn`
> `next_step` from the migration (commit `95fa77d`); the failed migration was
> never recorded as applied, so existing stuck installs self-heal on next
> launch. The Drive folder link and `app_versions` rows are unchanged (the
> script trashed the old files and uploaded the new ones into the same folder).

> **Second re-spin (03-Jul-2026, ~19:40 IST).** The first re-spin fixed the
> cold-boot crash but shipped with Brick numeric casts that the gap-fix codegen
> had silently reverted: the generated adapters cast numeric columns with
> `as double` / `as double?`, but Supabase returns whole numbers over JSON as
> Dart `int`, so `int as double` threw `type 'int' is not a subtype of type
> 'double?' in the cast` and the PF Assessment Tab "Submitted" list crashed on
> every submitted observation form on Android + Windows (web was unaffected —
> `main.dart` gates Brick behind `kIsBrickSupported`, false on web, so web
> uses direct Supabase reads, not the Brick adapter). Fixed by re-running the
> sanctioned `tool/brick_fix_numeric_casts.dart` script — 40 cast sites across
> 7 adapters (`registered_point`, `attendance`, `observation`, `location_ping`,
> `school`, `school_leader_profile`, `teacher`), casting through `num` then
> `.toDouble()` (commit `d7e46d8`, merged to `master`). Artifacts below are the
> second re-spin; the first re-spin's hashes were APK
> `9ea86b91...` / zip `27552074...` (kept for history). Drive folder link +
> `app_versions` rows unchanged (idempotent re-upload into the same folder).

| Artifact | Size | SHA-256 |
|----------|------|---------|
| `aikarthya-field-ops-v1.1.1+16.apk` | 100,099,041 B (~95.5 MB) | `352cfb17a762bb53f1763ca97a13357513c60d008ffb481dac5ecf339b631e17` |
| `aikarthya-field-ops-v1.1.1+16-windows.zip` | 28,179,684 B (~26.9 MB) | `541035489308702a9fc2ff2fac9014dd0cf4f5711979391c6e0364b820cb55fa` |

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
  (incl. `stf_dcr` status columns) are present on production, so the additive
  app changes are safe against the live prod DB. The remaining STF migrations
  (`questions.options` / `answer_key`, `stf_sessions` area constraint,
  `stf_dcr` status) and the `app_versions` 1.1.1+16 rows were confirmed applied
  to production on 03-Jul-2026 (`supabase migration list --linked` showed all
  applied; `db push --dry-run` reported "Remote database is up to date"), and
  all 13 edge functions were redeployed to prod the same day. The prod schema
  migration window is 6 PM-9 AM IST (widened from 7 PM on 03-Jul-2026).

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