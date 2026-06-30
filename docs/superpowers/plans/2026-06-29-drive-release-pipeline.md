# Drive Release Pipeline + In-App Update Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's in-app APK download/install with a button that opens the release's Google Drive folder, and add a PowerShell script that uploads each release's artifacts to Drive in a fixed structure.

**Architecture:** The Supabase `app_versions` version-check is untouched; only the update dialog's action changes (download/install → `launchUrl` to the Drive folder). All in-app download/install code (Dart + native Kotlin + manifest permission) is deleted. A standalone `pwsh` script reuses the JWT + Drive-REST pattern from `aikarthya-supabase/.../_shared/google_drive.ts` to build the per-release folder tree on the shared drive and print the APK-folder link.

**Tech Stack:** Flutter/Dart, `url_launcher` (already a dep), Riverpod; Android Kotlin; PowerShell 7+ with .NET `System.Security.Cryptography.RSA`; Google Drive v3 REST.

## Global Constraints

- App submodule root: `aikarthya-field-ops-app/`. All Dart/Android paths below are relative to it unless they start with `aikarthya-`, `scripts/`, or `docs/`.
- `download_url` in `app_versions` now holds a Drive **APK-subfolder** webViewLink; no schema change.
- Drive shared-drive root id: `0AKfyACB4kgZBUk9PVA`. All Drive calls use `supportsAllDrives=true`; list calls also use `includeItemsFromAllDrives=true&corpora=drive&driveId=<root>`.
- Version folder name format: `Version{version}+{build}` (e.g. `Version1.0.9+14`) — no spaces.
- Release doc filenames in the version folder: exactly `change.log`, `Release Note.md`, `Summary.md`.
- The release script requires PowerShell 7+ (`$PSVersionTable.PSVersion.Major -ge 7`); it must fail fast otherwise.
- Service account: `aikarthya-reports@aikarthya-field-ops.iam.gserviceaccount.com`; key supplied as a JSON file path, never committed.
- Run Flutter commands from inside `aikarthya-field-ops-app/`.

---

## File Structure

- `lib/core/update/update_dialog.dart` — rewritten: opens Drive folder, no download UI.
- `lib/core/update/update_provider.dart` — slimmed: check-only state.
- `lib/core/update/update_service.dart` — slimmed: `checkForUpdate` only.
- `lib/app.dart`, `lib/features/pf_home/profile_tab.dart` — drop removed state fields from guards.
- Deleted: `lib/core/update/apk_download_installer.dart` (+ `_io`, `_stub`), `lib/core/update/update_errors.dart`, `android/.../ApkUpdater.kt`.
- `android/.../MainActivity.kt`, `android/app/src/main/AndroidManifest.xml` — drop installer wiring + permission.
- `test/core/update/update_dialog_test.dart` — widget test for the new dialog.
- `scripts/release-to-drive.ps1` — new release uploader (repo root).
- `.agents/skills/release-android-app/SKILL.md` — point release flow at Drive.

---

## Task 1: Migrate the in-app update flow to open Drive (Dart)

**Files:**
- Modify: `lib/core/update/update_dialog.dart` (full rewrite)
- Modify: `lib/core/update/update_provider.dart` (full rewrite)
- Modify: `lib/core/update/update_service.dart` (full rewrite)
- Modify: `lib/app.dart:72-75`
- Modify: `lib/features/pf_home/profile_tab.dart:63-67`
- Delete: `lib/core/update/apk_download_installer.dart`, `apk_download_installer_io.dart`, `apk_download_installer_stub.dart`, `update_errors.dart`
- Test: `test/core/update/update_dialog_test.dart`

**Interfaces:**
- Consumes: `AppVersionInfo` (`models/app_version_info.dart`, unchanged) with `.downloadUrl`, `.displayVersion`, `.releaseNotes`, `.forceUpdate`.
- Produces: `UpdateCheckState { AppVersionInfo? updateInfo; bool isChecking; bool get updateAvailable }`; `UpdateCheckNotifier.checkForUpdate({bool force})`, `.clearUpdate()`; `UpdateService.checkForUpdate() -> Future<AppVersionInfo?>`; `UpdateDialog({required AppVersionInfo versionInfo})`.

