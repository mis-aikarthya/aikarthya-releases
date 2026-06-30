---
name: release-aikarthya-field-ops
description: |
  ALWAYS use this skill when the user invokes /release-aikarthya-field-ops or asks to release,
  publish, deploy, or build a new version of the Aikarthya Field Ops app.
  Triggers include: "release the app", "do a release", "new build", "publish APK",
  "push to staging", "do a prod release", "bump version", "update app_versions",
  or any mention of releasing / shipping the Android, Windows, or web build.
  This skill covers the full release workflow end-to-end: version → build → Drive upload →
  Supabase row, plus a living log of known issues and their fixes so every release
  benefits from lessons learned on prior ones.
---

# /release-aikarthya-field-ops

Full release workflow for the Aikarthya Field Ops app (Android APK + Windows zip + web zip),
uploaded to Google Drive and wired to Supabase `app_versions`.

> **Read first on every release:**
> `references/known-issues.md` — past errors and their proven fixes.
> Consult it before each step; update it when you encounter and solve a new problem.

---

## Onboarding (start here every time)

When the skill is invoked, ask these two questions together (AskUserQuestion, two items):

1. **Which backend?** Production (`nuwqxlhuxwgevxvsyusj`) or Staging (`fmmnrrjkoqsfwhbmswic`)?
   - Default to **asking** — never assume production.
2. **What version and build number?**
   - Show the current `pubspec.yaml` value so the user has context.
   - Remind them the last released build (read from `app_versions` or git tags).
   - Format: `<version>+<build>` e.g. `1.0.9+14`.

If the user invoked the skill with explicit version/build in their message, skip question 2 but still confirm the backend.

---

## Hard rules (non-negotiable)

- **GitHub releases are dormant.** Never commit APKs or zips (`*.apk`, `*.zip` are gitignored). Never create GitHub release assets. All distribution goes through Google Drive.
- **SA key (`aikarthya-field-ops-7bc128f5b085.json`) must never be committed.** It lives on the Desktop; pass it by path only.
- **Schema migrations to production: 7 PM – 9 AM IST only.** `app_versions` is a data upsert, not a schema change, and is unrestricted.
- **Always restore the prod supabase link** after temporarily linking to staging.
- **PowerShell 7 (`pwsh`) required** for `scripts/release-to-drive.ps1`. If not found at the usual path, see the known-issues reference.

---

## Step 1 — Check last release

```bash
# From aikarthya-field-ops-app/
git tag --sort=-creatordate | head -5
```

Also read `pubspec.yaml:version:` for current value. Note the last tag, version, build number, and date — you'll use these for the changelog and to validate the new build number doesn't conflict.

Check the target backend for existing rows:

```bash
cd ../aikarthya-supabase
supabase link --project-ref <ref> -p <password-from-.env>
supabase db query --linked "SELECT version, build_number, is_active FROM app_versions WHERE platform='android' ORDER BY build_number DESC LIMIT 5;"
```

Reject a new build number that already exists on the target backend.

---

## Step 2 — List changes since last release

```bash
git log <last-tag>..HEAD --oneline
git log --since="<last-release-date>" --oneline -- aikarthya-field-ops-app/
```

Group into: **Features / Fixes / Chores / Breaking changes**. Save to the release folder (Step 3).

---

## Step 3 — Create release folder and docs

```bash
# Production:
mkdir -p aikarthya-releases/releases/v<name>/
# Staging (include timestamp to avoid collisions):
mkdir -p aikarthya-releases/releases/staging-v<name>+<build>-<YYYYMMDD>/
```

Write or update these five files in the folder:

| File | Content |
|------|---------|
| `CHANGELOG.md` | Structured entries grouped by type (Features, Fixes, Chores) |
| `RELEASE-NOTES.md` | Change list, backend, version, build, date, known issues |
| `SUMMARY.md` | One-paragraph executive summary — what changed and why this ships |
| `CHECKLIST.md` | e2e test checklist with sign-off rows |
| `FEEDBACK.md` | Placeholder for reviewer feedback |

The Drive upload script expects `CHANGELOG.md`, `RELEASE-NOTES.md`, and `SUMMARY.md` in exactly these names — do not rename them.

---

## Step 4 — Bump version (production only)

For **production** releases:
1. Edit `aikarthya-field-ops-app/pubspec.yaml`: set `version: <name>+<build>`.
2. Commit: `chore(app): bump version to <name>+<build>`.
3. Push.

For **staging** releases: do **not** bump `pubspec.yaml` unless the user explicitly asks.

---

## Step 5 — Build artifacts

Working directory: `aikarthya-field-ops-app/`.

**5a. Clean:**
```bash
flutter clean
flutter pub get
```

**5b. Android APK:**
```bash
flutter build apk --release
```
Copy:
```bash
cp build/app/outputs/flutter-apk/app-release.apk \
   ../aikarthya-releases/releases/<folder>/aikarthya-field-ops-v<name>+<build>.apk
```

