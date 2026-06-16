# AGENTS.md - aikarthya-releases

## Purpose

- Owns versioned release records for Aikarthya Field Ops.

## Ownership

- `releases/<version>/CHANGELOG.md` owns user-facing change history for that release.
- `releases/<version>/SUMMARY.md` owns the concise release summary, database-change summary, and test status.

## Local Contracts

- Follow the workspace root AGENTS.md before editing this repo.
- Release records must match the built APK/app version and the deployed backend state they describe.
- Keep release notes factual and dated. Do not use them to replace phase reports, locked decisions, or API contracts.
- No secrets, private keys, or real PII belong in release records.

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
