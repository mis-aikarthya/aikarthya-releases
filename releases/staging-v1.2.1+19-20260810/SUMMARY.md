# Staging test build — 1.2.1+19, 10-Aug-2026

**This is not a release.** It is a test build for manual verification and for
recording the introduction video. It is not distributed to PFs and has no
`app_versions` row.

| Field | Value |
|-------|-------|
| Version / build | 1.2.1+19 (same code as the production release) |
| Backend | **staging** (`fmmnrrjkoqsfwhbmswic`) |
| Built with | `--dart-define=APP_ENV=staging`, release mode |
| APK SHA-256 | `f87ba5c4b9afece2eb55c08393a9cd91b79a341e5ba147b06a017291d83735f8` |
| Web | Cloudflare Pages project `stag-aikarthya` |

## Before installing on a device

The Android application id is `in.org.aikarthya.app` — the same as the
production app. Installing this build **replaces the production app on that
device**, and the local offline store carries over, so production rows stay in
SQLite while the app talks to staging. Uninstall the production app first, or
use a spare device, so the local store starts clean.

Sign in with **staging** credentials; production logins do not exist on the
staging project.

The app shows a staging banner whenever `APP_ENV` is not `production` — that
banner is the quick confirmation that you are on the staging backend.
