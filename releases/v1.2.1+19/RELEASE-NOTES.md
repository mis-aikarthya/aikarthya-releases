# Release Notes — Aikarthya Field Ops v1.2.1+19

| Field | Value |
|-------|-------|
| Version | 1.2.1 |
| Build | 19 |
| Platforms | Android (APK), Windows desktop (zip), Web/PWA (Cloudflare Pages) |
| Backend | production (`nuwqxlhuxwgevxvsyusj`) |
| Date | 2026-08-10 |
| Previous release | v1.2.0+18 (offline-sync + mgmt console overhaul; 2026-07-24) |
| Commits since previous | 40 |
| Android application id | `in.org.aikarthya.app` (unchanged — in-place upgrade over v1.2.0+18) |
| Supabase `app_versions` rows | android 1.2.1+19, windows 1.2.1+19 (force_update = false) |
| Web `app_versions` row | web 1.2.1+19 (bookkeeping only; web is served live) |

> **Backend promotion required.** This build reads tables that do not exist on
> production before this release: `school_visits`, `visit_suggestions`,
> `school_cycles`, `visit_sanction_requests`, `school_holidays_closures`,
> `pf_office_days`. Thirty migrations (`20260807100000`–`20260812160000`) are
> promoted in the same window, moving the prod ledger from 186 rows to 216. Plan
> and sign-off:
> `aikarthya-docs/checklists/db-edit-plan-2026-08-10-visit-planner-prod-promotion.md`.

> **In-place upgrade.** The Android package is unchanged from v1.2.0+18, so this
> installs over the existing app. Devices carry a local Brick SQLite store from
> the previous build and will run three new local migrations on first launch.

> **Web/PWA** is deployed to `app-aikarthya.pages.dev` (Cloudflare Pages
> Production, branch `main`). `force_update = false`: the in-app updater offers
> the Drive download page and is dismissible.

## Artifacts

| Artifact | Size | SHA-256 |
|----------|------|---------|
| `aikarthya-field-ops-v1.2.1+19.apk` | _pending build_ | _pending build_ |
| `aikarthya-field-ops-v1.2.1+19-windows.zip` | _pending build_ | _pending build_ |
| `aikarthya-field-ops-v1.2.1+19-web.zip` | _pending build_ | _pending build_ |

## What changed

See `CHANGELOG.md` for the full grouped list. Highlights:

- **PF Visit Planner (new surface)** — month calendar, scheduler sheet, visit
  editor, suggestion detail, visit pool, absence logging, move-visit, cycle
  summary rail. Real visits (`school_visits`) are separated from system proposals
  (`visit_suggestions`): acting on a suggestion withdraws it and re-spaces the
  rest. Early visits and visits on a logged closure route through a management
  sanction request with a reason. Visit counts follow
  V = max(2, ceil(teachers / 7)), spaced 14 calendar days from cycle 2.
- **Working-day observation cycles** — a cycle is 42 **working** days stored in
  `school_cycles`, applied from cycle 1 with no cutover seam, replacing 45
  calendar days. Holidays and closures move visits. `SchoolCycle` Brick model
  resolves cycle dates offline; cycle resolution reads synced rows instead of the
  ambiguous `v_school_cycles` view. Consolidated reports show working versus
  non-working day counts. A failed cycle pull no longer reports recalculated
  dates the app does not have.
- **Mgmt / M&E console** — cycle planner, visit sanction review queue, PF
  analytics panel, team overview band, school closure logging, school
  consolidated reports with a review-state workflow and table, teacher
  consolidated reports, M&E programme access.
- **Ship blocker caught pre-release** — the generated Brick migration for
  `VisitSuggestion` also re-added `Observation.next_step`, which already exists
  (created earlier by rename). It would have thrown `duplicate column name` on
  every upgrading device, killing the offline store before the app opened.

## Quality gates

- `flutter analyze` — 1010 issues, **0 errors, 0 warnings** (all info-level style
  lints, overwhelmingly in pre-existing test files).
- `flutter test` — **1393 passed, 0 failed.** The first run failed twice: the
  Brick migration blocker above, and a date-flaky planner rail test that anchored
  suggestion dates to the current month while the rail drops past-dated
  suggestions. Both fixed; the migration guard test stays.

## Known issues / notes

- Signed with the debug keystore (existing `build.gradle.kts` TODO), same key as
  v1.2.0+18 for this package — future updates must keep the same signing key.
- Devices still on v1.2.0+18 keep working through the promotion window, but their
  cycle boundary dates shift on next sync (45 calendar days becomes 42 working
  days) before they have the build that explains why.
- The PF planner surfaces are new and have not had a real-device test pass; see
  `CHECKLIST.md`.
- `aikarthya-supabase` ships this backend from branch `stf-project-integration`,
  not `master`.
