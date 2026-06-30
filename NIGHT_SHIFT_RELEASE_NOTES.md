# Night Shift -- Release Notes (Round 1 + 2 + 3)

Branch: `night-shift/me-mgmt-dashboard` -> one human PR to `main` at the end.
Source plans: [NIGHT_SHIFT_ROUND2_PLAN.md](NIGHT_SHIFT_ROUND2_PLAN.md),
[NIGHT_SHIFT_ROUND3_PLAN.md](NIGHT_SHIFT_ROUND3_PLAN.md).

This document is the **staging -> prod PROMOTE brief**. It inventories every
change on the night-shift branch, lists the **exact migration delta** prod will
receive (in apply order), scans for conflict/risk, and gives a
**non-destructive recovery** for each change. Read this before merging or
touching prod.

**Status (as of last edit):** all Round 3 backend + app issues except the
merge/release are DONE on staging and the app. **Web/PWA dropped this round
(AIK-51 / AIK-52); release ships APK + Windows desktop only.** Nothing has been
pushed to prod or merged to main -- that is the human-gated R3-R1 step
(AIK-54).

A **Round-3 follow-up pass** (Linear AIK-57) added two more staging migrations
(`20260701000000_sessions_grow_glow.sql`, `20260701000001_observation_photo_path_rpc.sql`),
two new Edge Functions (`upload-observation-images`, `backfill-observation-images`),
one new secret (`GOOGLE_DRIVE_OBSERVATION_IMAGES_DRIVE_ID`), a `photo_path`
semantics change (JSON array of Drive file ids), and one optional DML backfill
(`cycle_number`). These extend the prod delta from 10 to **12 migrations** -- see
section 2 rows #11/#12 and section 7. Staging latest applied is now
`20260701000001`.

> **NEEDS-HUMAN** before PROMOTE: (1) on-device smoke test of the app changes
> (the user reviews each issue); (2) the prod migration is time-bound
> 7 PM - 9 AM IST only; (3) one human PR to `main`, not a bot push.

---

## 1. Round-by-round change inventory

### Round 1 -- M&E Management console (Linear AIK-6 .. AIK-27)
Built the shared Management console + frontend from scratch on one branch.
App-only (no migrations this round). Change areas:
- Console shell: fixed header (`mgmt_header.dart`), floating left nav
  (`mgmt_nav_panel.dart`), responsive narrow/wide layout (`mgmt_shell.dart`).
- Home page (mgmt) + SkillUp group: Overview (map + PF current-location
  table), Dashboard (charts), School Data.
- Reporting group: Dashboard, Stats, Completed Reports, Report Generation
  Studio, Teacher Report.
- Team roster + member-detail container (C10-C16 slots): attendance heatmap,
  KPIs, admin, Work Days Rewind entry.
- Personal page; me_associate console enablement (role-based visibility +
  hard `canAccess` blocks).
- Migrations this round: none (consumed the existing schema).

### Round 2 -- Feedback fixes (Linear AIK-28 .. AIK-41)
Human-test feedback on Round 1. Mostly app polish + one backend migration.
- Stage 0: Android 30-min location capture + background continuation via
  foreground service / WorkManager; check-in writes a `location_pings` row.
- Overview map collapsible + PF-dot hover popups; stat-card rework + rename
  ("Programme Fellow - Current Location"), Today's Observations / Sessions
  cards.
- Dashboard: collapsible filter bar, Context (Rural/Urban) + School
  multi-select; charts rebuilt on `syncfusion_flutter_charts`
  (Sessions Trend, Observation Completion, Attendance Trends, Online/Offline
  donut, Teacher Reached funnel).
- PF performance table (wrapping headers, dividers, KPI columns, filter
  binding) + PF profile drill-down.