- [ ] **Step 1: Rewrite `update_service.dart`** — keep only the version check.

```dart
import 'package:aikarthya_field_ops/core/update/models/app_version_info.dart';
import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class UpdateService {
  static const String _supabaseTable = 'app_versions';

  /// In-app update is Android-only. On web / desktop / iOS the check is
  /// skipped so an Android-only update dialog never shows there.
  static bool get _isAndroid =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  Future<AppVersionInfo?> checkForUpdate() async {
    if (!_isAndroid) return null;
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final currentBuild = int.tryParse(packageInfo.buildNumber) ?? 0;

      final response = await Supabase.instance.client
          .from(_supabaseTable)
          .select()
          .eq('platform', 'android')
          .eq('is_active', true)
          .order('build_number', ascending: false)
          .limit(1)
          .single();

      final latestBuild = response['build_number'] as int;
      if (latestBuild > currentBuild) {
        return AppVersionInfo.fromMap(response);
      }
      return null;
    } on Exception catch (_) {
      return null;
    }
  }
}
```

- [ ] **Step 2: Rewrite `update_provider.dart`** — drop download/install/progress and the stale-APK cleanup.

```dart
import 'package:aikarthya_field_ops/core/update/models/app_version_info.dart';
import 'package:aikarthya_field_ops/core/update/update_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final updateCheckProvider =
    AsyncNotifierProvider<UpdateCheckNotifier, UpdateCheckState>(
      UpdateCheckNotifier.new,
    );

class UpdateCheckState {
  const UpdateCheckState({this.updateInfo, this.isChecking = false});

  final AppVersionInfo? updateInfo;
  final bool isChecking;

  bool get updateAvailable => updateInfo != null;
}

class UpdateCheckNotifier extends AsyncNotifier<UpdateCheckState> {
  static const String _lastCheckKey = 'last_update_check_v1';
  static const Duration _checkInterval = Duration(hours: 24);

  @override
  Future<UpdateCheckState> build() async => const UpdateCheckState();

  Future<void> checkForUpdate({bool force = false}) async {
    if (!force && !await _shouldCheck()) return;

    state = const AsyncData(UpdateCheckState(isChecking: true));
    try {
      final info = await UpdateService().checkForUpdate();
      await _recordCheck();
      state = AsyncData(UpdateCheckState(updateInfo: info));
    } on Exception catch (_) {
      state = const AsyncData(UpdateCheckState());
    }
  }

  void clearUpdate() {
    if (state.value != null) {
      state = const AsyncData(UpdateCheckState());
    }
  }

  Future<bool> _shouldCheck() async {
    final prefs = await SharedPreferences.getInstance();
    final lastCheck = prefs.getInt(_lastCheckKey);
    if (lastCheck == null) return true;
    final lastCheckTime = DateTime.fromMillisecondsSinceEpoch(lastCheck);
    return DateTime.now().difference(lastCheckTime) > _checkInterval;
  }

  Future<void> _recordCheck() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_lastCheckKey, DateTime.now().millisecondsSinceEpoch);
  }
}
```

- [ ] **Step 3: Rewrite `update_dialog.dart`** — open the Drive folder via `url_launcher`; no Riverpod, no download UI.

```dart
import 'package:aikarthya_field_ops/core/theme/app_theme.dart';
import 'package:aikarthya_field_ops/core/update/models/app_version_info.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class UpdateDialog extends StatefulWidget {
  const UpdateDialog({required this.versionInfo, super.key});

  final AppVersionInfo versionInfo;

  @override
  State<UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<UpdateDialog> {
  String? _error;

  @override
  Widget build(BuildContext context) {
    final info = widget.versionInfo;
    return PopScope(
      canPop: !info.forceUpdate,
      child: AlertDialog(
        title: const Text('Update Available'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Version ${info.displayVersion}',
              style: AppTypography.headlineSmall.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.onSurface,
              ),
            ),
            if (info.releaseNotes != null && info.releaseNotes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                constraints: const BoxConstraints(maxHeight: 120),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    info.releaseNotes!,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              'This opens the download page in your browser. Download the APK '
              'there, then open it to install.',
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppColors.error, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.onErrorContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (!info.forceUpdate)
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Later'),
            ),
          FilledButton(
            onPressed: _openDownloadPage,
            child: Text(_error == null ? 'Download Update' : 'Retry'),
          ),
        ],
      ),
    );
  }

  Future<void> _openDownloadPage() async {
    setState(() => _error = null);
    final uri = Uri.tryParse(widget.versionInfo.downloadUrl);
    if (uri == null) {
      setState(() => _error = "Couldn't open the download page.");
      return;
    }
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok) {
        setState(() => _error = "Couldn't open the download page.");
        return;
      }
      if (mounted && !widget.versionInfo.forceUpdate) {
        Navigator.of(context).pop();
      }
    } on Exception catch (_) {
      setState(() => _error = "Couldn't open the download page.");
    }
  }
}
```

