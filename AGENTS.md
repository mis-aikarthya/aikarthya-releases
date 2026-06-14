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

## Verification

## Child DOX Index

- No nested AGENTS.md files yet. This file directly owns every path under `aikarthya-releases/`.
