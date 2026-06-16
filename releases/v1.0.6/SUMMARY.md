# Aikarthya Field Ops v1.0.6 — Summary

## What's New
- In-app Android update flow rebuilt on the system `DownloadManager`
- APK downloads to the public Downloads folder with a system notification and progress
- Auto-launches the system installer when the download completes

## Fixes
- Fixed the "Update Now" flicker/return-to-dialog failure caused by missing install-intent package visibility on Android 11+
- Removed the fragile `Dio` + `open_filex` download/install handoff

## Database Changes
None.

## Tests
- 353 passing, 0 failing
- 0 issues from `flutter analyze`

## APK
- Size: 76.1 MB
- Filename: `Aikarthya-field-ops_V1.0.6.apk`
- Build number: 7

## Bootstrap Note
Because this release changes the in-app updater itself, devices on older builds must sideload this APK once manually. After that, all future OTA updates will use the new DownloadManager flow.
