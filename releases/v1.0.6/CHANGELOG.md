# Aikarthya Field Ops v1.0.6 — Changelog

**Release Date:** 17-Jun-2026
**Build Number:** 7
**APK Size:** 76.1 MB

## New Features

### 1. In-App Android Update Flow Rebuilt on DownloadManager
- The APK is now downloaded by Android's system `DownloadManager` instead of an in-app HTTP downloader.
- The download is saved to the public **Downloads** folder, shows a system notification with its own progress bar, and survives app backgrounding or poor connectivity.
- Once the download completes the app automatically launches the system package installer (after the user has granted "install unknown apps" permission).
- A missing Android 11+ package-visibility `<queries>` declaration for the install intent has been added; this was the root cause of the previous "flicker back to the update dialog" failure.

## Fixes

### 1. Update Dialog Flickered and Never Installed
- Tapping "Update Now" showed a brief progress bar and then returned to the dialog with no install and no error.
- Resolution: replace the `Dio` + `open_filex` handoff with the system `DownloadManager` + a direct package-installer intent on the downloaded content URI.

### 2. Better Update Error Messages
- New friendly messages cover `DownloadManager` failures, low-storage errors, and missing install permission.

## Important Bootstrap Note

This release changes the *code that runs inside the app* when it updates itself. A device must already be running **v1.0.6 or later** before the new OTA flow can run. If the device is on an older build, sideload this APK once manually; every subsequent update will then use the new reliable flow.

## Database Migrations (this release)

None.

## Test Coverage

- 353 tests passing, 0 failures
- `flutter analyze`: 0 issues
- `flutter build apk --release`: successful

---
*Previous build: v1.0.5 build 6 (16-Jun-2026)*
