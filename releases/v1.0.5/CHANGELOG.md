# Aikarthya Field Ops v1.0.5 — Changelog

**Release Date:** 16-Jun-2026
**Build Number:** 6
**APK Size:** 76.4 MB

## New Features

### 1. In-App Android Update Flow
- Replaced the broken APK installer package (`android_package_installer`) with `open_filex`.
- Fixed the `FileProvider` authority to match `open_filex` requirements.
- Download now validates HTTP 200 only and streams directly to temp storage instead of buffering in memory.
- Installer now surfaces real errors in the update dialog instead of silently flickering back to idle.

## Fixes

### 1. APK Download / Install Silent Failure
- The previous installer would show a brief progress bar, then the update button would flicker back with no install and no error. This was caused by a misconfigured `android_package_installer` integration.
- Resolution: use `open_filex` to hand the downloaded APK to the Android system package installer via a `content://` URI.

### 2. Updates Not Surfacing Automatically
- Previously, the update badge/dialog only appeared after manually tapping "Check for Updates" in the Profile tab.
- Resolution: a full manual sync now forces an update check, and the app auto-prompts once per session for any available update (optional updates are dismissible; force updates remain non-dismissible).

### 3. Stale APK Cleanup
- The downloaded APK is no longer deleted immediately after launching the installer intent (the system installer reads it asynchronously). It is cleaned up at the next update-provider initialization instead.

## Fixes (build 6 patch)

### 4. Splash Screen Background Color Mismatch
- The native Android launch window and in-app splash screen used slightly different background colors (`#FAFAF1` vs system white), causing visible edge lines around the splash GIF.
- Resolution: unified the splash background to `#FEFCFE` in `AppColors.splashBackground`, updated both `cold_boot_splash.dart` and `post_login_splash.dart`, set the Android `launch_background` to the same color, and reprocessed the GIF so all background pixels are exactly `#FEFCFE`.

## Database Migrations (this release)

None.

## Test Coverage

- 347 tests passing, 0 failures
- `flutter analyze`: 0 issues on changed files
- `flutter build apk --release`: successful

---
*Previous build: v1.0.5 (build 5, 16-Jun-2026)*
