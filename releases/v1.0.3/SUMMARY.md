# Aikarthya Field Ops v1.0.3 — Summary

## What's New
- School Profile: year-only "Programme Start Year" picker and a new School Logo upload.
- School Leader: required leader name, consent-aware photo guidance, 1–2 qualification
  multi-select, and years-and-months duration fields (stored as decimals).
- Teacher: same photo/qualification/duration updates, plus comma-separated free text for
  "Other" and "Other Regional Language" subjects.
- Forms engine: min/max multi-select, a years-and-months duration question, and
  option-driven conditional fields.

## Fixes
- Classroom Observation submit no longer fails with the RLS 42501 error on Android/Windows
  (removed a double-write and guarded empty UUID values; added an explicit policy WITH CHECK).

## Database Changes
- 2 migrations: PF UPDATE policy WITH CHECK fix; add `leader_name` and move four duration
  columns to `numeric(4,2)`.

## Tests
- 276 passing, 0 failing.
