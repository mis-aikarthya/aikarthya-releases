# Aikarthya Field Ops v1.0.3 — Changelog

**Release Date:** 12-Jun-2026
**Build Number:** 3

## New Features

### 1. Form field updates across School, School Leader, and Teacher forms
- **School Profile**: "Programme Start Year" is now a year-only calendar picker;
  added a **School Logo** image question (uploaded to storage and saved on the
  school record).
- **School Leader Profile**: added a required **"Name of the School Leader"**
  field; the photo question now carries guidance to use a passport-style image
  and to take verbal consent; **Highest educational qualification** became a
  1–2 option multi-select (B.Ed, M.Ed, MA, M.Sc, BA, B.Sc, D.El.Ed, Ph.D, and
  Other-specify); "Years in designation" and "Years in this school" now collect
  **years and months** and store the decimal equivalent (e.g. 1 year 9 months =
  1.75); the nominee question was reworded to "Has SL nominated any Point of
  contact person?" with its section header removed.
- **Teacher Profile**: the same photo guidance, 1–2 qualification multi-select,
  and years-and-months duration fields; "Other Regional Language" and "Other"
  subjects now capture comma-separated free text.

### 2. Forms engine enhancements
- Multi-select questions support a minimum/maximum number of selections.
- A new years-and-months duration question type.
- Conditional fields can now react to a specific option being chosen inside a
  multi-select (used for the "Other (specify)" follow-up fields).
- The year-only date picker now correctly records the scrolled selection and
  prevents selecting a future year.

## Fixes

### 1. Classroom Observation submit failed with RLS error (42501)
- Submitting a Classroom Observation failed on Android/Windows with a
  row-level-security error. Root causes: a double-write to Supabase on Brick
  platforms (the offline-first repository already syncs the row), and an empty
  string being sent to a non-null UUID column during early autosave.
- Fix: write the row exactly once on Brick platforms; guard incomplete drafts
  and show a clear message on incomplete submit. A companion database policy fix
  added an explicit `WITH CHECK` so the draft → submitted transition is allowed.

## Database Migrations (this release)

| Migration | Description |
|---|---|
| `20260612090000_fix_pf_update_with_check.sql` | Add explicit `WITH CHECK` to the PF UPDATE policies on `observations` and `form_submissions` so draft → submitted submits succeed. |
| `20260612120000_form_field_updates.sql` | Add `school_leader_profiles.leader_name`; move the four duration columns (`years_in_designation`, `years_in_school`, `teaching_experience_years`, `years_at_school`) from `int` to `numeric(4,2)` for decimal years. |

## Test Coverage
- 276 tests passing, 0 failures
- `flutter analyze`: 0 errors, 0 warnings (info-level lints only)
