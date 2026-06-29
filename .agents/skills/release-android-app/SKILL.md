---
name: release-android-app
description: |
  Use this skill whenever the user wants to release a new Android build of the Aikarthya Field Ops app.
  Triggers include: "release the app", "build new version", "publish APK", "update app_versions",
  "new build number", "staging release", or any Android deployment request.
  This skill determines version/build, selects backend (staging/production), builds the APK,
  uploads artifacts to Google Drive, and updates the correct Supabase app_versions table.
  Always use this skill for app release work unless the user explicitly says otherwise.
---

# release-android-app

Release the Aikarthya Field Ops Android app end-to-end.

## When to use

Use this skill when the user asks to:
- Release / publish / deploy a new Android APK
- Build a new version or build number
- Update the `app_versions` table in Supabase
- Perform a staging release or production release
- Validate / check the last release and changes since then

## Before you start

1. Read `AGENTS.md` in `aikarthya-field-ops-app/` if it exists. Observe any DOX hierarchy or binding contracts.
2. Verify the working directory is `C:\Users\KIIT0001\Desktop\Aikarthya-field-ops\aikarthya-field-ops-app`.
3. Confirm Flutter / Android toolchain is available by running `flutter doctor --android-licenses` only if needed; otherwise proceed.

## Hard rule: production schema changes

- Structural database changes (migrations) may only be pushed to production between **7 PM and 9 AM IST** (outside 9 AM–7 PM).
- Data edits / row deletions can happen at any time when required.
- During the 9 AM–7 PM window, use the **staging** database for schema work.
- This skill updates the `app_versions` table (data), so it is not a schema migration and is allowed at any time.

## Step 1 — Determine target backend

Ask the user (use AskUserQuestion if unclear):
- Which backend should this release use? **Production** or **Staging**?

Default to **Production** only if the user previously said so and the context is unambiguous. Otherwise ask.

## Step 2 — Check last release

Run:

```bash
git tag --sort=-creatordate | head -n 5
```

Capture:
- Last release tag (e.g., `v1.0.6+9`)
- Last version and build number
- Release date

## Step 3 — List changes since last release

Run:

```bash
git log <last-tag>..HEAD --oneline
```

Also run:

```bash
git log --since="<last-release-date>" --oneline -- aikarthya-field-ops-app/
```

Produce a concise markdown list of changes grouped by type:
- Features
- Fixes
- Chores / docs
- Breaking / notable changes

Save this list to a draft release notes file in `aikarthya-releases/<version>/` (create the folder later once version is known).

## Step 4 — Determine version and build number

Read `pubspec.yaml` to find the current `version:` value.

If the user explicitly provides version and build number, use those. For example: `1.0.7+10`.

If the user does **not** provide them, or the values are unclear, or they conflict with a previous release, ask with AskUserQuestion:

```
- What version name should this release use? (current: X.Y.Z)
- What build number should this release use? (last released: N)
- Should this be a patch, minor, or major bump?
```

Reject build numbers that are already present in the `app_versions` table for the target backend. If a conflict is found, ask again.

For **staging** releases, the version/build in `pubspec.yaml` does not necessarily need to be bumped, because staging builds are internal/test builds. Still confirm the desired version with the user.

## Step 5 — Update version and build number

For **production** releases:
1. Edit `pubspec.yaml` to set the new `version: <name>+<build>`.
2. Commit the version bump with message: `chore(app): bump version to <name>+<build>`.
3. Push the commit.

For **staging** releases:
1. Do **not** bump `pubspec.yaml` unless the user explicitly asks.
2. Note the build flavor or timestamp in the release folder name instead.

## Step 6 — Prepare release folder and docs

Create the release folder:

```bash
mkdir -p ../../aikarthya-releases/v<name>+<build>/
```

For staging:

```bash
mkdir -p ../../aikarthya-releases/staging-v<name>+<build>-<timestamp>/
```

Write or update:
- `CHANGELOG.md` — structured changelog entries grouped by type (Features, Fixes, Chores)
- `RELEASE-NOTES.md` — change list, backend, version, build, date, known issues
- `SUMMARY.md` — one-paragraph executive summary of what changed and why this release ships
- `CHECKLIST.md` — e2e test checklist and sign-off
- `FEEDBACK.md` — placeholder for reviewer feedback

## Step 7 — Build artifacts

1. Ensure `APP_ENV` is set correctly:
   - Production: `APP_ENV=production`
   - Staging: `APP_ENV=staging`

