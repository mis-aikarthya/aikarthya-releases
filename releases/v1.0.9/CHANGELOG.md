# Aikarthya Field Ops v1.0.9 — Changelog

**Release Date:** 22-Jun-2026
**Build Number:** 13
**Previous Release:** v1.0.7+10 (21-Jun-2026)

> Bug-fix release focused on the reporting dashboard, report PDFs, and the
> SkillUp session form. No new feature surfaces.

## Fixes

### Reporting dashboard
- **Sortable columns** — every section (Queue Tickets, PF Review, Final,
  Reverted/Failed) now has clickable column headers that sort by Status, Time
  Left, Teacher, School, PF, Cycle, or Date (ascending/descending, with a
  direction arrow). Empty cells always sort last.
- **Per-section pagination** — each section paginates (10 rows/page) with a
  range indicator and prev/next controls, so sections stay responsive as the
  number of tickets grows. Pagination only appears once a section exceeds one
  page; changing the sort returns to page 1.
- **Final section** no longer shows a count badge (it is a record of completed
  work, not a worklist).

### Report PDFs
- **PDFs not displaying** — fixed cases where the in-app PDF viewer showed a
  blank page (Completed Reports, and the PF/teacher report screens). The
  download path now validates that the bytes are a real PDF (`%PDF` header) and
  the viewer surfaces a clear error and a Retry action instead of an endless
  spinner or a silent blank page.
- **Detailed Suggestions bullets** — bullets under "Detailed Suggestions for
  Improvement" now render on the same line as their text (`• suggestion`),
  with wrapped continuation lines hanging-indented, instead of the bullet
  stranded alone above its text.
- **Descriptive file names** — generated PDFs are named
  `{Programme}_Tr.{Teacher-Name}_Cycle{n}_Obs{n}_{date}.pdf`
  (e.g. `SkillUp_Tr.Akash-Das_Cycle1_Obs1_2026-06-22.pdf`) on both the Drive
  copy and the in-app/web download, replacing the previous
  `report_<uuid>.pdf`. On Flutter web the descriptive name is now readable
  because the `get-report-pdf` function exposes `Content-Disposition` via CORS.

### SkillUp session form
- **Online save fixed** — M&E Associate and Mgmt users could not save the
  SkillUp session form online (`new row violates row-level security policy for
  table "sessions"`, code 42501). These roles now have INSERT/UPDATE RLS on
  `sessions`, so all teacher session details save correctly. PF row-scoping is
  unchanged.

### Notifications
- Fixed a "ListTile background color or ink splashes may be invisible" rendering
  glitch when opening a report-review notification (the notifications sheet now
  wraps its list in a `Material` ancestor).

## Database Migrations (this release)
- `20260622000000_sessions_me_mgmt_write_policies.sql` — INSERT/UPDATE RLS on
  `sessions` for `me_associate` and `mgmt`. Applied + verified on staging and
  production (22-Jun-2026).
- `20260622010000_app_version_v1.0.9_build13.sql` — `app_versions` row for
  build 13. Applied on staging and production (22-Jun-2026).

## Edge Functions (redeployed this release)
- `finalize-report` — same-line bullets + descriptive PDF file names.
- `_shared/cors.ts` — `Access-Control-Expose-Headers: Content-Disposition`
  (propagated to all functions). All 8 functions redeployed to staging and
  production (22-Jun-2026).

## Verification
- `flutter analyze`: 0 errors, 0 warnings (info-level lints only, all
  pre-existing across the codebase).
- Backend verified live on staging and production: `sessions` policies present,
  all edge functions deployed, CORS expose-header returned on preflight.
