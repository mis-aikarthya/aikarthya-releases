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
> the previous build and will run four new local migrations on first launch
> (`20260806100201`, `20260807075013`, `20260807215904`, `20260809194043`).

> **Web/PWA** is deployed to `app-aikarthya.pages.dev` (Cloudflare Pages
> Production, branch `main`). `force_update = false`: the in-app updater offers
> the Drive download page and is dismissible.

## Artifacts

| Artifact | Size | SHA-256 |
|----------|------|---------|
| `aikarthya-field-ops-v1.2.1+19.apk` | 103.2 MB | `3d0a8ce42b119ecf245265c2606f21e72130dc1aa51a6a36b9ed527578751f14` |
| `aikarthya-field-ops-v1.2.1+19-web.zip` | 22.1 MB | `b2fa5dca09f90e1e13a244365ac89c3ef6f6be3df2fe1b57b8d828cea04be367` |

**Windows is not part of this release.** It builds clean at this commit
(`flutter build windows --release`, 10-Aug-2026) but is out of scope by the
operator's decision — PFs are on Android and the web PWA, so only those two
platforms are published and only those two carry an `app_versions` row. The
last Windows build distributed remains v1.2.0+18.

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
- **PF home + planner corrections (10-Aug-2026, post-build)** — three fixes
  raised off an emulator run of the first build:
  - The PF home "Per-School Progress" empty card claimed "No schools assigned
    yet" whenever the list came back empty. It comes back empty for two
    different reasons, and the second one — schools assigned but their
    `school_cycles` rows not synced — made the message false. The card now says
    "Cycle data for your schools has not synced yet" when schools do exist.
  - `SchoolProgressCard` gained a **Visits** bar (completed `school_visits`
    over the cycle's `visits_planned`, falling back to `VisitMath.visitCount`
    for pre-`20260808100300` rows), and the sessions bar is now explicitly
    **Offline Sessions** (`mode == 'offline'`); online sessions have a NULL
    `school_id` and stay on `OnlineSessionsCard`. `status` now accounts for
    visits too.
  - The visit planner's **Cards view was removed** — the calendar is the only
    view. The AppBar toggle and five cards-only widgets went with it; pace and
    the at-capacity warning already live on the cycle summary rail/footer, and
    the visit pool is still reachable from the scheduler sheet.

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
  `CHECKLIST.md`. The in-place **upgrade** path has been proven on an emulator
  (v1.2.0+18 to v1.2.1+19: all four Brick migrations applied clean, session
  carried over, home screen rendered) — the planner screens themselves have not.
- Unrelated latent defect found while running that upgrade test: killing the app
  mid-way through its first-launch migration chain leaves the local store
  permanently unopenable (`duplicate column name` on every retry), because Brick
  stamps a migration only after all its commands succeed. Pre-existing, not from
  this release, and it contradicts the self-heal claim in `lib/brick/AGENTS.md`.
  Filed separately.
- `aikarthya-supabase` ships this backend from branch `stf-project-integration`,
  not `master`.
