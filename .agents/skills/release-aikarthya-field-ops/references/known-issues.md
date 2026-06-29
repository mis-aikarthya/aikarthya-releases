# Release Known Issues & Solutions

Living log of errors encountered during Aikarthya Field Ops releases and their proven fixes.
**Update this file whenever you solve a new release problem.**

Format per entry:
```
### <Short title> (first seen: v<version>+<build>, <date>)
**Symptom:** what the user or CI saw
**Root cause:** why it happened
**Fix:** exact commands / edits that resolved it
**Watch:** anything to keep an eye on in future releases
```

---

## Build-time errors

### `flutter build apk` fails — missing Kotlin/AndroidManifest symbol (first seen: v1.0.9+13, 2026-06-29)
**Symptom:** Build aborts with `unresolved reference: ApkUpdater` or similar Kotlin compile error.
**Root cause:** A Kotlin class was deleted (`ApkUpdater.kt`) but its registration call remained in `MainActivity.kt`, or the `ApkUpdater` import was not cleaned up.
**Fix:**
1. Open `android/app/src/main/kotlin/org/aikarthya/aikarthya_field_ops/MainActivity.kt`.
2. Remove any `import` and any `flutterEngine.plugins.add(...)` line referencing the deleted class.
3. Reduce `MainActivity` to the minimal form:
   ```kotlin
   package org.aikarthya.aikarthya_field_ops
   import io.flutter.embedding.android.FlutterActivity
   class MainActivity : FlutterActivity()
   ```
4. `flutter build apk --release` again.

### Dead `<queries>` block causes lint warning after installer removal (first seen: v1.0.9+13, 2026-06-29)
**Symptom:** `flutter analyze` warns about unreachable intent filter or AGP lint flags orphaned `<queries>` intent.
**Root cause:** The `<queries>` block for `application/vnd.android.package-archive` and `INSTALL_PACKAGE` was left in `AndroidManifest.xml` after `ApkUpdater.kt` was deleted.
**Fix:** Remove the entire `<queries>` block from `AndroidManifest.xml`. The `REQUEST_INSTALL_PACKAGES` permission line must also be gone. After removal, `flutter build apk --debug` succeeds clean.

### Dead install-permission code re-merges manifest permission (first seen: v1.0.9+13, 2026-06-29)
**Symptom:** `REQUEST_INSTALL_PACKAGES` reappears in the built manifest even though the `<uses-permission>` line was removed.
**Root cause:** `permission_handler` reads Dart-side `Permission.requestInstallPackages` references and can merge the permission back into the manifest at build time.
**Fix:** Delete `installPackagesGranted()` and `requestInstallPackagesIfNeeded()` from `lib/core/permissions/permission_service.dart`, and remove `Permission.requestInstallPackages` from the `_androidPermissions` list. Grep for `requestInstallPackages` across `lib/` to confirm zero callers remain before deleting.

---

## Drive upload errors

### PowerShell 7 not installed / `pwsh` not on PATH (first seen: 2026-06-29)
**Symptom:** `pwsh` not found, or script aborts with "PowerShell 7+ required (found 5.1)".
**Root cause:** Only Windows PowerShell 5.1 is present; `scripts/release-to-drive.ps1` requires PS7 for `RSA.ImportFromPem`.
**Fix:**
```
winget install --id Microsoft.PowerShell --source winget
```
Verify: open a new terminal → `pwsh --version` → should show `7.x.x`.
After install, pwsh is typically at:
`C:\Users\KIIT0001\AppData\Local\Microsoft\WindowsApps\pwsh`
Use `pwsh` (on PATH after new terminal) or the full path above.

### 403 on Drive file/folder create — role error vs. org link-sharing policy (first seen: watch item, 2026-06-29)
**Symptom:** Drive REST call returns 403.
**Root cause (two possibilities):**
1. Service account doesn't have Content Manager role on the shared drive `0AKfyACB4kgZBUk9PVA`.
2. Org Workspace policy blocks "anyone with link" sharing (`Set-AnyoneReader` call fails).
**How to distinguish:** a 403 on `files` (create/upload) = role problem; a 403 only on `permissions` = org link-sharing policy.
**Fix for role problem:** Grant Content Manager (or higher) to `aikarthya-reports@aikarthya-field-ops.iam.gserviceaccount.com` on the shared drive in Google Drive admin.
**Fix for link-sharing policy:** Contact Workspace admin to allow external link sharing on that drive, or switch to a shared-with-specific-users approach (update `Set-AnyoneReader` in the script).
**Note:** As of v1.0.9+14 live run (2026-06-29), the `anyone` sharing worked — no org policy block at that time.

### Orphaned zero-byte file after failed two-step upload (watch item, 2026-06-29)
**Symptom:** A zero-byte file appears in the Drive version folder; the upload failed partway through.
**Root cause:** `Upload-File` in `scripts/release-to-drive.ps1` does two steps — POST metadata (creates the file), then PATCH media. If the PATCH fails (network, timeout, large file), the metadata stub is left behind.
**Fix:** Re-run the script for the same version — `Ensure-Folder` is idempotent so folders won't duplicate; only the file will be re-uploaded. The zero-byte stub will need manual deletion from Drive if it causes a name conflict (Drive allows duplicate names, so it won't block, but clean it up for clarity).