- Work Days Rewind full-year heatmap (AIK-42 shared compact grid).
- **Migration this round (now part of the prod delta):**
  `20260628120000_aik36_profile_activity.sql` -- adds
  `profiles.last_client_platform` + `profiles.last_app_version` (written by
  the app on sign-in) and a mgmt-gated view exposing
  `auth.users.last_sign_in_at` for the Team roster. Additive only.

### Round 3 -- Assessment, Attendance, Notifications, Leave (Linear AIK-43 .. AIK-54)
Reuse over rebuild. Backend Stage A (AIK-43/44/45) + app Stage B
(AIK-46/47/48/49/50). Web (AIK-51/52) dropped. See section 2 for the
migrations and section 5 for the per-issue recovery.

| Issue | Title | Status |
|---|---|---|
| AIK-43 | attendance RLS for mgmt/me INSERT+UPDATE + checkout-flag scope | DONE (staging) |
| AIK-44 | leaves reject_reason + leave->mgmt notification trigger | DONE (staging) |
| AIK-45 | notifications 15-day pg_cron cleanup | DONE (staging) |
| AIK-46 | Assessment console page + nav (reuses AssessmentTab) + form-table write policies | DONE (app+staging) |
| AIK-47 | surface real check-in error instead of generic swallow | DONE (app) |
| AIK-48 | in-app notification area (bell + list + realtime unread + mark-read) for mgmt/me | DONE (app) |
| AIK-49 | PF Leave page (unlock Apply Leave + Approved/Rejected/Applications + apply form) | DONE (app+staging) |
| AIK-50 | mgmt Leave admin under Team (Members Details + Leaves; approve/reject with reason) | DONE (app) |
| AIK-51 | web/PWA Cloudflare strategy doc | DROPPED |
| AIK-52 | Flutter web PWA build + Cloudflare deploy | DROPPED |
| AIK-53 | this release-notes / migration-delta doc | DONE (this file) |
| AIK-54 | merge + prod migration + release (APK + desktop) | NEEDS-HUMAN (gated) |

App change areas (Round 3):
- Assessment: new `/mgmt/assessment` route + nav item reusing the existing
  `AssessmentTab` verbatim (no fork); `MgmtAccess` allow-lists me_associate.
- Check-in: `staff_check_in_provider.dart` catch blocks now surface the real
  Supabase error (`'Check-in failed: $e'` / `'Check-out failed: $e'`) instead of
  swallowing it behind a generic message.
- Notifications: bell + unread badge in `mgmt_header.dart`; list sheet bound to
  the generic `notifications` table (Realtime + unread count); tap marks
  `is_read = true`; leave-type rows deep-link to `/mgmt/leaves`. Reuses the
  reporting notification pipeline verbatim -- no new table/provider.
- PF Leave: `quick_actions_bar.dart` gets an opt-in `onApplyLeave` (PF only;
  mgmt/me Personal page leaves the tile disabled); new
  `lib/features/profile/screens/leave_screen.dart` with Approved (green) /
  Rejected (red, reason popup) / Applications (pending, deletable) sections
  + an "Apply New Leave" form (type, start/end/joining dates, reason).
- Mgmt Leave admin: new `lib/features/mgmt/pages/leave_admin_page.dart` at
  `/mgmt/leaves` with Pending (Approve/Reject, reason required) / Approved /
  Rejected sections; Team nav item renamed "Members Details", new "Leaves"
  nav item (mgmt-only).

---

## 2. Migration delta: staging -> prod (APPLY ORDER)

**Method:** `supabase link` each project, then
`select version from supabase_migrations.schema_migrations order by version`.

- **Prod latest applied:** `20260627000000` (project `nuwqxlhuxwgevxvsyusj`).
- **Staging latest applied:** `20260701000001` (project `fmmnrrjkoqsfwhbmswic`).

Prod is **12 migrations behind**. Apply in this exact order (timestamps are
already monotonic; `supabase db push --linked` against prod will apply them in
file-name order):

