# Release Notes — Aikarthya Field Ops v1.1.0+15

| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Build | 15 |
| Platforms | Android (APK), Windows desktop (zip) |
| Backend | production (`nuwqxlhuxwgevxvsyusj`) |
| Date | 2026-07-01 |
| Previous Android release | v1.0.9+13 (commit `bc76e4d`) |
| Commits since previous | 80 |
| Supabase `app_versions` rows | android 1.1.0+15, windows 1.1.0+15 |

> The web/PWA build was released separately at **v1.1.0+14** on Cloudflare
> Pages (staging + prod) and is excluded from this package.

## Artifacts

| Artifact | Size | SHA-256 |
|----------|------|---------|
| `aikarthya-field-ops-v1.1.0+15.apk` | 98,918,605 B (~98.9 MB) | `b2f80cb50a289891fe9c543e2ceb2f9eb5f349dcdc7d2b02dfb617215bbfc40a` |
| `aikarthya-field-ops-v1.1.0+15-windows.zip` | 27,900,075 B (~27.9 MB) | `10fde65ab57f688cb0d01fb7b8362f5a7bbb7df5a944a8a7a1da7756d2881a9b` |

> **APK rebuild (2026-07-01):** the original v1.1.0+15 APK crashed instantly
> on launch on real devices — R8 (on by default for Flutter release builds)
> stripped `androidx.work.impl.WorkDatabase_Impl`'s no-arg constructor, which
> `androidx.startup` reflectively instantiates at process start, so the app
> died with `NoSuchMethodException` before Flutter ran. Fixed by adding
> `android/app/proguard-rules.txt` (keep the WorkManager runtime impl package)
> and enabling `isMinifyEnabled = true` + `proguardFiles(...)` in
> `android/app/build.gradle.kts`. The APK was rebuilt under the same
> version/build (1.1.0+15); the old crashing APK was removed from Drive and
> replaced with the fixed build below. Windows zip unchanged. The
> `app_versions` row is unchanged (same version/build, same Drive folder link).

## What changed

See `CHANGELOG.md` for the full grouped list. Highlights:

- **M&E Management Console** (AIK-7..42): SkillUp Overview + Dashboard, PF
  performance table + profiles, school data + profiles, team roster + admin
  edit + school assignments, Work Days Rewind (timeline + trail map + full-year
  heatmap), PF current-location table, dashboard charts rebuilt on Syncfusion.
- **Background location**: foreground service + WorkManager, env-driven ping
  cadence (2 min staging/debug, 30 min production), check-in event written as a
  `location_pings` row, resume pings after restart.
- **Reporting SLA report**: one-page PDF renderer + Supabase fetch + Download
  button on PF profile.
- **In-app updater rework**: open Drive download page instead of in-app install;
  dead native installer code removed.
- **Branding**: new app logo across Android, web, Windows.
- **Fixes**: null `school_id` crash, Reports Queue PF-review pipeline, mobile
  table hardening, check-in GPS-fail resilience.

## Known issues

- The `v_teacher_report_status` view row-multiplies on `report_shares` (one row
  per share per observation). App-side Set-based dedup corrects the Teacher
  Reach counts; the view itself is a latent bug for future counting consumers
  and is tracked as a separate migration follow-up (out of scope here).
- The web/PWA does not use the in-app updater (served live); the web
  `app_versions` row at 1.1.0+14 is bookkeeping only.
- Background location + offline stay are Android-only; the web PWA runs PF
  online/foreground (GPS check-in, photo capture).

## Min SDK

- Android: `min_sdk_version = 21`
- Windows: `min_sdk_version = NULL` (n/a)

## Distribution

Both artifacts are uploaded to the Aikarthya Google Drive Shared Drive
(`APK_Release_Folder/Version1.1.0+15/`). The Drive folder URL is recorded as
`download_url` in the `app_versions` rows for android and windows.