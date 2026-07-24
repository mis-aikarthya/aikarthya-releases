# Release Checklist — Aikarthya Field Ops v1.2.0+18

Backend: **production** (`nuwqxlhuxwgevxvsyusj`) · Date: 2026-07-24

## Build & publish

- [x] `flutter analyze` — 0 errors, 0 warnings (info-level lints only)
- [x] Notification prod-enablement committed + pushed (`654891d`)
- [x] APK built (`flutter build apk --release`, APP_ENV=production) — 100.9 MB
- [x] Windows zip built — 28.9 MB
- [x] Web built (`--dart-define=APP_ENV=production`) + zipped — 22.0 MB
- [x] SHA-256 recorded in RELEASE-NOTES.md
- [x] Uploaded to Google Drive — folder `12Z9c7MsJPw6sgYzD-DkufN28IfWUAm8e`
- [x] Web deployed to Cloudflare `app-aikarthya --branch=main` (Production, commit 654891d)
- [x] `app_versions` rows upserted (android + windows + web, is_active=true, build 18)
- [~] Prior active rows left as-is (app selects max active build; skill-canonical, not deactivated)
- [x] Git tag `v1.2.0+18` pushed

## e2e / smoke (sign-off)

| Check | Result | Notes |
|-------|--------|-------|
| New APK installs alongside old app (separate package) | | |
| App boots (no cold-boot Brick crash) | | |
| PF login + check-in (eager-prefetch, no first-tap fail) | | |
| Offline: STF fellow reads survive, marks queue-and-replay | | |
| Android: Enable notifications → FCM endpoint registers | | |
| Web (app-aikarthya.pages.dev): Enable → Web Push subscribes | | |
| A queued notification delivers (notification_deliveries > 0) | | |
| Mgmt console STF overview / reporting tabs load | | |

## Notes

- Signed with debug keystore (existing TODO) — same key as v1.2.0+17 for this package.
- Delivery verification needs a real device on this build (endpoints register on first Enable).
