# Aikarthya Field Ops v1.0.6 — Release Summary

**Release Date:** 17-Jun-2026
**Version:** 1.0.6
**Build Number:** 8
**Target Environment:** production (`APP_ENV=production`)
**Production Supabase Project:** `nuwqxlhuxwgevxvsyusj`

## APK

- **Filename:** `Aikarthya-field-ops_V1.0.6.apk`
- **Size:** 76.2 MB
- **SHA256:** `70052f5ef8812c3265af97d20d8e4ad48e741ca113827a1ca1f533e1ea36184e`
- **Download URL:** https://github.com/mis-aikarthya/aikarthya-releases/releases/download/v1.0.6/Aikarthya-field-ops_V1.0.6.apk

## What Changed

This is a hotfix rebuild of v1.0.6. The version name stays at `1.0.6` but the build number is increased to `8` so the in-app updater recognizes it as a newer release.

Highlights:
- PF Home/Assessment/Profile tabs: refreshed UX, pull-to-refresh, count badges, staggered animations, disabled "Coming soon" quick actions.
- Assessment provider now correctly defaults missing `form_status` to `draft` instead of `submitted`.
- Profile programme-name cache is isolated per profile/account.
- Brand color and surface-container tokens aligned to the design system.
- In-app Android update flow rebuilt on `DownloadManager` (carried forward from build 7).

## Database Changes

None.

## Verification

- `flutter build apk --release --dart-define=APP_ENV=production`: ✅ successful
- `flutter analyze`: 0 issues
- `flutter test`: passing

## Rollout Notes

- Production `app_versions` row inserted for build 8 pointing at the GitHub release APK URL.
- Users on v1.0.6 build 7 will receive the update prompt because build 8 is greater than build 7.
