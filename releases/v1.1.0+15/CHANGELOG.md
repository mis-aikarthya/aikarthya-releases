# Changelog — Aikarthya Field Ops v1.1.0+15

Released 2026-07-01. Covers all work since the last Android release (v1.0.9+13,
commit `bc76e4d`): 80 commits spanning the M&E Management Console (AIK-7..42),
Round 3 follow-up, reporting SLA report, in-app updater rework, new logo, and
the PWA web build.

This is the **Android + Windows desktop** release. The web/PWA build was
released separately at v1.1.0+14 (Cloudflare Pages) and is excluded here.

## Features

### M&E Management Console (AIK-7..42)
- AIK-7: PF KPI provider — unblocks dashboard + team PF metrics.
- AIK-8: SkillUp Overview page — stat cards + reports-queued brief.
- AIK-9: shared Dashboard filters (cycle/context/school) — unblock charts.
- AIK-10: School Data list — unblocks school profiles.
- AIK-11: Team roster + member detail scaffold — unblocks C11–C15 and C16 WDR.
- AIK-12: shared attendance calendar + Work Days Rewind scaffold.
- AIK-13: PF 30-min location capture to `location_pings` via Brick offline queue.
- AIK-14: PF current-location provider — unblocks overview location table.
- AIK-15: SkillUp Overview area OSM map + school hover/tap card.
- AIK-16: SkillUp Dashboard charts band — five filter-aware charts.
- AIK-17: SkillUp Dashboard PF performance table — sortable, row-tap → profile.
- AIK-18: SkillUp Dashboard individual PF profile — targets vs achievements.
- AIK-19: School Data school profile page — per-school KPIs + analytics.
- AIK-20/DOX-C11: Team per-PF attendance viz — reuse shared calendar + month status.
- AIK-21: Team member detail per-PF KPI panel (C12).
- AIK-22: Team member admin edit (C13) — profile/role/active/form-access via mgmt RLS.
- AIK-23: assign/unassign schools to a PF (C14) + redesign + nested-nav fix.
- AIK-22 redesign: C13 form access — assigned list + dialog + Deactivate/Activate.
- AIK-24: complete password recovery flow — admin reset + app-side finish.
- AIK-25: Work Days timeline — selected-day events.
- AIK-26: C3 PF current-location table on SkillUp Overview — staleness chips.
- AIK-27: C17 Work Days Rewind trail map — PF day trail on OSM.
- AIK-28: route Android location pings through direct-insert path; resume
  checked-in pings after restart (cold-start auth rehydrate); round2 verifier test.
- AIK-29: Overview map collapsible + PF check-in dot hover/tap popups.
- AIK-30: C1 stat cards rework + "Programme Fellow" rename.
- AIK-31: Work Days Rewind button on each PF current-location row.
- AIK-32: Dashboard filter bar collapsible + Context + School multi-select.
- AIK-33: rebuild dashboard charts with Syncfusion — dynamic, context-aware,
  fixed inverted bars + cumulative obs target; switch attendance pie on cycle.
- AIK-34: compact attendance heatmap at Work Days Rewind — shared widget.
- AIK-35: surface school_profile fields + programmes on C9, Students on C8.
- AIK-36: Team roster last-login + client platform + app version.
- AIK-37: background location capture (foreground service + WorkManager),
  env-driven ping cadence (2 min staging/debug, 30 min production).
- AIK-38: write the check-in event itself as a `location_pings` row; stop
  spurious check-in error + land the anchor ping.
- AIK-39: PF performance table polish + shared table kit; Teacher Reach as a
  custom 3-column chart with turnaround arrows.
- AIK-40: PF profile lint cleanup + school visit log test.
- AIK-41: Team per-PF attendance — WDR button to top + shared heatmap.
- AIK-42: Work Days Rewind full-year status heatmap (replaces compact calendar),
  prominent colours + merged top placement.

### Reporting SLA report
- PfSlaReport model + `syncfusion_flutter_pdf` dependency.
- `computePfSlaReport` pure SLA logic + boundary regression tests.
- `pfSlaReportProvider` Supabase fetch + delegate.
- `SlaReportPdfBuilder` one-page PDF renderer.
- `sharePdfBytes` helper for client-generated PDFs.
- Download SLA Report button on PF profile.

### Round 3 + follow-up
- Leave, notifications, session registries, Grow/Glow, Drive images, School
  Profile polish.
- Round-3 follow-up: tables, reports queue, null-school hardening, PWA web.
- Download SLA Report button on PF profile.

### In-app updater rework
- Open Drive download page instead of in-app install.
- Remove native APK installer + install permission.
- Remove dead in-app-update package-installer queries.
- Purge stale in-app-installer DOX + dead install-permission code.

### Branding
- Apply new app logo across Android, web, and Windows desktop.

### Web/PWA (separate release v1.1.0+14 — noted for completeness)
- Same Flutter codebase shipped as a PWA on Cloudflare Pages (mgmt console + PF).

## Fixes
- Null `school_id` no longer crashes `mgmtPfKpiProvider` (hard `as String` cast).
  Online programme-level sessions legitimately have `school_id = NULL`; the app
  now tolerates this across the shared observation record signatures.
- Reports Queue pipeline relabeled: "Awaiting M&E review" → "Awaiting PF
  review" (the real review stage is PF review). `pf_review` reports are now
  counted (previously dropped); `reverted` folded into "Awaiting generation";
  totals are now real.
- Mobile table hardening (PF Performance + PF Current Location) — columns
  keep natural width with horizontal scroll on phones (LayoutBuilder +
  min-width floor + real `Table` with `columnWidths`).
- Check-in no longer silently breaks when GPS fails; valid UUID generated
  client-side for attendance check-in.

## Chores
- Version bump to 1.1.0+15 (android/windows); 1.1.0+14 (web).
- Dead in-app-installer code removal.
- New logo applied across platforms.
- e2e harness + screen-health diagnostics (test infrastructure).