- [ ] **Step 4: Fix the guard in `lib/app.dart`** — remove the two deleted fields.

Replace lines 72-75:
```dart
          if (updateState.updateAvailable &&
              !updateState.isChecking &&
              !updateState.isDownloading &&
              !updateState.isInstalling) {
```
with:
```dart
          if (updateState.updateAvailable && !updateState.isChecking) {
```

- [ ] **Step 5: Fix the guard in `lib/features/pf_home/profile_tab.dart`** — same removal.

Replace lines 63-67:
```dart
          if (updateState.updateAvailable &&
              !updateState.isChecking &&
              !updateState.isDownloading &&
              !updateState.isInstalling &&
              !_updateDialogShown) {
```
with:
```dart
          if (updateState.updateAvailable &&
              !updateState.isChecking &&
              !_updateDialogShown) {
```

- [ ] **Step 6: Delete the now-orphaned files**

```bash
cd aikarthya-field-ops-app
git rm lib/core/update/apk_download_installer.dart \
       lib/core/update/apk_download_installer_io.dart \
       lib/core/update/apk_download_installer_stub.dart \
       lib/core/update/update_errors.dart
```

- [ ] **Step 7: Write the widget test** `test/core/update/update_dialog_test.dart`

```dart
import 'package:aikarthya_field_ops/core/update/models/app_version_info.dart';
import 'package:aikarthya_field_ops/core/update/update_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

AppVersionInfo _info({bool force = false}) => AppVersionInfo(
      version: '1.0.9',
      buildNumber: 14,
      downloadUrl: 'https://drive.google.com/drive/folders/x',
      releaseNotes: 'Bug fixes',
      forceUpdate: force,
      minSdkVersion: 21,
      createdAt: DateTime(2026),
    );

void main() {
  testWidgets('shows version, notes and Download Update button', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: UpdateDialog(versionInfo: _info())),
    );
    expect(find.text('Update Available'), findsOneWidget);
    expect(find.text('Version v1.0.9 (build 14)'), findsOneWidget);
    expect(find.text('Bug fixes'), findsOneWidget);
    expect(find.text('Download Update'), findsOneWidget);
    expect(find.text('Later'), findsOneWidget);
  });

  testWidgets('force update hides the Later button', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: UpdateDialog(versionInfo: _info(force: true))),
    );
    expect(find.text('Later'), findsNothing);
    expect(find.text('Download Update'), findsOneWidget);
  });
}
```

- [ ] **Step 8: Run the test**

Run: `cd aikarthya-field-ops-app && flutter test test/core/update/update_dialog_test.dart`
Expected: PASS (2 tests).

- [ ] **Step 9: Analyze**

Run: `cd aikarthya-field-ops-app && flutter analyze lib test/core/update`
Expected: no issues (no references to removed `isDownloading`/`isInstalling`/installer remain).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(update): open Drive download page instead of in-app install"
```

---

## Task 2: Remove the native Android APK installer

**Files:**
- Delete: `android/app/src/main/kotlin/org/aikarthya/aikarthya_field_ops/ApkUpdater.kt`
- Modify: `android/app/src/main/kotlin/org/aikarthya/aikarthya_field_ops/MainActivity.kt`
- Modify: `android/app/src/main/AndroidManifest.xml:18`

**Interfaces:**
- Consumes: nothing from other tasks. After Task 1 no Dart code references the `aikarthya/apk_updater` channels.
- Produces: an Android build with no installer channel and no install permission.

- [ ] **Step 1: Delete the native installer**

```bash
cd aikarthya-field-ops-app
git rm android/app/src/main/kotlin/org/aikarthya/aikarthya_field_ops/ApkUpdater.kt
```

- [ ] **Step 2: Drop the registration in `MainActivity.kt`**

Replace the whole file with:
```kotlin
package org.aikarthya.aikarthya_field_ops

