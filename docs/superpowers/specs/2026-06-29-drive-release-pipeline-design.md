# Drive Release Pipeline + In-App Update Migration

**Date:** 2026-06-29
**Status:** Design — awaiting review
**Branch:** `night-shift/me-mgmt-dashboard`

## Problem

The app's in-app updater downloads an APK from a GitHub release asset and
installs it via a native Android `DownloadManager` + package-installer flow.
That download/install path is unreliable in the field. We are migrating the
whole release distribution to a Google Drive shared drive: the app stops
downloading/installing and instead just opens a Drive folder in the browser,
where the user downloads and installs the APK manually.

## Goals

1. App: when an update is available, open the release's Drive folder via the
   browser. Delete all in-app download/install code (Dart + native + manifest).
2. A repeatable release step that uploads each build's artifacts to Drive in a
   fixed folder structure and yields the link the app should open.
3. GitHub releases become dormant — APKs are no longer committed to the repo or
   served from GitHub asset URLs.

## Non-goals

- No direct-file auto-download (Drive shows a virus-scan interstitial for
  >100 MB files and the file id changes every release). We open the **folder**.
- No CI automation. The release script is run manually at release time. (There
  is no existing GitHub Actions workflow to retire.)
- No change to the update-check cadence, the `app_versions` schema, or the
  force-update behaviour.

## Part A — App changes

The version check is unchanged: `UpdateService.checkForUpdate()` reads the
newest active `app_versions` row for `platform='android'` and compares
`build_number` to the installed build (`update_service.dart:23`). Only the
**action** taken when an update exists changes.

### Edit

- **`lib/core/update/update_dialog.dart`** — replace the "Update Now" button
  and all download/install/progress/error-retry UI with a single
  **"Download Update"** button that calls
  `launchUrl(Uri.parse(widget.versionInfo.downloadUrl), mode: LaunchMode.externalApplication)`
  then pops the dialog. This mirrors `lib/core/location/map_launcher.dart:48`.
  Keep: title, version line, release-notes box, and the "Later" button (still
  hidden when `forceUpdate` is true, via `PopScope.canPop`). If `launchUrl`
  throws/returns false, show an inline "Couldn't open the download page" error
  with a Retry button.
- **`lib/core/update/update_provider.dart`** — delete `downloadAndInstall`,
  the `isDownloading`/`isInstalling`/`downloadProgress` state fields, and the
  stale-APK cleanup in `build()`. Keep `checkForUpdate`, `clearUpdate`, and the
  `updateInfo`/`isChecking` state.
- **`lib/core/update/update_service.dart`** — delete `downloadApk`,
  `installApk`, `deleteDownloadedApk`. Keep `checkForUpdate`.

### Delete

- `lib/core/update/apk_download_installer.dart` (+ `_io.dart`, `_stub.dart`)
- `lib/core/update/update_errors.dart`
- `android/app/src/main/kotlin/org/aikarthya/aikarthya_field_ops/ApkUpdater.kt`
- The `ApkUpdater(applicationContext)` registration + its import in
  `android/.../MainActivity.kt:9`
- `<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />`
  in `android/app/src/main/AndroidManifest.xml:18`

### Unchanged

- `lib/core/update/models/app_version_info.dart` — `download_url` now carries
  the Drive APK-subfolder link instead of a GitHub asset URL. No code change.
- `lib/app.dart`, `lib/features/pf_home/profile_tab.dart` — they only watch the
  provider and show `UpdateDialog`; both keep working.
- `pubspec.yaml` — no dependency changes. `url_launcher` (^6.3.0) and
  `package_info_plus` are already present; the deleted installer used native
  platform channels, not a Dart download package.

## Part B — Release-to-Drive script

**File:** `scripts/release-to-drive.ps1` (repo root).
**Runtime:** PowerShell 7+ (`pwsh`). It requires
`[System.Security.Cryptography.RSA]::ImportPkcs8PrivateKey`, which is absent in
Windows PowerShell 5.1; the script checks `$PSVersionTable.PSVersion.Major -ge 7`
and exits with a clear message otherwise.

**Auth:** mirrors `aikarthya-supabase/supabase/functions/_shared/google_drive.ts`
— build a signed RS256 JWT from the service-account JSON
(`aikarthya-reports@aikarthya-field-ops.iam.gserviceaccount.com`), exchange it
at `https://oauth2.googleapis.com/token` for an access token with scope
`https://www.googleapis.com/auth/drive`. The key is read from a JSON file path
passed as a parameter (never committed).

**Parameters:**
- `-Version` (e.g. `1.0.9`) and `-Build` (e.g. `14`) — required.
- `-ApkPath`, `-DesktopZipPath`, `-WebZipPath` — artifact paths.
- `-ChangelogPath`, `-ReleaseNotePath`, `-SummaryPath` — doc paths.
- `-KeyFile` — path to the service-account JSON.
- `-RootFolderId` — default `0AKfyACB4kgZBUk9PVA` (the shared-drive root).

**Drive operations** (all REST, `supportsAllDrives=true`, shared-drive scoped
with `corpora=drive&driveId=<root>` on list — exactly as `ensureFolder` in
`finalize-report/index.ts:69`):
- `Ensure-Folder name parentId` — list by name under parent; create if absent;
  return id. Idempotent, so re-running a release is safe.
- `Upload-File path parentId [name]` — multipart/related upload; optional
  rename. Returns `{id, webViewLink}`.
- `Set-AnyoneReader id` — POST a `{role:reader,type:anyone}` permission.

**Folder tree built under the root:**
```
APK_Release_Folder/                  (Ensure-Folder under -RootFolderId)
  Version1.0.9+14/                   ("Version" + Version + "+" + Build)
    change.log                       (from -ChangelogPath, renamed)
    Release Note.md                  (from -ReleaseNotePath, renamed)
    Summary.md                       (from -SummaryPath, renamed)
    APK/      -> <ApkPath basename>
    Desktop/  -> <DesktopZipPath basename>
    Web/      -> <WebZipPath basename>
```
Every uploaded file and every created folder gets anyone-with-link reader
access, so the `webViewLink` opens without sign-in. Artifact files keep their
source basenames (the version folder name already encodes version+build).

**Output:** the script prints the `webViewLink` of the **APK** subfolder — this
is the value that goes into `app_versions.download_url`. Any artifact may be
omitted (skip its upload) so doc-only or APK-only re-runs work.

**Supabase row:** out of scope for this script. The existing
`release-android-app` skill already inserts the `app_versions` row; it will be
updated to paste this APK-folder link into `download_url` instead of a GitHub
URL. (Schema unchanged: `version`, `build_number`, `download_url`,
`release_notes`, `platform='android'`, `is_active=true`.)

## Verification

- App: `flutter analyze` clean after deletions; build the APK to confirm the
  removed native channel + manifest permission don't break the Android build.
  Manual smoke: with a higher `build_number` active row whose `download_url` is
  a Drive folder, launching the app shows the dialog and "Download Update"
  opens that folder in the browser.
- Script: a dry run against the shared drive creates
  `APK_Release_Folder/Version<x>+<n>/` with the three subfolders + three docs,
  and the printed APK-folder link opens without login. Re-running the same
  version does not duplicate folders (idempotency check).

## Risks

- Service-account write access to shared drive `0AKfyACB4kgZBUk9PVA` must be at
  least Content Manager (confirmed: it is the content manager). If a 403
  appears on create/upload, the account's role on that specific shared drive is
  the cause.
- PowerShell 7 requirement — documented and enforced at startup.
