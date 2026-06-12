# Aikarthya Field Ops v1.0.1 — Changelog

**Release Date:** 12-Jun-2026
**Build Number:** 1

## New Features

None in this patch release.

## Fixes

### 1. Android CAMERA permission added; storage permissions cleaned up
- Added `android.permission.CAMERA` to `AndroidManifest.xml` so image picker works reliably on Android 10+.
- Removed unnecessary `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions that caused Play Store policy warnings.

### 2. Exclude draft schools from PF school list
- When a PF starts a School Profile form but has not yet submitted it, the school gets auto-assigned to them (`trg_schools_auto_pf_assignment`).
- Previously this unsubmitted-draft school would appear in the PF's "My Schools" list, even though it had no valid data.
- `PfSchoolsNotifier` now filters out any school whose `form_status = 'draft'` both on the Brick offline path and the Supabase web path.

### 3. Observation form `started_at` field now mirrored to Supabase
- `ObservationFormPersistence._mirrorToSupabase` now writes the `started_at` column (populated from `created_at` at the moment the form is first saved).
- Ensures the cloud `observations` row has the same lifecycle timestamp as the local Brick record.

### 4. Observation form `_mirrorToSupabase` error handling simplified
- Removed the inner `try/catch` that swallowed Supabase errors silently.
- Failures now propagate so the offline queue can retry, and Sentry can capture the exception.

## Database Migrations (this release)

| Migration | Description |
|---|---|
| `20260611160000_cascade_school_lifecycle_children.sql` | Cascade lifecycle updates from schools to teachers, sessions, and observations |
| `20260611140000_fix_schools_select_for_upsert.sql` | Fix `schools` SELECT policy for upsert by PF |
| `20260611120000_fix_schools_pf_insert_drop_ownership.sql` | Drop ownership requirement on PF-inserted schools |
| `20260611100000_fix_obs_delete_trigger.sql` | Fix observation DELETE trigger for offline queue |
| `20260611080000_school_auto_pf_assignment_and_obs_repair.sql` | Auto-assign PF on school draft creation; repair observation Rubik columns |
| `20260610210000_pf_assignments_deactivated_at.sql` | Track `deactivated_at` on PF assignments |
| `20260610200000_fn_pf_month_status_v3.sql` | v3 of `fn_pf_month_status` with holiday/weekly-off awareness |
| `20260610130000_sessions_school_id_nullable.sql` | Make `school_id` nullable in sessions for online/offline flexibility |
| `20260610120000_pf_school_insert_policies.sql` | Allow PF to insert schools with RLS guardrails |
| `20260609010000_app_versions_table.sql` | Create `app_versions` table for in-app update checking |
| `20260608220000_forms_v3_schema_gaps.sql` | Fill schema gaps for Forms v3 (attendance roster, signature, etc.) |
| `20260608170000_observation_trigger_insert_fix.sql` | Fix observation INSERT trigger for Brick sync |
| `20260608160000_observation_photo_path.sql` | Add `photo_path` column to observations |
| `20260608124801_form_types_route_names.sql` | Add route-name metadata to form types registry |
| `20260608000000_forms_v3_session_globals.sql` | Session globals table for Forms v3 |
| `20260604213004_add_fn_pf_month_status.sql` | Add `fn_pf_month_status` helper function |
| `20260604213003_enhance_leaves_table.sql` | Enhance leaves table with PF-specific fields |
| `20260604213002_add_weekly_offs_table.sql` | Add weekly offs table |
| `20260604213001_add_holidays_table.sql` | Add holidays table |
| `20260604030000_school_schema_cleanup_and_trigger_fix.sql` | School schema cleanup and trigger fix |
| `20260604012012_indian_admin_boundaries.sql` | Indian admin boundaries (states, districts, blocks) |
| `20260604012011_add_draft_date.sql` | Add `draft_date` tracking to domain tables |
| `20260603130000_profile_employment_status.sql` | Add `employment_status` to teacher / school leader profiles |
| `20260603111826_placeholder.sql` | Placeholder migration for ordering |
| `20260603104927_add_school_profile_columns.sql` | Add School Profile v3 columns |

## Test Coverage
- 257 tests passing, 0 failures
- `flutter analyze`: 0 errors, 0 warnings

---
*Previous build notes preserved below:*

## Build 2 (v1.0.0) — 11-Jun-2026
- Camera permission fix, storage permission cleanup.

## Build 1 (v1.0.0) — 11-Jun-2026
- Initial public release.
- Forms v3: Classroom Observation, SkillUp Session, Teacher Profile, School Profile, School Leader Profile.
- PF Home: cycle dashboard, geofence check-in, assessment tab with records & surveys, drafts, submitted.
- Offline-first via Brick + Supabase sync.
- In-app update checker.
