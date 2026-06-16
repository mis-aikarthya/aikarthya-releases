# Aikarthya Field Ops v1.0.5 — Summary

## What's New
- In-app Android update flow rebuilt on `open_filex`
- Auto-check for updates after every successful sync
- Auto-prompt once per app session for available updates (force updates stay non-dismissible)

## Fixes
- APK download/install no longer silently fails with a flickering progress bar
- System installer now receives the APK through a correctly configured `FileProvider`
- Real install errors are shown in the update dialog

## Database Changes
None.

## Tests
- 347 passing, 0 failing
- 0 issues from `flutter analyze` on changed files

## APK
- Size: 74.8 MB
- Filename: `Aikarthya-field-ops_V1.0.5.apk`
- Build number: 5