| # | File | Round / Issue | What it does |
|---|---|---|---|
| 1 | `20260628120000_aik36_profile_activity.sql` | R2 / AIK-36 | `alter table profiles add column if not exists last_client_platform text, last_app_version text`; mgmt-gated view over `auth.users.last_sign_in_at`. Additive. |
| 2 | `20260630120000_attendance_staff_write_policies.sql` | R3 / AIK-43 | `drop policy` + `create policy` `attendance_me_insert` / `attendance_me_update` / `attendance_mgmt_insert` / `attendance_mgmt_update` (mgmt + me can INSERT/UPDATE their own attendance). |
| 3 | `20260630120100_attendance_checkout_flag_geofenced_only.sql` | R3 / AIK-43 | Drops + recreates `trg_attendance_checkout_flag` so the OFF_LOCATION_CHECKOUT flag only fires for geofenced (PF) rows (`check_out_point_id is null and check_in_point_id is not null`). Stops staff checkout being falsely flagged. |
| 4 | `20260630130000_leaves_reject_reason_and_notify_mgmt.sql` | R3 / AIK-44 | `alter table leaves add column if not exists reject_reason text`; `after insert on leaves` trigger `trg_leaves_notify_mgmt` that inserts one `notifications` row per mgmt user. |
| 5 | `20260630130100_leaves_notify_mgmt_security_definer.sql` | R3 / AIK-44 | Recreates the trigger function as `security definer set search_path = public` (owner `postgres`, BYPASSRLS) so the cross-role `select id from profiles where role='mgmt'` resolves -- the invoker version returned 0 rows. Drops the now-unneeded scoped insert policy. |
| 6 | `20260630140000_notifications_cleanup_pg_cron.sql` | R3 / AIK-45 | `create extension if not exists pg_cron`; unschedules any prior `notifications_cleanup_15d`; `cron.schedule('notifications_cleanup_15d','17 3 * * *', delete read notifications > 15 days old)`. |
| 7 | `20260630150000_form_tables_me_mgmt_write_policies.sql` | R3 / AIK-46 | 11 role-based INSERT/UPDATE policies: `observations` (mgmt+me I/U), `report_jobs` (mgmt insert), `teachers` / `schools` / `school_leader_profiles` (me I/U). All `drop policy` + `create policy`. |
| 8 | `20260630160000_leaves_pf_delete.sql` | R3 / AIK-49 | `leaves_pf_delete` DELETE policy: a PF may delete only their own rows while `status='pending'` (withdraw a pending application). |
| 9 | `20260630170000_notifications_delete_own.sql` | R3 / AIK-48 fix | `notifications_delete_own` DELETE policy: a user may delete their own rows (the "Clear read" button was silently RLS-blocked -- 0 rows, no error). |
| 10 | `20260630180000_leaves_approved_by_name.sql` | R3 / AIK-49/50 fix | `alter table leaves add column if not exists approved_by_name text`; the acting mgmt user's full name is stamped at decision time so a PF can see WHO approved/rejected without a profiles join that RLS would hide. |
| 11 | `20260701000000_sessions_grow_glow.sql` | R3-followup / AIK-57 | `alter table sessions add column if not exists grow text, add column if not exists glow text` -- two optional reflection fields on the SkillUp Session form. Additive, nullable. |
| 12 | `20260701000001_observation_photo_path_rpc.sql` | R3-followup / AIK-57 | Recreates `trg_obs_immutability` (preserves `return old;` on DELETE) + adds `set_observation_photo_path(uuid, text)` SECURITY DEFINER RPC (service_role only) that sets `app.bypass_obs_immutability='on'` for a single photo_path write. Supports the Drive image pipeline writing Drive file ids onto submitted observations. |

All 12 are **idempotent** (`drop policy if exists` / `add column if not exists` /
`drop trigger/function if exists` before create), so re-running is safe.

---

## 3. Conflict & risk scan

