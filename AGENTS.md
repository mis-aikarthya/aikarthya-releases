# AGENTS.md - aikarthya-releases

## Purpose

- Owns versioned release records for Aikarthya Field Ops.

## Ownership

- `releases/<version>/CHANGELOG.md` owns user-facing change history for that release.
- `releases/<version>/SUMMARY.md` owns the concise release summary, database-change summary, and test status.
- `audit-design-studio.md`, `audit-flutter-frontend.md`, `feature-ideation.md` are
  root-level historical notes from past audits/ideation sessions, kept for reference —
  not part of the versioned release record and not updated per release.

## Local Contracts

- Follow the workspace root AGENTS.md before editing this repo.
- Release records must match the built APK/app version and the deployed backend state they describe.
- Keep release notes factual and dated. Do not use them to replace phase reports, locked decisions, or API contracts.
- No secrets, private keys, or real PII belong in release records.
- **Version folder naming has drifted**: early releases use plain semver (`v1.0.0` ..
  `v1.0.9`); the most recent uses build metadata (`v1.1.0+15`). Do not rename existing
  folders (their APK download URLs and `app_versions` DB rows already reference the exact
  path) — new releases should default to plain semver (`vX.Y.Z`) unless a build number is
  needed to disambiguate two builds of the same version, as happened with v1.0.5 below.
- `v1.0.5/` contains two APKs (`..._V1.0.5.apk` and `..._V1.0.5_build6.apk`) from before
  the build-number naming convention existed — both are kept for history; do not delete
  either without checking which one `app_versions.download_url` actually points to.
- **Version bump rule** (user-confirmed 03-Jul-2026): each release increments the patch
  by 1 (`1.1.0+15` -> `1.1.1+16`); when the patch reaches 9, the next release rolls the
  minor and resets the patch to 0 (`1.1.9` -> `1.2.0`), never skipping a minor (NOT
  `1.1.9` -> `1.3.0`). The build-number suffix (`+N`) increments by 1 every release
  regardless of the X.Y.Z bump. Major-roll at minor 9 (e.g. `1.9.9` -> `2.0.0`) is the
  analogous extension but was not explicitly confirmed — ask the user when first reached.
- **Web version alignment** (from v1.1.1+16, 03-Jul-2026): the web/PWA build ships at the
  SAME `app_versions` version as APK + Windows (web `1.1.1+16`, android `1.1.1+16`,
  windows `1.1.1+16`). Earlier releases split the web build off at `+N-1` (e.g. APK
  v1.1.0+15 vs web v1.1.0+14) because web was deployed in a separate step; that split is
  no longer used. The web `app_versions` row remains bookkeeping only (web is served
  live from Cloudflare Pages, not installed), and the Drive upload omits `-WebZipPath`
  unless a web bundle artifact is explicitly needed for a release.

## Work Guidance

- Use one folder per release version.
- Preserve previous release records; create a new version folder for new releases.
- Mention test counts and `flutter analyze` status only when they were actually verified for that release.
- Record the target environment in `SUMMARY.md`. A production release is built with
  `--dart-define=APP_ENV=production` against the production Supabase project; staging
  builds are for testing only and are not distributed as releases. Before building any
  release APK, confirm production vs staging with the user (root AGENTS.md Release-build rule).

## Verification

## Child DOX Index

- No nested AGENTS.md files yet. This file directly owns every path under `aikarthya-releases/`.
