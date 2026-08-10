# Changelog — Aikarthya Field Ops v1.2.1+19

40 commits since v1.2.0+18. Grouped by type.

## Features

**PF Visit Planner (new surface)**
- feat(planner): PF visit planner with suggestions, sanctions and cycle visit maths
- feat(planner): school-name short-forms (W3) + 2-symbol boundary glyphs (W4)

**Working-day observation cycles**
- feat(cycles): add SchoolCycle Brick model for offline cycle dates
- feat(cycles): add stored-cycle lookup API and provider
- feat(cycles): add Mgmt and M&E school closure logging screen
- feat(cycles): show working and non-working day counts on consolidated report

**Mgmt / M&E console**
- feat(mgmt): cycle planner, visit sanction review and PF analytics surfaces
- feat: complete management reporting dashboards
- feat: add school consolidated reports page
- feat: load school consolidated reports
- feat: refine school reports table
- feat: derive school report review states
- feat: refine school report review table
- feat: give M&E programme access

## Fixes
- fix(pf-home): stop claiming "no schools assigned" when it is unsynced cycle data
- fix(pf-home): show visits, observations and offline sessions on the school card
- fix(planner): drop the Cards view; the calendar is the only planner view
- fix(brick): stop re-adding Observation.next_step in the VisitSuggestion migration
- fix(cycles): resolve observation cycle from synced rows, not the ambiguous view
- fix(cycles): do not claim recalculated dates when the cycle pull failed
- fix(stf-session): survive null fellow_id grants and prune roster on context switch

## Refactors
- refactor(cycles): read stored cycle boundaries instead of 45-day arithmetic

## Tests
- test(planner): make the cycle-summary rail tests date-independent

## Chores
- chore(app): bump version to 1.2.1+19

## Docs
- docs(cycles): the 42-working-day rule now applies from cycle 1
- docs(dox): record the stored working-day cycle contract
- docs(dox): correct stale v_school_cycles boundary-date claim in forms rail
- docs(dox): correct the v_school_cycles avoidance rationale
- docs: define / plan school consolidated reports
- docs: define / plan / correct school report review workflow
- docs: define / plan / refine school reports table
- docs: define teacher consolidated reports
- docs: define / plan STF context sections
- docs: plan STF fellow details
- docs(stf): specify and plan overview KPI redesign

## Backend

30 Supabase migrations (`20260807100000` through `20260812160000`) are promoted to
production as part of this release. See
`aikarthya-docs/checklists/db-edit-plan-2026-08-10-visit-planner-prod-promotion.md`.
The app code at this version cannot run against the pre-promotion production schema.