| Change | Risk | Verdict |
|---|---|---|
| `profiles` two new columns (#1) | Additive, nullable, no default change to existing rows. | Low. |
| Attendance mgmt/me write policies (#2) | Additive RLS; `pf_id = auth.uid()` keeps each staff member to their own row. No `with check` loosening beyond own-row. | Low. |
| Checkout-flag trigger rescope (#3) | Behaviour change: staff checkouts no longer create `attendance_flags` rows. This is the intended fix; no historical data is touched. Existing flagged rows remain. | Low (intended behaviour change). |
| `leaves.reject_reason` column (#4) | Additive, nullable. | Low. |
| Leave notify trigger as SECURITY DEFINER (#5) | Function now runs as `postgres` (BYPASSRLS) so it can read all `profiles` and insert `notifications` for mgmt users. **Surface area:** it only ever inserts notifications and only on `leaves` insert; it does not expose a writable path to callers. Verify no other `leaves` insert path is abused -- the only inserters are PF (own-row RLS). | Low-medium. Review the function body on PROMOTE; it is read-then-insert, no update/delete of user data. |
| `pg_cron` extension (#6) | New extension on prod. Supabase supports `pg_cron`; the job runs once daily at 03:17 and only deletes `is_read` notifications older than 15 days. No data-loss risk for active notifications. If `pg_cron` cannot be enabled on prod, fall back to a scheduled Edge Function (noted in AIK-45). | Low-medium. Confirm `pg_cron` is enabled on prod after apply; the migration uses `create extension if not exists`. |
| Form-table write policies (#7) | Additive role-based INSERT/UPDATE. `observations` mgmt+me I/U could let a me/mgmt user edit an observation -- intended (console data entry). Role-only (no school narrowing), matching the existing `sessions`/`teachers` precedent. | Low-medium. Acceptable per existing precedent; if tightening is wanted later, add school-ownership narrowing in a follow-up. |
| `leaves` PF delete (#8) | Scoped: own row + `status='pending'` only. An approved/rejected leave cannot be deleted by the PF. | Low. |
| `notifications` owner delete (#9) | Scoped: `user_id = auth.uid()` only. A user can delete only their own notification rows -- the "Clear read" button additionally filters `is_read = true` in the client, so only read rows are removed. | Low. |
| `leaves.approved_by_name` column (#10) | Additive, nullable text column. Stamped by the mgmt app at approve/reject time from the signed-in user's profile. No backfill (historical approver names unknown); existing rows show "Management" fallback until re-decided. | Low. |
| **Edge functions** | None changed this round, but prod has been stale before (see [prod-edge-functions-drift]). | **Redeploy ALL edge functions to prod** during PROMOTE even though no function code changed -- cheap insurance. |

**No data backfill is required.** No `drop table`, no column drops, no type
changes. Every structural change is `add column if not exists` or a
drop-and-recreate of a policy/trigger/function.

---

## 4. Non-destructive recovery (per change)

General principle: **additive-only, roll forward not back.** Never `drop table`
or drop a column with data. To revert a policy/trigger, drop + recreate the
prior version (the old definitions live in git history / earlier migrations).

- **#1 profiles columns** -- harmless to leave; to "remove", stop writing
  them (no app dependency forces their presence). No recovery needed.
- **#2 attendance policies** -- to revert: `drop policy attendance_me_insert,
  attendance_me_update, attendance_mgmt_insert, attendance_mgmt_update on
  attendance;` mgmt/me return to select-only (the Round-1 state). No data loss.
- **#3 checkout-flag trigger** -- to revert to the old (over-broad) behaviour,
  recreate the trigger with the pre-AIK-43 function body from git history. No
  data is touched by either version.
- **#4 reject_reason column** -- additive; leave it. Dropping it would lose
  rejection reasons, so do not drop.
- **#5 SECURITY DEFINER trigger** -- to revert, recreate the function as
  invoker and re-add the scoped `notifications_insert_leave_for_mgmt` policy
  (both in git history). Notifications already inserted remain.
- **#6 pg_cron job** -- `select cron.unschedule('notifications_cleanup_15d');`
  stops the cleanup. The `pg_cron` extension can stay enabled (harmless). Read
  notifications already deleted are gone (by design).
- **#7 form-table policies** -- `drop policy <name> on <table>;` per policy to
  revert; the `drop policy if exists` guards in the migration make re-runs
  safe. No data loss.
- **#8 leaves_pf_delete** -- `drop policy leaves_pf_delete on leaves;` returns
  to no-PF-delete. No data loss.
- **#9 notifications_delete_own** -- `drop policy notifications_delete_own on notifications;` returns to no-owner-delete (the "Clear read" button goes back to being a no-op). No data loss.
- **#10 leaves.approved_by_name** -- additive column; leave it, or `alter table leaves drop column approved_by_name;` to revert. Existing rows had null anyway. No data loss.

**Whole-branch abort:** prod receives only the 10 migrations above; if PROMOTE
fails partway, `supabase db push --linked` is transactional per migration, so a
failed migration leaves the DB at the prior applied version. Re-run after
fixing the failing migration -- idempotency makes this safe.

---

## 5. App changes (no DB dependency for recovery)

App changes live in the `aikarthya-field-ops-app` submodule on the shared
branch. Recovery = revert the file in git; no data implications. Files
touched this round (Round 3):
- `lib/features/mgmt/widgets/mgmt_nav_panel.dart` (Assessment + Leaves nav
  items, Team -> Members Details rename)
- `lib/features/mgmt/mgmt_access.dart` (Assessment allow-list)
- `lib/core/router/app_router.dart` (`/mgmt/assessment`, `/mgmt/leaves` routes)
- `lib/features/mgmt/widgets/mgmt_header.dart` (notification bell)
- `lib/features/mgmt/providers/staff_check_in_provider.dart` (error surface)
- `lib/features/reporting/models/notification_item.dart` (type / leaveId
  getters)
- `lib/features/reporting/widgets/notifications/notification_list_sheet.dart`
  (leave deep-link)
- `lib/features/profile/widgets/quick_actions_bar.dart` (onApplyLeave)
- `lib/features/profile/screens/leave_screen.dart` (new)
- `lib/features/mgmt/pages/leave_admin_page.dart` (new)
- `lib/features/mgmt/pages/team_page.dart` (header rename)
- `lib/features/pf_home/profile_tab.dart` (wire LeaveScreen)

Post-test-fix additions (online + offline session attendance registries, no
new migrations -- reads existing `sessions` / `session_teacher_attendance` /
`teachers` / `schools`):
- `lib/features/session_registry/session_attendance_matrix.dart` (new) -- shared
  `SessionMatrixRequest` + `sessionAttendanceMatrixProvider` (family) that
  assembles a teacher x session P/A matrix; online = PF's online sessions
  (cross-school), offline = one school's sessions (all cycles).
- `lib/features/session_registry/session_registry_widget.dart` (new) --
  `SessionAttendanceRegistryTable`: horizontal-scroll table, teacher-name first
  column, date headers (tap -> topic dialog), `P` (green) / `A` (red) cells.
- `lib/features/session_registry/offline_session_registry_page.dart` (new) --
  shared offline registry page used by both PF and mgmt school profiles.
- `lib/features/pf_home/online_session_records_page.dart` (new) -- PF "Online
  Session Records" page: records list + aggregated attendance matrix.
- `lib/features/pf_home/widgets/online_sessions_card.dart` (rows -> button
  pushing `/pf/online-sessions`).
- `lib/features/pf_school_profile/school_profile_screen.dart` (Offline Session
  Attendance button -> `/pf/school/:id/attendance-registry`).
- `lib/features/mgmt/pages/school_profile_page.dart` (Offline Session
  Attendance button -> `/mgmt/skillup/school-data/:id/attendance-registry`).
- `lib/core/router/app_router.dart` (3 new routes: `onlineSessionRecords`,
  `pfOfflineRegistry`, `mgmtOfflineRegistry`).

`flutter analyze` on the touched trees: no issues (0 errors, 0 infos).

---

## 6. Pre-PROMOTE checklist (AIK-54, human-gated)

1. User has smoke-tested the app changes on staging (per-issue review).
2. Open one human PR `night-shift/me-mgmt-dashboard` -> `main` (no bot push).
3. Within the 7 PM - 9 AM IST prod window:
   `cd aikarthya-supabase && supabase link --project-ref nuwqxlhuxwgevxvsyusj
   && supabase db push --linked` -- applies the 12 migrations in order.
4. Verify on prod: `select version from supabase_migrations.schema_migrations
   order by version desc limit 12;` shows the 12 new versions.
5. Verify `pg_cron` is enabled on prod
   (`select * from cron.job where jobname='notifications_cleanup_15d';`).
6. Set the new prod secret `GOOGLE_DRIVE_OBSERVATION_IMAGES_DRIVE_ID` (and
   confirm `GOOGLE_SERVICE_ACCOUNT_B64` + `GOOGLE_DRIVE_SHARED_DRIVE_ID`); add
   the SA as Content Manager of the **prod** "Observation_Images" Shared Drive.
7. **Deploy the 2 new + redeploy ALL existing edge functions to prod**
   (`supabase functions deploy` per function -- 11 total, see section 7) --
   lesson from [prod-edge-functions-drift]; prod breaks when functions are stale
   even if the DB is in sync.
8. Run the `cycle_number` DML backfill on prod (section 7) -- data op, any time.
9. Release via [release-aikarthya-field-ops]: bump version, build
   **APK + Windows desktop** (web dropped this round), upload to Drive, insert
   `app_versions` rows (staging then prod).
10. Mark AIK-54 done; update `app_versions`.

---

## 7. Round-3 follow-up pass (Linear AIK-57) -- additions to the PROMOTE delta

Polish + fixes from testing the M&E console, done on the same branch after the
Round 3 issues. App-only unless noted. All `flutter analyze` clean on touched
files.

### App (no DB dependency for recovery)
- Teacher profile editable after submit (`_isEditing` toggle on
  `teacher_form_screen.dart`; persistence bumps `edit_count`).
- Richer School Profile + new "More School Details" screen
  (`school_more_details_screen.dart`, route `/pf/school/:id/more-details`) +
  inline editable Notes (`schools.update` + `ref.invalidate`).
- Grow/Glow on the SkillUp Session form (schema + Session Brick model via
  `build_runner` x2 + persistence round-trip + display in online detail and
  offline matrix tap-dialog; editable after submit). Backend column = migration
  #11. The generated Brick migration is app-only (not a Supabase migration).
- SkillUp Session FORM online roster grouped by school (`_SchoolRosterTile` per
  school); Online Session Records VIEW reverted to flat + school-then-name sort;
  offline roster scoped to the selected school only (`_fetchKey` mode check).
- School Profile button repositioning (More Details beside View on Map; Offline
  Session Attendance beside "+ add new sessions details").
- HM name + POC separator on School Contacts card (`IntrinsicHeight` +
  `VerticalDivider`).
- Field Activity Map collapsed-glitch fix (`field_map_band.dart` -- removed
  duplicate icon/chevron + clipping; card sizes to content).
- Mgmt nav sidebar default collapsed (`mgmt_nav_panel.dart` -- Team group now
  starts closed like every other group).

### Backend (already in the delta above)
- Migration #11 `sessions.grow`/`glow` columns.
- Migration #12 `set_observation_photo_path` RPC + immutability-trigger refresh.
- `observations.photo_path` semantics change: now a **JSON array string** of
  Drive file ids (`["<driveFileId>", ...]`) after upload; `["data:image/..."]`
  while pending/offline. Legacy single-base64 rows are treated as a 1-element
  list. `finalize-report` does not read `photo_path`, so this is safe.

### Edge Functions (pending prod deploy)
Two new functions deployed to staging this round:
- `upload-observation-images` -- JWT verify ON (user-authed from the app);
  uploads observation photos to the "Observation_Images" Shared Drive
  (Programme > School > Teacher > "Observation N"), then calls
  `set_observation_photo_path` to write the Drive ids.
- `backfill-observation-images` -- `--no-verify-jwt` (admin-key auth); one-time
  scan + upload of legacy base64 `photo_path` rows to Drive and UPDATE to ids.
  Ran clean on staging (5 rows -> Drive ids, 0 base64 remaining).

**PROMOTE action:** deploy these 2 new functions to prod, AND redeploy every
existing function (per the prod-edge-functions-drift lesson -- prod breaks when
functions are stale even if the DB is in sync). Full function list: `list-models`,
`share-report`, `revert-report`, `agent-llm`, `get-report-pdf`, `approve-report`,
`generate-report`, `admin-reset-password`, `finalize-report`,
`upload-observation-images`, `backfill-observation-images` (11 total).

### Secrets (pending prod)
- `GOOGLE_DRIVE_OBSERVATION_IMAGES_DRIVE_ID` (new this round) -- set on prod via
  `supabase secrets set --project-ref nuwqxlhuxwgevxvsyusj`.
- `GOOGLE_SERVICE_ACCOUNT_B64` + `GOOGLE_DRIVE_SHARED_DRIVE_ID` (existing) --
  confirm present on prod; the SA must be added as a Content Manager of the
  **prod** "Observation_Images" Shared Drive (per-drive access -- the staging
  grant does not carry over).
- Never ship the service-account key client-side; Edge Function only.

### DML backfill (pending, data op -- any time, not structural)
- `cycle_number` backfill for existing NULL offline sessions (Feature 2 client
  fix is already in; the one-time backfill fills historical rows):
  ```sql
  update sessions s
  set cycle_number = ceil((s.session_date - sch.onboarding_date + 1)::numeric / 45)::int
  from schools sch
  where s.school_id = sch.id
    and s.cycle_number is null
    and s.school_id is not null;
  ```
  Run on staging then prod via the `update-database-aikarthya-field-ops` skill.
  Non-destructive (touches only NULL `cycle_number` rows). Verify with
  `select count(*) from sessions where school_id is not null and cycle_number is null` -> 0.

### Realtime (no pending publication push)
- The `notifications` and `report_jobs` Realtime publications were added in
  `20260620100000` and `20260621000000` -- both already on prod (they predate
  prod's latest applied `20260627000000`). AIK-48 (in-app notifications) reuses
  the already-prod `notifications` publication; no new publication migration is
  in this delta. Post-PROMOTE, just verify the publication is active on prod.

### pg_cron (pending prod enable)
- `notifications_cleanup_15d` daily 03:17 job (migration #6). After applying the
  delta, verify on prod: `select * from cron.job where jobname='notifications_cleanup_15d';`.
  If `pg_cron` cannot be enabled on prod, fall back to a scheduled Edge Function
  (noted in AIK-45).

---

## References
- Round 3 plan: [NIGHT_SHIFT_ROUND3_PLAN.md](NIGHT_SHIFT_ROUND3_PLAN.md)
- Round 2 plan: [NIGHT_SHIFT_ROUND2_PLAN.md](NIGHT_SHIFT_ROUND2_PLAN.md)
- Staging/prod split + PROMOTE convention: memory `supabase-staging-prod-split`
- Prod edge-function drift lesson: memory `prod-edge-functions-drift`
- Linear project: "M&E Console -- Round 3"