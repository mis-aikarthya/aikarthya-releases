# Changelog — Aikarthya Field Ops v1.1.1+16

Range: `v1.1.0+15..v1.1.1+16` (22 commits, 132 files, +13092 / -813).

This release ships the **Super Teacher Fellowship (STF)** app layer end to end
(P0 foundations through Phase 8) plus the G01-G17 + G05/G06 roadmap gap-fix.
It is additive to the v1.1.0+15 M&E console and does not change existing PF /
M&E flows except where noted under Fixes. No STF fellows are provisioned yet,
so the STF surfaces are present but unused; STF email sending (G23) is gated on
SMTP secrets still owed by the operator.

## STF — P0 foundations

- New roles `stf_fellow` / `stf_facilitator`, STF route shell, Fellow
  provisioning form (mgmt-gated), and the shared `stf_*` table consumption in
  the app.

## STF — Phase 1 attendance

- Fellow web check-in / check-out UI + `stf_attendance` provider.

## STF — Phase 2-3 observation + OCR ticketing + SLA

- `StfSessionFormScreen` + `StfObservationFormScreen` cloned from the PF
  equivalents and rewired to STF persistence / schemas.
- `StfFacilitatorHomePage` dashboard + `stfMetricsTargetProvider`
  (context-based targets).
- Phase 3 OCR submission form + SLA dashboard.

## STF — Phase 4-5 feedback + DCR

- Fellow feedback form + route.
- DCR (Daily Class Report) journal UI with draft / submitted states,
  tap-to-resume, swipe-to-discard drafts.

## STF — Phase 6-8 impact, classroom assignments, facilitator shell

- Impact scaffolding consumption (students, assessment profile).
- Classroom assignments frontend.
- Facilitator 3-tab shell (Home / Assessments / Profile), Home resync button,
  real-month metrics, fellow list.

## STF gap-fix (G01-G17, G05/G06)

- G01/G02: send-stf-email sender drain + OCR / feedback email templates.
- G03: question engine `options` + `answer_key` jsonb (DB-side; app does not
  query these columns on PF paths).
- G05/G06: DCR partial-save (draft) + edit / delete of own drafts
  (`form_status`, `edit_count`, `last_edited_at` on `stf_dcr`; fellow UPDATE /
  DELETE RLS).
- G07: offline `stf_sessions` — `school_id` nullable, `area_name` required.
- G08: geofence gate — registered_points filtered by STF-active programmes.
- G09: SLA warning phase at 8h.
- G10: School Profile "follows govt holidays?" — School Brick field
  `followsGovtHolidays` + adapter regen + 4 persistence sites + ToggleQuestion.
- G11: me_associate can reach `/mgmt/stf` + `/add-fellow` (not `/sla`).
- G12/G13: session geo (area_lat/lng) + handout attachment captured to
  `stf_session_form_persistence`.
- G14: session form routes back to `/stf/facilitator/assessment`.
- G15: OCR `observed_teacher_id` selector (was a real functional bug — OCR
  submission always threw "missing observed teacher").
- G16: non-gap (teaching_feeling_rating already wired).
- G17: new mgmt-only `/mgmt/stf/checkins` page + `stfAttendanceOverviewProvider`
  (last 30 days).

## Fixes (PF / shared)

- SkillUp assessment cast hardening, observation submit hang, cycle bucketing,
  report attendance scope (commit `ee6a6db`).
- Prior-session UI polish across mgmt / pf_home / auth / profile + feature DOX
  docs (commit `88b9c28`).

## Web

- HTML renderer decision documented in `web/index.html` (kept `html` for
  stakeholders on insufficient internet; do not switch to CanvasKit).

## Version

- `pubspec.yaml` `1.1.0+15` -> `1.1.1+16` (patch +1, build +1, per the
  user-confirmed version-bump rule in `aikarthya-releases/AGENTS.md`).

## Backend (production, already present)

- `schools.follows_govt_holidays` and the `stf_*` tables (incl. `stf_attendance`,
  `stf_dcr` with `form_status` / `edit_count` / `last_edited_at`) are already on
  production, so the additive app changes are safe against the live prod DB.
- STF email sending remains non-functional until the operator sets
  `STF_SMTP_USER` / `STF_SMTP_APP_PASSWORD` (G23 — out of code scope).