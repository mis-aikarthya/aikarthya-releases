# Aikarthya Field Ops v1.0.7 — Changelog

**Release Date:** 21-Jun-2026
**Build Number:** 10
**Previous Release:** v1.0.6+9 (17-Jun-2026)

## New Features

### AI Observation Reporting Pipeline (Specs A–G)
- **Scoring v2** — quick-check averages contribute three new Student Learning indicators.
- **Report Generation Studio** — chat-first layout (observation left, agentic chat centre,
  controls + live report preview right); resizable right panel.
- **Live streaming** — SSE streaming client renders report text as it generates; supports
  web streaming via `fetch_client`.
- **Prompts & templates** — two-prompt system stored in the DB; report template management
  with locking and a PDF template selector.
- **PF review flow** — PF review/approve pipeline, revert-with-comment, re-review handling,
  draft version multi-select/delete.
- **Notifications & PDF** — live notification refresh, report-list auto-invalidate on
  re-review, PDF generation + share (web/stub split).
- **Queue dashboard** — filters, sortable table, pagination, nav-panel integration, stats strip.
- **Report formatting** — Evidence-of-Learning structure, band words removed, growth-analysis
  section, header shows cycle / observation # / attendance.

### M&E Associate Console
- `me_associate` and `mgmt` now share the `/mgmt/*` console; `MgmtAccess` is the single
  source of truth for the per-role route allow-list and landing route.
- Landing routes: `mgmt → /mgmt/home`, `me_associate → /mgmt/personal` (retires `/me`).
- New **Personal page** (both roles): identity header, greeting, non-geofenced check-in,
  shared quick-action bar.
- **Non-geofenced attendance** via a separate `staffCheckInProvider` + `StaffCheckInCard`
  (PF geofenced check-in untouched).
- **Completed Reports** page (status released/shared) with PDF view + download.
- **Org-wide default reporting model** backed by the new `app_settings` table; mgmt can
  save the default, `me_associate` can override per session.
- **Responsive console** — single shell with a ~900px breakpoint; Drawer nav + SafeArea
  header on narrow screens.

## Fixes
- Reporting studio bug-fix passes: inline editing, rating wrap, chat send flow, resize cursor
  scoped to the divider, finite-width save actions, layout-cascade prevention on preview open.
- Router: `me_associate` home corrected to `/mgmt/personal` (tests updated).

## Database Migrations (this release)
- `20260620110000_app_settings.sql` — org-wide key/value settings; seeds
  `reporting_default_model`. Applied + verified on staging and production (21-Jun-2026).

## Tests
- All 490 widget/unit tests passing.
