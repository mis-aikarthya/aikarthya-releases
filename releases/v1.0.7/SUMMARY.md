# Aikarthya Field Ops v1.0.7 — Release Summary

**Release Date:** 21-Jun-2026
**Version:** 1.0.7
**Build Number:** 10
**Target Environment:** production (`APP_ENV=production`)
**Production Supabase Project:** `nuwqxlhuxwgevxvsyusj`

## APK

- **Filename:** `Aikarthya-field-ops_V1.0.7.apk`
- **Hosting repo:** `mis-aikarthya/aikarthya-releases` (public — the app's in-app updater downloads anonymously, so the APK must be on the public repo, not the private app repo)
- **GitHub tag:** `v1.0.7`
- **APK Size:** 88.8 MB (93,125,355 bytes)
- **SHA256:** `8a0b7adb9e196cb92ea8192b968d8f4d2752460b90aa81380693a891d556e6b2`
- **Download URL:** https://github.com/mis-aikarthya/aikarthya-releases/releases/download/v1.0.7/Aikarthya-field-ops_V1.0.7.apk

## What Changed

Major release. Two large bodies of work land together:

1. **AI Observation Reporting pipeline** (Specs A–G) — end-to-end report generation from
   observations: scoring v2, a chat-first Report Generation Studio with live SSE streaming,
   prompt + template management stored in the DB, PF review/approval flow, notifications, and
   PDF generation/share.
2. **M&E Associate Console** — `me_associate` now shares the `/mgmt` console behind a
   per-role allow-list, with a new Personal page, non-geofenced staff check-in, a Completed
   Reports view, an org-wide default reporting model, and a responsive (mobile-friendly) shell.

## Database Changes

- `app_settings` table (key/value org-wide settings; seeds `reporting_default_model`) —
  migration `20260620110000`, applied and verified on staging and production on 21-Jun-2026.
- Reporting pipeline backend (edge functions, report tables/RLS) shipped in prior staging
  work and already live on production.

## Verification

- `flutter build apk --release --dart-define=APP_ENV=production`: ✅
- `flutter analyze`: ✅ 0 errors, 0 warnings (287 info-level lints, all in `test/` — `prefer_const_constructors`, `avoid_redundant_argument_values`, etc.)
- `flutter test`: ✅ 490 passing

## Rollout Notes

- Production `app_versions` row inserted for build 10 pointing at the GitHub release APK URL.
- Users on build 9 (v1.0.6+9) will receive the in-app update prompt because 10 > 9.
