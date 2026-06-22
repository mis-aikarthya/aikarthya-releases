# Aikarthya Field Ops v1.0.9 — Release Summary

**Release Date:** 22-Jun-2026
**Version:** 1.0.9
**Build Number:** 13
**Target Environment:** production (`APP_ENV=production`)
**Production Supabase Project:** `nuwqxlhuxwgevxvsyusj`

## APK

- **Filename:** `Aikarthya-field-ops_V1.0.9.apk`
- **Hosting repo:** `mis-aikarthya/aikarthya-releases` (public — the app's in-app
  updater downloads anonymously, so the APK must be on the public repo)
- **GitHub tag:** `v1.0.9`
- **APK Size:** 89.0 MB (93,355,079 bytes)
- **SHA256:** `55058810573bd890b90d202f9136c72ea19afd6e23fef16ec0aa6142f58c6133`
- **Download URL:** https://github.com/mis-aikarthya/aikarthya-releases/releases/download/v1.0.9/Aikarthya-field-ops_V1.0.9.apk

## Windows

- **Filename:** `Aikarthya-field-ops_V1.0.9_Windows_x64.zip`
- **GitHub tag:** `v1.0.9` (same release as the APK)
- **Zip Size:** 25.56 MB (26,798,510 bytes)
- **SHA256:** `03b1ce55fc8a3ee42be3bf53a5b3d9dd893fc3fcde1b0eb1b47bed2adff25ae4`
- Built with `flutter build windows --release --dart-define=APP_ENV=production`
  and zipped from `build/windows/x64/runner/Release/`.
- **Download URL:** https://github.com/mis-aikarthya/aikarthya-releases/releases/download/v1.0.9/Aikarthya-field-ops_V1.0.9_Windows_x64.zip

## What Changed

Bug-fix release. No new feature surfaces. Six issues addressed:

1. **Reporting dashboard** — sortable column headers and per-section pagination
   on all four sections (Queue, PF Review, Final, Reverted/Failed); the Final
   section no longer shows a count badge.
2. **Report PDFs not displaying** — the in-app viewer (Completed Reports +
   PF/teacher screens) now validates the downloaded bytes and surfaces a clear
   error with Retry instead of a blank page / infinite spinner.
3. **PDF "Detailed Suggestions" bullets** — now render on the same line as their
   text.
4. **Descriptive PDF file names** —
   `{Programme}_Tr.{Teacher}_Cycle{n}_Obs{n}_{date}.pdf` on the Drive copy and
   the in-app/web download.
5. **SkillUp session form online save** — `me_associate` and `mgmt` can now save
   session details (fixed RLS 42501 on `sessions`).
6. **Notifications** — fixed a ListTile/Material rendering glitch.

## Database Changes

- `20260622000000_sessions_me_mgmt_write_policies.sql` — INSERT/UPDATE RLS on
  `sessions` for `me_associate` and `mgmt`. Applied + verified on staging and
  production on 22-Jun-2026 (all 6 sessions policies confirmed present on both).
- `20260622010000_app_version_v1.0.9_build13.sql` — `app_versions` row for
  build 13. Applied on staging and production on 22-Jun-2026.

## Edge Functions

- `finalize-report` (same-line bullets + descriptive names) and `_shared/cors.ts`
  (`Access-Control-Expose-Headers: Content-Disposition`, propagated to all
  functions) changed this release. **All 8 edge functions redeployed** to
  staging and production on 22-Jun-2026 (per the "redeploy all functions after
  backend changes" rule). Preflight on both environments returns the expose
  header.

## Verification

- `flutter build apk --release --dart-define=APP_ENV=production`: ✅ (89.0 MB)
- `flutter build windows --release --dart-define=APP_ENV=production`: ✅
- `flutter analyze`: ✅ 0 errors, 0 warnings (info-level lints only, pre-existing
  across the codebase; the two new long-line lints introduced in
  `queue_groups.dart` were fixed).
- Live backend checks: `sessions` policies present on staging + prod; all 8
  functions deployed to both; CORS expose-header returned on preflight on both.
- Not run in this session: on-device UI smoke test and the full `flutter test`
  suite (suite run was interrupted). Recommend a quick smoke-test of the built
  APK before wide rollout.

## Rollout Notes

- A daily production data backup was taken before any prod change
  (`Backup/2026-06-22_035256/`, full `public` schema + data via `pg_dump`).
- Production `app_versions` row for build 13 points at the GitHub release APK URL.
- Users on build 10 (v1.0.7+10) will receive the in-app update prompt (13 > 10).
  `force_update = false` (non-mandatory).