import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity()
```

- [ ] **Step 3: Remove the install permission from `AndroidManifest.xml`**

Delete this line (currently line 18):
```xml
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
```

- [ ] **Step 4: Confirm nothing else references the channel**

Run: `cd aikarthya-field-ops-app && grep -rn "apk_updater\|ApkUpdater\|REQUEST_INSTALL_PACKAGES" lib android`
Expected: no matches.

- [ ] **Step 5: Build the Android APK to confirm it compiles**

Run: `cd aikarthya-field-ops-app && flutter build apk --debug`
Expected: `Built build/app/outputs/flutter-apk/app-debug.apk`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(android): remove native APK installer + install permission"
```

---

## Task 3: PowerShell release-to-Drive script

**Files:**
- Create: `scripts/release-to-drive.ps1` (repo root, NOT the app submodule)

**Interfaces:**
- Consumes: a service-account JSON key file; the shared-drive root id.
- Produces: a `Version{v}+{build}` folder tree on Drive and prints the APK subfolder webViewLink to stdout (last line: `APK_FOLDER_LINK=<url>`).

- [ ] **Step 1: Create `scripts/release-to-drive.ps1`**

```powershell
#!/usr/bin/env pwsh
# Uploads a release's artifacts to the Aikarthya Drive shared drive in the
# structure:
#   APK_Release_Folder/Version{Version}+{Build}/
#       change.log, Release Note.md, Summary.md
#       APK/<apk>, Desktop/<zip>, Web/<zip>
# Prints the APK subfolder link for app_versions.download_url.
#
# Requires PowerShell 7+ (ImportFromPem). Run:
#   pwsh -File scripts/release-to-drive.ps1 -Version 1.0.9 -Build 14 `
#     -KeyFile sa.json -ApkPath app.apk -DesktopZipPath d.zip -WebZipPath w.zip `
#     -ChangelogPath CHANGELOG.md -ReleaseNotePath NOTES.md -SummaryPath SUMMARY.md

[CmdletBinding()]
param(
  [string]$Version,
  [string]$Build,
  [string]$KeyFile,
  [string]$ApkPath,
  [string]$DesktopZipPath,
  [string]$WebZipPath,
  [string]$ChangelogPath,
  [string]$ReleaseNotePath,
  [string]$SummaryPath,
  [string]$RootFolderId = '0AKfyACB4kgZBUk9PVA',
  [switch]$SelfTest
)

$ErrorActionPreference = 'Stop'

function Get-VersionFolderName([string]$v, [string]$b) { "Version$v+$b" }

if ($SelfTest) {
  $name = Get-VersionFolderName '1.0.9' '14'
  if ($name -ne 'Version1.0.9+14') { throw "SelfTest failed: got '$name'" }
  Write-Host 'SelfTest OK'
  return
}

if ($PSVersionTable.PSVersion.Major -lt 7) {
  throw "PowerShell 7+ required (found $($PSVersionTable.PSVersion)). Run with 'pwsh'."
}
foreach ($req in 'Version','Build','KeyFile') {
  if (-not (Get-Variable $req -ValueOnly)) { throw "Missing required -$req" }
}

