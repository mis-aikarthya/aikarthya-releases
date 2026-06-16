# Aikarthya Field Ops v1.0.6 — Changelog

**Release Date:** 17-Jun-2026
**Build Number:** 8
**APK Size:** 76.2 MB

## New Features

### 1. In-App Android Update Flow Rebuilt on DownloadManager
- The APK is now downloaded by Android's system `DownloadManager` instead of an in-app HTTP downloader.
- The download is saved to the public **Downloads** folder, shows a system notification with its own progress bar, and survives app backgrounding or poor connectivity.
- Once the download completes the app automatically launches the system package installer (after the user has granted "install unknown apps" permission).
- A missing Android 11+ package-visibility `<queries>` declaration for the install intent has been added; this was the root cause of the previous "flicker back to the update dialog" failure.

## Fixes

### 1. PF (Program Facilitator) Tab UX & Data Accuracy Improvements
- **Home tab:** time-aware greeting (`Good morning` / `Good afternoon` / `Good evening`), empty-school state card, and staggered entrance animation for the school list.
- **Assessment tab:** pull-to-refresh, count badges on section headers, improved error block with retry, and corrected default form status from `submitted` to `draft` so unsubmitted forms no longer appear completed.
- **Profile tab:** pull-to-refresh, empty/error states for assigned schools, staggered school-card animation, and unimplemented quick actions (Apply Leave, Week Off, Payslips, Expenses) now disabled with "Coming soon" state.
- **Bottom navigation:** haptic feedback on tab taps, animated cross-fade icons, smooth label/text style transitions, and a refined pill indicator using `Curves.easeOutCubic`.
- **Cumulative observation card:** replaced hard-coded dark-blue/teal colors with theme tokens (`inverseSurface`, `inverseOnSurface`, `primaryFixedDim`) for consistency with the updated brand palette.
- **Theme:** primary color aligned to SkillUp teal `#00A3CE` and surface-container tokens added to the `ColorScheme`.

### 2. Profile Cache Isolation
- SharedPreferences programme-name cache key now includes the profile ID so switching accounts cannot leak cached programme names across profiles.

### 3. Update Dialog Flickered and Never Installed
- Tapping "Update Now" showed a brief progress bar and then returned to the dialog with no install and no error.
- Resolution: replace the `Dio` + `open_filex` handoff with the system `DownloadManager` + a direct package-installer intent on the downloaded content URI.

### 4. Better Update Error Messages
- New friendly messages cover `DownloadManager` failures, low-storage errors, and missing install permission.

## Important Bootstrap Note

This release changes the *code that runs inside the app* when it updates itself. A device must already be running **v1.0.6 or later** before the new OTA flow can run. If the device is on an older build, sideload this APK once manually; every subsequent update will then use the new reliable flow.

## Database Migrations (this release)

None.

## Test Coverage

- `flutter test`: passing
- `flutter analyze`: 0 issues
- `flutter build apk --release --dart-define=APP_ENV=production`: successful

---
*Previous build: v1.0.6 build 7 (17-Jun-2026)*
