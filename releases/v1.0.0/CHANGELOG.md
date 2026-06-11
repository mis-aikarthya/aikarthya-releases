# Aikarthya Field Ops v1.0.0 — Changelog

**Release Date:** 11-Jun-2026
**Build Number:** 2

## Fixes in Build 2

### 1. Form Submission Reliability
- Fixed form persistence layers for observation, session, teacher, and school profile forms.
- Corrected adapter numeric casts preventing runtime `int`-to-`double` failures.
- Improved sync resilience for queued offline writes.
- Aligned school profile schema with backend expectations.

### 2. GPS and Check-In
- Resolved GPS location getting stuck on certain devices.
- Fixed geofence check-in accuracy edge cases.

### 3. RLS and Permissions
- Added missing draft DELETE policies for sessions, teachers, schools, and school_leader_profiles.
- Fixed form RLS rules so PF users can correctly submit and manage their own records.

### 4. Profile and Attendance
- Fixed profile offline rendering when Brick cache is stale.
- Made attendance upsert idempotent to stop recurring `23505` unique-constraint errors.
- Corrected last-sync display to show real device-local time.

### 5. Assessment Tab UX
- Observation form now opens from Assessment tab with selectable school and teacher.
- Forms always open as new blank entries when initiated from Assessment.

---

## New Features (Build 1 onwards)

### 1. GPS Accuracy-Gated Check-in/Check-out
- Location acquisition now waits for +/-20m GPS accuracy before auto-accepting.
- Live accuracy readout shown during acquisition with progress indicator.
- If accuracy stays poor (>20m), user is shown "Use Anyway" and "Cancel" buttons.
- Enforced one check-in + check-out per PF per local day — button disabled with
  "You have already done the attendance for the day" message after completion.

### 2. Dynamic Monthly Metrics
- Month selector now spans from earliest school onboarding month (not fixed Jan 2026).
- Remaining Offline Sessions target computed dynamically: 2 x schools active in
  programme THAT month (accounting for school deactivation dates).
- Remaining Online Sessions target: flat 2 per PF per month.
- Draft sessions no longer count toward completed metrics.
- New `deactivated_at` column on `pf_assignments` with auto-stamping trigger for
  accurate per-month school counting.

### 3. Assessment Tab Improvements
- Observation drafts are now deletable directly from the Assessment tab.
- Draft list auto-refreshes after edits and deletes.
- Removed redundant "Assessment" page header (already shown in bottom navigation).

### 4. School & School Leader Profile Forms — Critical Fix
- Fixed bug where forms showed "submitted" but created no rows in Supabase.
- Root cause: missing PF INSERT policies on `schools` and `pf_assignments` tables
  (RLS rejected writes), combined with silent error swallowing in the Flutter client.
- Added PF INSERT policy on `schools`, INSERT/SELECT on `pf_assignments`, plus
  idempotent guards for existing policies.
- Client now propagates Supabase errors when online instead of silently swallowing them.
- New school creation auto-registers PF as owner via `pf_assignments` upsert.

### 5. Database Environment Details Hidden
- Database environment info (Supabase URL, anon key) now only shown on web.
- Hidden on Android and desktop — app version and build number remain visible everywhere.

### 6. Attendance Report Fixes
- Fixed Present/Half-day miscount bug (was showing inflated counts like 3P+3HD
  instead of correct 2P+1HD). Root cause: SQL fan-out from LEFT JOIN without
  DISTINCT ON or GROUP BY on attendance date.
- New `fn_pf_month_status_v3` function with proper daily aggregation CTE.
- Calendar cells now tappable on mobile — shows a bottom sheet with date,
  status badge, check-in/out times, duration, holiday name, and leave details.

### 7. Header Notch Fix & Bottom Navigation Redesign
- Top bar now properly accounts for device notches/cutouts with SafeArea.
- Bottom navigation redesigned with modern pill indicator, equal-width touch zones,
  rounded InkWell tap targets, and soft shadow styling.

### 8. Mobile-First Design Polish
- Optimized for narrow Android screens (320-430dp width).
- Added max-width caps (640dp) for tablet readability.
- FittedBox wrapping on metric values to prevent overflow on small screens.
- Flexible greeting row with ellipsis for long names.
- Consistent 12-radius cards, standardized spacing throughout.

### 9. SkillUp Session Form — Online Mode
- Mode toggle (online/offline) moved to first question.
- School selector hidden in online mode (not applicable).
- Online sessions load all teachers across all PF-assigned schools.
- Session `school_id` made nullable for online sessions.

### 10. Forms v3 Engine — Typed-Table Offline-First Forms
- Unified schema-driven form engine powering all five PF data-collection forms.
- Each form writes directly to its domain table (observations, sessions, teachers, schools, school_leader_profiles) with status lifecycle columns (draft / submitted).
- Offline queue automatically retries submissions when connectivity returns.

### 11. Five PF Data-Collection Forms
- **Classroom Observation** — R1a/R1b/R1c scoring with 31 indicator scores, photo upload, GPS tagging.
- **SkillUp Session** — Online/offline session modes, attendance roster, school linkage.
- **Teacher Profile** — Structured teacher onboarding with lifecycle tracking.
- **School Profile** — 21-column school data capture with sections table support.
- **School Leader Profile** — Headmaster profile collection.

### 12. PF Home Dashboard
- Cycle-aware dashboard with target vs actual progress bars.
- Dynamic metrics computed from live observation data.
- Geofenced GPS check-in with debug override for testing.

### 13. In-App Updates
- Built-in APK update checker using `app_versions` table.
- Safe on web and desktop platforms (skipped gracefully).

## Database Migrations (all builds)

| Migration | Description |
|---|---|
| `20260608170000_observation_trigger_insert_fix.sql` | Fixes observation submit trigger insert logic |
| `20260609120000_pf_draft_delete_policies.sql` | PF draft DELETE RLS for all form tables |
| `20260610120000_pf_school_insert_policies.sql` | School INSERT policies for PF role |
| `20260610130000_sessions_school_id_nullable.sql` | Allows nullable school_id in sessions |
| `20260610200000_fn_pf_month_status_v3.sql` | PF monthly status function v3 |
| `20260610210000_pf_assignments_deactivated_at.sql` | Tracks assignment deactivation timestamps |
| `20260611080000_school_auto_pf_assignment_and_obs_repair.sql` | Auto PF assignment + observation repair |
| `20260611100000_fix_obs_delete_trigger.sql` | Fixes observation delete cascade trigger |

## Test Coverage
- 257 tests passing, 0 failures
- `flutter analyze`: 0 errors, 0 warnings
- New tests: GPS accuracy states (24), deactivation-date metrics (4),
  attendance detail sheet (3), month-list onboarding (3), metrics targets (3)