2. Clean and restore dependencies once:

```bash
flutter clean
flutter pub get
```

3. Build the Android APK:

```bash
flutter build apk --release
```

Copy to release folder and record checksum:

```bash
cp build/app/outputs/flutter-apk/app-release.apk ../../aikarthya-releases/<folder>/aikarthya-field-ops-v<name>+<build>.apk
```

4. Build the Windows desktop bundle and zip it:

```powershell
flutter build windows --release
Compress-Archive -Path build\windows\x64\runner\Release\* `
  -DestinationPath "..\..\aikarthya-releases\<folder>\aikarthya-field-ops-v<name>+<build>-windows.zip"
```

5. Build the web bundle and zip it:

```bash
flutter build web --release
```

```powershell
Compress-Archive -Path build\web\* `
  -DestinationPath "..\..\aikarthya-releases\<folder>\aikarthya-field-ops-v<name>+<build>-web.zip"
```

6. Record the SHA-256 checksum for the APK in the release folder.

## Step 8 — Upload to Google Drive

> **GitHub releases are dormant.** Do **not** commit APKs or zips to the repository
> (`*.apk` and `*.zip` are gitignored) and do **not** create GitHub release assets.
> All distribution happens through the shared Google Drive folder.

Run `scripts/release-to-drive.ps1` using PowerShell 7 (`pwsh`) from the repo root.
Supply the version/build, all three artifact paths, the three doc paths, and the
service-account key file (`<sa.json>` is a local secret — never commit it):

```powershell
pwsh -File scripts/release-to-drive.ps1 `
  -Version <name> `
  -Build <build> `
  -ApkPath     "aikarthya-releases/<folder>/aikarthya-field-ops-v<name>+<build>.apk" `
  -DesktopZipPath "aikarthya-releases/<folder>/aikarthya-field-ops-v<name>+<build>-windows.zip" `
  -WebZipPath  "aikarthya-releases/<folder>/aikarthya-field-ops-v<name>+<build>-web.zip" `
  -ChangelogPath  "aikarthya-releases/<folder>/CHANGELOG.md" `
  -ReleaseNotePath "aikarthya-releases/<folder>/RELEASE-NOTES.md" `
  -SummaryPath "aikarthya-releases/<folder>/SUMMARY.md" `
  -KeyFile "<sa.json>"
```

The script prints a line of the form:

```
APK_FOLDER_LINK=https://drive.google.com/drive/folders/...
```

Copy that URL — it is the value you will use for `app_versions.download_url` in the next step.

## Step 9 — Update Supabase app_versions table

1. Link to the correct backend project:

- Production ref: `nuwqxlhuxwgevxvsyusj`
- Staging ref: `fmmnrrjkoqsfwhbmswic`

```bash
cd ../aikarthya-supabase
supabase link --project-ref <ref>
```

2. Insert or update the `app_versions` row, using the `APK_FOLDER_LINK` URL printed by
   `scripts/release-to-drive.ps1` in Step 8 as `<download_url>`:

```sql
INSERT INTO app_versions (build_number, version_name, download_url, mandatory, created_at, updated_at)
VALUES (<build>, '<name>', '<APK_FOLDER_LINK>', false, now(), now())
ON CONFLICT (build_number) DO UPDATE SET
  version_name = EXCLUDED.version_name,
  download_url = EXCLUDED.download_url,
  updated_at   = EXCLUDED.updated_at;
```

Run it with:

```bash
supabase db query --linked "<sql above>"
```

3. Verify:

```bash
supabase db query --linked "SELECT * FROM app_versions WHERE build_number = <build>;"
```

## Step 10 — Finalize

1. Mark `CHECKLIST.md` and `FEEDBACK.md` as complete (or note any outstanding items).
2. Report to the user:
   - Version and build
   - Backend used
   - Drive APK folder URL (`APK_FOLDER_LINK`)
   - `app_versions` row status
   - Any blockers or manual steps needed

## Important notes

- Always verify that the `app_versions` table is updated on the **same backend** the app release points to (staging release → staging DB; production release → production DB).
- Do **not** push schema migrations to production between 9 AM and 7 PM IST. This skill only touches the `app_versions` data table, so it is not restricted by that rule.
- If the user asks to also change database schema as part of the release, stop and use the `update-database-aikarthya-field-ops` or migration workflow, respecting the time-bound rule.