### Service-account key path not found (runtime, recurring)
**Symptom:** Script aborts with `Get-Content: Cannot find path '...'`.
**Root cause:** Key file path passed to `-KeyFile` is wrong or the file was moved.
**Fix:** Key file canonical location: `C:\Users\KIIT0001\Desktop\aikarthya-field-ops-7bc128f5b085.json`. Verify with `ls` before running the script. Never commit this file.

---

## Supabase / DB errors

### `supabase db query --db-url` connection fails — IPv6-only host (first seen: 2026-06-29)
**Symptom:** `failed to connect to postgres: hostname resolving error (lookup db.fmmnrrjkoqsfwhbmswic.supabase.co: no such host)`.
**Root cause:** Supabase's direct DB host (`db.<ref>.supabase.co`) is IPv6-only on some projects; the local network/DNS may not support it.
**Fix:** Use the Management API path instead:
```bash
cd aikarthya-supabase
supabase link --project-ref <ref> -p <password>
supabase db query --linked "<sql>"
```
This routes through the Supabase CLI's Management API (HTTPS), which works everywhere.

### Wrong column names in INSERT — row never shows update prompt (first seen: 2026-06-29)
**Symptom:** INSERT appears to succeed but the app never shows the update dialog; querying `app_versions` shows the row is missing or has null values.
**Root cause:** INSERT used non-existent columns (`version_name`, `mandatory`) or omitted `platform` (NOT NULL, no default → row rejected).
**Real schema (verified against migration `20260609010000_app_versions_table.sql`):**
```
platform        TEXT  NOT NULL  -- 'android' | 'ios' | 'windows'
version         TEXT  NOT NULL  -- e.g. '1.0.9'
build_number    INT   NOT NULL
download_url    TEXT  NOT NULL
release_notes   TEXT
force_update    BOOL  DEFAULT false
min_sdk_version INT   DEFAULT 21
is_active       BOOL  DEFAULT true
```
**Conflict key:** `UNIQUE(platform, build_number)` → `ON CONFLICT (platform, build_number)`.
**Fix:** Use the exact INSERT in SKILL.md Step 7. Always include `platform='android'`.

### Supabase CLI left linked to staging — subsequent prod commands hit wrong DB (first seen: 2026-06-29)
**Symptom:** A `supabase db query --linked` command after a staging release runs against staging instead of prod.
**Root cause:** The CLI's linked project was changed to staging and not restored.
**Fix:** Always run this immediately after any staging operation:
```bash
PROD_PW=$(grep PROD_DB_PASSWORD aikarthya-supabase/.env | cut -d= -f2-)
supabase link --project-ref nuwqxlhuxwgevxvsyusj -p "$PROD_PW"
```
**Prevention:** The skill's Step 7d mandates this restore — do not skip it.

---

## Update dialog / in-app errors

### In-app download/install flow — unreliable on-device install (historical, resolved v1.0.9+13)
**Symptom:** App downloaded the APK but the install step failed silently or errored on various Android versions.
**Root cause:** The native `ApkUpdater.kt` (DownloadManager + package installer intent) had compatibility issues with file providers and install permissions across Android API levels.
**Resolution:** Entire in-app download/install flow removed as of v1.0.9+13 (2026-06-29). The update dialog now opens the Google Drive APK folder in the browser; the user downloads and installs manually. No further in-app installer debugging needed.

### Auth NULL-token login bug — "Sign in failed" for directly-inserted users (recurring)
**Symptom:** Users inserted directly into `auth.users` (not via Supabase Auth signup) get a generic "Sign in failed" error.
**Root cause:** Directly-inserted rows have NULL token columns; the app's auth path doesn't handle NULLs gracefully.
**Fix:** `COALESCE(..., '')` on the token columns in the insert, or use a password-reset flow to trigger proper token generation. Direct row insertion alone is not sufficient.

---

## Environment / config errors

### App `.env` points at wrong backend after a staging test (recurring)
**Symptom:** App on device uses staging data even though a production release was done, or vice versa.
**Root cause:** `aikarthya-field-ops-app/.env` (the active env file) was set to staging during testing and not restored.
**Fix:** Check `grep SUPABASE_URL aikarthya-field-ops-app/.env`. Restore from `.env.production` or `.env.staging` as appropriate.

### Edge-function drift — reporting works on staging, breaks on prod (first seen: 2026-06)
**Symptom:** A feature that uses Supabase Edge Functions works on staging but returns an error on production after a backend change.
**Root cause:** Edge functions on prod were stale/missing; only the DB was synced.
**Fix:** After any backend change that touches Edge Functions, always redeploy ALL functions to prod:
```bash
cd aikarthya-supabase
supabase functions deploy --project-ref nuwqxlhuxwgevxvsyusj
```