**5c. Windows desktop:**
```powershell
flutter build windows --release
Compress-Archive -Path "build\windows\x64\runner\Release\*" `
  -DestinationPath "..\aikarthya-releases\releases\<folder>\aikarthya-field-ops-v<name>+<build>-windows.zip"
```

**5d. Web:**
```bash
flutter build web --release
```
```powershell
Compress-Archive -Path "build\web\*" `
  -DestinationPath "..\aikarthya-releases\releases\<folder>\aikarthya-field-ops-v<name>+<build>-web.zip"
```

**5e. Record SHA-256:**
```bash
sha256sum ../aikarthya-releases/releases/<folder>/aikarthya-field-ops-v<name>+<build>.apk
```
Append to `RELEASE-NOTES.md`.

> **Build failures:** see `references/known-issues.md` → "Build-time errors" before investigating further.

---

## Step 6 — Upload to Google Drive

Run from the **repo root** (`C:\Users\KIIT0001\Desktop\Aikarthya-field-ops`):

```bash
pwsh -File scripts/release-to-drive.ps1 \
  -Version <name> \
  -Build <build> \
  -KeyFile "C:/Users/KIIT0001/Desktop/aikarthya-field-ops-7bc128f5b085.json" \
  -ApkPath     "aikarthya-releases/releases/<folder>/aikarthya-field-ops-v<name>+<build>.apk" \
  -DesktopZipPath "aikarthya-releases/releases/<folder>/aikarthya-field-ops-v<name>+<build>-windows.zip" \
  -WebZipPath  "aikarthya-releases/releases/<folder>/aikarthya-field-ops-v<name>+<build>-web.zip" \
  -ChangelogPath   "aikarthya-releases/releases/<folder>/CHANGELOG.md" \
  -ReleaseNotePath "aikarthya-releases/releases/<folder>/RELEASE-NOTES.md" \
  -SummaryPath     "aikarthya-releases/releases/<folder>/SUMMARY.md"
```

The script prints:
```
APK_FOLDER_LINK=https://drive.google.com/drive/folders/<id>
```

**Copy this URL** — it is `app_versions.download_url`.

Drive folder structure the script creates:
```
APK_Release_Folder/
  Version<name>+<build>/
    change.log          ← from CHANGELOG.md
    Release Note.md     ← from RELEASE-NOTES.md
    Summary.md          ← from SUMMARY.md
    APK/    → <apk file>
    Desktop/ → <windows zip>
    Web/    → <web zip>
```

> **Upload errors:** see `references/known-issues.md` → "Drive upload errors".

---

## Step 7 — Update Supabase app_versions

**7a. Link to the correct backend:**

| Backend | Ref | Password env key |
|---------|-----|-----------------|
| Production | `nuwqxlhuxwgevxvsyusj` | `PROD_DB_PASSWORD` in `aikarthya-supabase/.env` |
| Staging    | `fmmnrrjkoqsfwhbmswic` | `STAGING_DB_PASSWORD` in `aikarthya-supabase/.env` |

```bash
cd aikarthya-supabase
supabase link --project-ref <ref> -p <password>
```

**7b. Upsert the row:**

```sql
INSERT INTO app_versions (
  platform, version, build_number, download_url, release_notes,
  force_update, min_sdk_version, is_active
)
VALUES (
  'android', '<name>', <build>, '<APK_FOLDER_LINK>', '<one-line release notes>',
  false, 21, true
)
ON CONFLICT (platform, build_number) DO UPDATE SET
  version       = EXCLUDED.version,
  download_url  = EXCLUDED.download_url,
  release_notes = EXCLUDED.release_notes,
  force_update  = EXCLUDED.force_update,
  is_active     = EXCLUDED.is_active,
  updated_at    = NOW();
```

Run:
```bash
supabase db query --linked "<sql above>"
```

**7c. Verify:**
```bash
supabase db query --linked \
  "SELECT platform, version, build_number, is_active, left(download_url,60) FROM app_versions WHERE build_number = <build>;"
```

**7d. Restore prod link** (if you linked to staging during this release):
```bash
PROD_PW=$(grep PROD_DB_PASSWORD aikarthya-supabase/.env | cut -d= -f2-)
supabase link --project-ref nuwqxlhuxwgevxvsyusj -p "$PROD_PW"
```

> **DB errors:** see `references/known-issues.md` → "Supabase / DB errors".

---

## Step 8 — Finalize

1. Fill in `CHECKLIST.md` — mark e2e tests run, sign off.
2. Git tag (production only):
   ```bash
   git tag v<name>+<build>
   git push origin v<name>+<build>
   ```
3. Report to user:

   | Field | Value |
   |-------|-------|
   | Version | `<name>+<build>` |
   | Backend | production / staging |
   | Drive APK folder | `<APK_FOLDER_LINK>` |
   | `app_versions` row | confirmed / conflict |
   | Outstanding items | (list any) |

---

## Updating the known-issues log

When you hit a new error during a release and solve it:
1. Open `references/known-issues.md`.
2. Append an entry under the appropriate section (or add a new section) following the existing format.
3. Commit: `docs(release): log <brief-issue-title> in release known-issues`.

This keeps the log useful for the next release.