function ConvertTo-Base64Url([byte[]]$bytes) {
  [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}

function Get-AccessToken([string]$keyFile) {
  $sa = Get-Content $keyFile -Raw | ConvertFrom-Json
  $now = [int][double]::Parse((Get-Date -UFormat %s))
  $enc = [Text.Encoding]::UTF8
  $header = (@{ alg = 'RS256'; typ = 'JWT' } | ConvertTo-Json -Compress)
  $claims = (@{
      iss = $sa.client_email
      scope = 'https://www.googleapis.com/auth/drive'
      aud = 'https://oauth2.googleapis.com/token'
      iat = $now
      exp = $now + 3600
    } | ConvertTo-Json -Compress)
  $signingInput = (ConvertTo-Base64Url $enc.GetBytes($header)) + '.' +
                  (ConvertTo-Base64Url $enc.GetBytes($claims))
  $rsa = [System.Security.Cryptography.RSA]::Create()
  $rsa.ImportFromPem($sa.private_key)
  $sig = $rsa.SignData(
    $enc.GetBytes($signingInput),
    [Security.Cryptography.HashAlgorithmName]::SHA256,
    [Security.Cryptography.RSASignaturePadding]::Pkcs1)
  $jwt = "$signingInput." + (ConvertTo-Base64Url $sig)
  $resp = Invoke-RestMethod -Method Post -Uri 'https://oauth2.googleapis.com/token' `
    -ContentType 'application/x-www-form-urlencoded' `
    -Body @{ grant_type = 'urn:ietf:params:oauth:grant-type:jwt-bearer'; assertion = $jwt }
  return $resp.access_token
}

function Ensure-Folder([string]$name, [string]$parentId, [string]$token) {
  $escaped = $name.Replace("'", "\'")
  $q = "name='$escaped' and '$parentId' in parents and " +
       "mimeType='application/vnd.google-apps.folder' and trashed=false"
  $listUri = 'https://www.googleapis.com/drive/v3/files?q=' +
    [uri]::EscapeDataString($q) +
    "&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=$RootFolderId&fields=files(id,name)"
  $list = Invoke-RestMethod -Uri $listUri -Headers @{ Authorization = "Bearer $token" }
  if ($list.files -and $list.files.Count -gt 0) { return $list.files[0].id }
  $body = @{ name = $name; mimeType = 'application/vnd.google-apps.folder'; parents = @($parentId) } | ConvertTo-Json
  $created = Invoke-RestMethod -Method Post `
    -Uri 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true' `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body
  return $created.id
}

function Set-AnyoneReader([string]$id, [string]$token) {
  $body = @{ role = 'reader'; type = 'anyone' } | ConvertTo-Json
  Invoke-RestMethod -Method Post `
    -Uri "https://www.googleapis.com/drive/v3/files/$id/permissions?supportsAllDrives=true" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body | Out-Null
}

function Upload-File([string]$path, [string]$parentId, [string]$token, [string]$name) {
  if (-not $name) { $name = Split-Path $path -Leaf }
  $meta = @{ name = $name; parents = @($parentId) } | ConvertTo-Json
  $file = Invoke-RestMethod -Method Post `
    -Uri 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id' `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $meta
  $result = Invoke-RestMethod -Method Patch `
    -Uri "https://www.googleapis.com/upload/drive/v3/files/$($file.id)?uploadType=media&supportsAllDrives=true&fields=id,webViewLink" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/octet-stream' -InFile $path
  Set-AnyoneReader $result.id $token
  return $result
}

$token = Get-AccessToken $KeyFile
$rootApk = Ensure-Folder 'APK_Release_Folder' $RootFolderId $token
Set-AnyoneReader $rootApk $token
$verName = Get-VersionFolderName $Version $Build
$verFolder = Ensure-Folder $verName $rootApk $token
Set-AnyoneReader $verFolder $token

# Docs at version-folder root (renamed to the canonical names)
if ($ChangelogPath)   { Upload-File $ChangelogPath   $verFolder $token 'change.log'      | Out-Null }
if ($ReleaseNotePath) { Upload-File $ReleaseNotePath $verFolder $token 'Release Note.md' | Out-Null }
if ($SummaryPath)     { Upload-File $SummaryPath     $verFolder $token 'Summary.md'      | Out-Null }

# Artifact subfolders
$apkFolder = Ensure-Folder 'APK' $verFolder $token
Set-AnyoneReader $apkFolder $token
if ($ApkPath) { Upload-File $ApkPath $apkFolder $token | Out-Null }

if ($DesktopZipPath) {
  $d = Ensure-Folder 'Desktop' $verFolder $token
  Set-AnyoneReader $d $token
  Upload-File $DesktopZipPath $d $token | Out-Null
}
if ($WebZipPath) {
  $w = Ensure-Folder 'Web' $verFolder $token
  Set-AnyoneReader $w $token
  Upload-File $WebZipPath $w $token | Out-Null
}

$link = "https://drive.google.com/drive/folders/$apkFolder"
Write-Host "Release '$verName' uploaded."
Write-Host "APK_FOLDER_LINK=$link"
```

- [ ] **Step 2: Run the self-test (no network, no key)**

Run: `pwsh -File scripts/release-to-drive.ps1 -SelfTest`
Expected: `SelfTest OK`.

- [ ] **Step 3: Confirm the 5.1 guard message path is reachable**

Run (Windows PowerShell 5.1): `powershell -File scripts/release-to-drive.ps1 -Version 1.0.9 -Build 14 -KeyFile x`
Expected: throws "PowerShell 7+ required ...". (Skip if 5.1 unavailable.)

- [ ] **Step 4: Live dry run against Drive** (needs the real `-KeyFile`)

Run:
```bash
pwsh -File scripts/release-to-drive.ps1 -Version 0.0.0 -Build 0 -KeyFile <sa.json> \
  -ChangelogPath docs/superpowers/plans/2026-06-29-drive-release-pipeline.md \
  -ReleaseNotePath docs/superpowers/plans/2026-06-29-drive-release-pipeline.md \
  -SummaryPath docs/superpowers/plans/2026-06-29-drive-release-pipeline.md
```
Expected: prints `APK_FOLDER_LINK=...`; the folder `APK_Release_Folder/Version0.0.0+0/` exists on Drive with `change.log`/`Release Note.md`/`Summary.md` + empty `APK/`; the printed link opens without sign-in. Re-run the same command — verify no duplicate folders appear (idempotency). Delete the `Version0.0.0+0` test folder afterward.

- [ ] **Step 5: Commit**

```bash
git add scripts/release-to-drive.ps1
git commit -m "feat(release): PowerShell uploader for release artifacts to Drive"
```

---

## Task 4: Point the release flow at Drive (skill + GitHub dormancy)

**Files:**
- Modify: `.agents/skills/release-android-app/SKILL.md`

**Interfaces:**
- Consumes: `scripts/release-to-drive.ps1` and its `APK_FOLDER_LINK=` output.
- Produces: an updated release runbook.

- [ ] **Step 1: Read the current skill**

Run: `sed -n '1,200p' .agents/skills/release-android-app/SKILL.md`
Expected: see where it builds the APK and sets `app_versions.download_url`.

- [ ] **Step 2: Edit the runbook** so the distribution step:
  1. Builds APK + desktop zip + web zip.
  2. Runs `scripts/release-to-drive.ps1` with the version/build, artifact paths, and the three doc paths.
  3. Copies the printed `APK_FOLDER_LINK` value into `app_versions.download_url` (instead of a GitHub asset URL).
  4. Adds a note: **GitHub releases are dormant — do not commit APKs to the repo (`*.apk`/`*.zip` are gitignored) and do not create GitHub release assets.**

  Make the exact textual edits matching the existing section structure found in Step 1 (replace the GitHub-upload instructions with the three steps above; keep the `app_versions` SQL/insert step, changing only the `download_url` source).

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/release-android-app/SKILL.md
git commit -m "docs(release): switch release runbook from GitHub to Drive distribution"
```

---

## Self-Review

**Spec coverage:**
- Part A app edits → Task 1 (dialog/provider/service + guards + deletions) and Task 2 (native + manifest). ✓
- Part B release script (auth/ensureFolder/upload/anyone-reader, folder tree, doc names, APK-link output, pwsh-7 guard) → Task 3. ✓
- GitHub dormant + app_versions link source → Task 4. ✓
- Verification (analyze, build, dry run, idempotency) → Task 1 Step 9, Task 2 Step 5, Task 3 Step 4. ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete; the only `<placeholder>` is `<sa.json>` (a user-supplied secret path, correctly not committed). ✓

**Type consistency:** `UpdateCheckState`/`UpdateCheckNotifier`/`UpdateService.checkForUpdate`/`UpdateDialog` names match across Task 1 and the unchanged `app.dart`/`profile_tab.dart` call sites. `Get-VersionFolderName`/`Ensure-Folder`/`Upload-File`/`Set-AnyoneReader`/`Get-AccessToken` are consistent within Task 3. ✓
