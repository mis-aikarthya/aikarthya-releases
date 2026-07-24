# Release Notes — Aikarthya Field Ops v1.2.0+18

| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Build | 18 |
| Platforms | Android (APK), Windows desktop (zip), Web/PWA (Cloudflare Pages) |
| Backend | production (`nuwqxlhuxwgevxvsyusj`) |
| Date | 2026-07-24 |
| Previous release | v1.1.1+16 (STF app layer; 2026-07-03) |
| Commits since previous | 286 |
| Android application id | `in.org.aikarthya.app` (was `org.aikarthya.fieldops` in v1.1.1+16 — **installs as a new app**) |
| Supabase `app_versions` rows | android 1.2.0+18, windows 1.2.0+18 (force_update = false) |
| Web `app_versions` row | web 1.2.0+18 (bookkeeping only; web is served live) |

> **Installs as a NEW app.** The Android package changed from
> `org.aikarthya.fieldops` to `in.org.aikarthya.app`, so this is a fresh install
> alongside the old app, not an upgrade. The old app's update dialog links to the
> Drive folder below; users install the new app and can remove the old one. The
> new package matches the production Firebase app, so FCM push works.

> **Web/PWA** is deployed to `app-aikarthya.pages.dev` (Cloudflare Pages
> Production, branch `main`). `force_update = false`: the in-app updater offers
> the Drive download page and is dismissible.

## Artifacts

| Artifact | Size | SHA-256 |
|----------|------|---------|
| `aikarthya-field-ops-v1.2.0+18.apk` | 105,784,128 B (~100.9 MB) | `ff0d7991282601755e6b9d7d6429fcb2234a75239046ef586459d163350911a3` |
| `aikarthya-field-ops-v1.2.0+18-windows.zip` | 30,345,922 B (~28.9 MB) | `330630499aab2e53b7f81c8205cf5069d90bc94e7b872dd24439c35ac7872454` |
| `aikarthya-field-ops-v1.2.0+18-web.zip` | 23,048,433 B (~22.0 MB) | `f2e28314a2845fd69ed3e9836c60382c85bcf517cdd19190a016151c79189a4d` |

## What changed

See `CHANGELOG.md` for the full grouped list (170 features, 55 fixes, 15
refactors). Highlights:

- **Installs as a new app** — Android id `org.aikarthya.fieldops` →
  `in.org.aikarthya.app`; matches the production Firebase registration.
- **Offline-sync overhaul** — STF fellow reads survive offline; reachability
  probe + offline profile fallback repaired; web write queue gains `upsert`/`rpc`
  ops draining cross-platform; `student_attendance` offline queue-and-replay with
  snapshot-fallback reads + queued-mark overlay; all STF form persistence + mgmt
  STF writes routed through the three-way sync branch (Brick / web-queue /
  direct-Supabase); 10 new `stf_*` Brick models.
- **Mgmt console overhaul** — STF nav restructure + overview, schools table, team
  roster role tabs, STF assignments/feedback urban-rural + nature/month/session
  categorization, reporting SkillUp/STF programme tabs + filters, graceful
  per-chart degrade; `me_associate` STF-access regression fixed.
- **Notification delivery (live on prod)** — production FCM enabled in app
  (`firebase_options_production.dart` + transport selector), production Web Push
  VAPID public key in `.env.production`, PF-ops notification routing with
  home-vs-resume allowlist split. Backend chain (6 producer migrations + all 20
  edge functions + Vault + secrets) promoted to prod 2026-07-24.
- **PF fixes** — check-in eager-prefetch kills first-tap "still loading" failure;
  submitted SkillUp session view loads attendance; full resync no longer cancels
  an in-flight check-in.

## Known issues / notes

- Signed with the debug keystore (existing `build.gradle.kts` TODO), consistent
  with the v1.2.0+17 build of the same `in.org.aikarthya.app` package on this
  machine — future updates must keep the same signing key.
- Push delivery to a device requires this build to run and register an endpoint
  (Android FCM permission via the in-app Enable action; web via the notification
  sheet's Enable). In-app notifications (the bell) work regardless.
- STF surfaces ship but STF fellow provisioning is an operator step.
