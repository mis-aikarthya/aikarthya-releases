# Night Shift — Round 3 (Assessment · Attendance · Notifications · Leave · Web) Plan

Continuation of [NIGHT_SHIFT_ROUND2_PLAN.md](NIGHT_SHIFT_ROUND2_PLAN.md). Same shared branch
`night-shift/me-mgmt-dashboard`, same staging-first workflow
([NIGHT_SHIFT_LINEAR_WORKFLOW.md](NIGHT_SHIFT_LINEAR_WORKFLOW.md)), one human PR to `main` at the end.

Linear project: **"M&E Console — Round 3"** (team AIK). Issue keys assigned at creation
(see the mapping table at the bottom — `R3-*` are stable handles used in this doc).

**Locked decisions (this round):**
- **Web/PWA dropped this round** (user, 30-Jun-2026) — AIK-51 / AIK-52 removed from scope; no web
  build, no Cloudflare work. Release (R3-R1) ships **APK + Windows desktop only**. Background /
  geofenced location stays mobile-only (irrelevant to web, which is gone). Web research stays
  archived in `aikarthya-docs/research/pwa-hosting/` for a future round.
- Reuse over rebuild everywhere: the PF `AssessmentTab`, the existing `notifications` table, the
  existing `leaves` table, the existing `staffCheckInProvider`. Almost nothing here is greenfield.

---

## Key findings from code/DB audit (why these are mostly small)

| Item | What already exists | What is actually missing |
|---|---|---|
| #1 Assessment | `AssessmentTab` + `assessment_providers` (Records & Surveys / Drafts / Submitted), mobile-done on PF side | a `/mgmt/assessment` route + nav entry; confirm mgmt/me can submit forms (form_access + RLS) |
| #2 Check-in | `staffCheckInProvider` + `StaffCheckInCard` write attendance correctly | **`attendance` RLS gives mgmt/me only SELECT** — no INSERT/UPDATE → write silently blocked → no row, no counter |
| #3 Notifications | generic `notifications` table (user_id, title, body, payload, is_read, created_at) + Realtime publication + RLS; reporting already uses it | a mgmt/me notification **area** (bell + list), an event that **creates** notifications, a 15-day cleanup job |
| #4 Leave | `leaves` table (pf_id, start/end_date, leave_type, reason, status, approved_by, joining_date, sanctioned_by); RLS: PF S/I own, mgmt S/U all | `reject_reason` column; unlock the disabled "Apply Leave" card; the PF leave page; the mgmt leave admin; leave→mgmt notification |
| #5 Web | full research in `aikarthya-docs/research/pwa-hosting/` (Cloudflare Pages recommended) | the build pipeline + deploy + Supabase redirect/CORS config |

### #2 root cause (confirmed)
[`20260528203314_13_rls_policies.sql:168-177`](aikarthya-supabase/supabase/migrations/20260528203314_13_rls_policies.sql) —
`attendance_pf_insert` / `attendance_pf_update` require `fn_is_pf()`; mgmt + me have **select-only**
policies. `staffCheckInProvider.checkIn()` issues an INSERT, RLS rejects it, the `on Object` catch
resets status to idle with a generic error. The counter (`WorkTimer`) only renders when
`status == checkedIn && activeAttendance != null`, which never happens because the insert failed.
**Fix is one backend migration** (+ app should surface the real error instead of swallowing it).

---

## Stage A — Backend foundation (build + PROMOTE these first)

Backend changes need staging→prod PROMOTE (see [supabase-staging-prod-split]). Do them first so the
app issues have something to write against.

### R3-B1 · `attendance` RLS: allow mgmt + me_associate to INSERT/UPDATE own rows — `Bug · area:backend · agent-ready`
New migration adding:
```sql
create policy "attendance_staff_insert" on attendance
  for insert with check (pf_id = auth.uid() and (fn_is_mgmt() or fn_is_me()));
create policy "attendance_staff_update" on attendance
  for update using (pf_id = auth.uid() and (fn_is_mgmt() or fn_is_me()));
```
- `pf_id = auth.uid()` keeps a staff member to their own attendance only.
- Columns `check_in_point_id` / `check_out_point_id` are already nullable — the non-geofenced staff
  path writing nulls is fine. Confirm no NOT NULL / trigger on the point cols (was a flagged risk).
- **DoD:** mgmt + me_associate accounts each insert + update an attendance row on staging (verify a
  real row lands; then the app counter works without app changes). Apply to staging; flag for PROMOTE.

### R3-B2 · `leaves`: add `reject_reason` + leave-request→mgmt notification — `Feature · area:backend · agent-ready`
- `alter table leaves add column if not exists reject_reason text;`
- Trigger `after insert on leaves`: insert one `notifications` row per mgmt user
  (`select id from profiles where role = 'mgmt'`), title "New leave request", body = applicant + dates,
  `payload = {type:'leave', leave_id}`. Reuse the existing notifications table — no new table.
- Confirm RLS lets PF **insert** their own leave (exists) and mgmt **update** (exists). Add a mgmt/me
  insert policy only if staff will also apply for leave (default: PF-only applies this round).
- **DoD:** inserting a leave on staging creates N notification rows (N = mgmt users); column present.

### R3-B3 · Notifications 15-day cleanup job — `Feature · area:backend · agent-ready`
- Daily `pg_cron` job: `delete from notifications where is_read = true and created_at < now() - interval '15 days';`
- ponytail: cleanest as a one-line cron, not an Edge Function. If `pg_cron` isn't enabled on the
  project, enable it in the migration (`create extension if not exists pg_cron;`) or fall back to a
  scheduled Edge Function — note which in the issue.
- **DoD:** cron job registered on staging; a manually-aged read row is deleted on the next run (or by
  running the delete statement once to prove the predicate).

---

## Stage B — App features (consume Stage A)

### R3-A1 · Assessment console page + nav entry (reuse `AssessmentTab`) — `Feature · area:app`
- New route `MgmtRoutes.assessment = '/mgmt/assessment'`; nav `_TopItem` **immediately above the
  Programs group** (visible to mgmt + me_associate; add to `MgmtAccess.canAccess` allow-list for me).
- Body = the existing `AssessmentTab` (Records & Surveys / Drafts / Submitted) wrapped for the console
  shell. It is already a self-contained `ConsumerStatefulWidget` and already mobile-optimized
  (`maxWidth: 640`, RefreshIndicator) — reuse verbatim; do **not** fork it.
- The forms it lists are driven by `activeFormsProvider` (form_access). **Verify mgmt/me actually have
  form access + RLS to create/draft/submit `form_submissions`.** If blocked, add a small backend
  migration (form_access rows for these roles + submission insert/select RLS) — only if confirmed
  needed (don't pre-build it).
- **Mobile:** this is the one console page that must be fully usable on a phone (mirror the PF mobile
  layout, which is already done). Verify in the narrow MgmtShell layout (drawer nav, SafeArea header).
- **DoD:** mgmt + me open `/mgmt/assessment`, see assigned forms, open a form, save a draft, see it in
  Drafts, submit, see it in Submitted — on both desktop and a narrow window.

### R3-A2 · Fix mgmt + me check-in writes & counter — `Bug · area:app` *(blockedBy R3-B1)*
- Mostly verification after R3-B1: confirm `staffCheckInProvider` now persists the row and the
  `WorkTimer` counter runs on the `StaffCheckInCard`.
- Improve the silent failure: surface the real Supabase/RLS error message instead of the generic
  "Check-in failed. Please try again." so future RLS gaps are diagnosable (the `on Object` catch in
  `staff_check_in_provider.dart` currently throws the detail away).
- **DoD:** physical/staging mgmt + me check-in writes a row, status → Checked In, counter increments;
  check-out writes `check_out_at`, status → Done Today.

### R3-A3 · In-app notification area for mgmt + me — `Feature · area:app` *(relatedTo R3-B3)*
- A bell in the mgmt header (`mgmt_header.dart`) with an unread badge; tap opens a list sheet.
- Reuse the reporting notification pattern as the template (`reporting/providers/notifications_provider.dart`,
  `reporting/widgets/notifications/notification_list_sheet.dart`, `models/notification_item.dart`) but
  bind to the **generic** `notifications` table for the current user (Realtime stream + unread count).
- Tap a row → mark `is_read = true` (this is what feeds the 15-day cleanup). Generic rows just show
  title/body; leave rows (`payload.type == 'leave'`) deep-link to the mgmt leave admin (R3-A5).
- ponytail: pipeline-only — no FCM/push this round (`payload` already reserves the FCM slot). In-app
  Realtime is "the pipeline" the user asked for.
- **DoD:** a notification row for the logged-in user appears live in the bell; badge counts unread;
  tapping marks read and decrements.

### R3-A4 · PF Leave page — unlock "Apply Leave" + sections + apply form — `Feature · area:app` *(blockedBy R3-B2)*
- Unlock the disabled "Apply Leave" tile in `quick_actions_bar.dart` (remove `enabled: false`; route
  to the new page).
- New `LeavePage` (PF profile), sectioned like the Assessment page, with a back button:
  1. **Approved Leaves** — success-colour background; each row shows leave type, dates, approved by.
     Tap → read-only filled leave form.
  2. **Rejected Leaves** — danger-colour background; row shows type/dates/**rejected by**. Tap → popup
     with the **reject reason** (`reject_reason`).
  3. **Leave Applications** — pending list (the employee's own requests); each row opens the form;
     **deletable** like drafts (swipe/trash, confirm dialog — reuse the draft-delete pattern).
  4. Bottom: a **centre-aligned "Apply New Leave"** button → leave form.
- Leave form fields (general data only): **leave type, start date, end date, joining date, reason**.
  Native `<input type=date>`-equivalent (`showDatePicker`) — no picker lib. Writes a `leaves` row with
  `status='pending'`, `pf_id = auth.uid()`, `requested_on = now()`.
- **DoD:** PF applies a leave → row created (status pending) → appears under Applications → can be
  deleted; once mgmt approves/rejects (R3-A5) it moves to Approved/Rejected with the right metadata.

### R3-A5 · Mgmt Leave admin under Team — `Feature · area:app` *(blockedBy R3-B2; relatedTo R3-A3)*
- Team group: current page becomes **"Members Details"**; add a sibling **"Leaves"** admin page.
- Leaves admin sections: **Approved** (all members), **Pending** (applications awaiting decision),
  **Rejected**. Pending rows are tappable → view full request → **Approve** or **Reject**.
  - Approve → `status='approved'`, `approved_by = current mgmt user id`.
  - Reject → `status='rejected'`, `approved_by = current mgmt user id` (used as "rejected by"),
    `reject_reason = <entered reason>` (required field on the reject dialog).
- Reuse the mgmt update RLS (already present). On decision, the PF's Leave page reflects it on refresh.
- **DoD:** mgmt sees a pending request, approves one and rejects one (with reason); both reflect on the
  PF side with correct approver/rejecter + reason.

---

## Stage C — Web / PWA release (#5) — DROPPED this round

> **Scope removed 30-Jun-2026.** AIK-51 / AIK-52 are not being implemented. Web research remains in
> `aikarthya-docs/research/pwa-hosting/` for a future round. Kept below for reference only.

### R3-W1 · Web/PWA Cloudflare release strategy + plan doc — `Feature · area:app · needs-human` — DROPPED
Write `aikarthya-docs/research/pwa-hosting/09-release-strategy.md` (builds on the existing research)
covering, for **Supabase-login-only gate, all roles**:
- **Key handling:** only the Supabase **anon/publishable** key ships in the web bundle (safe by design,
  RLS-gated); **service-role key never** touches the browser. Build-time env via `--dart-define`
  (mirror the existing staging/prod split). Document where the key lives and how prod vs staging build
  picks it up.
- **Supabase config:** add the Cloudflare Pages origin(s) to Auth **redirect URLs** and (if needed)
  **CORS allowed origins**; confirm email-confirm/redirect flows work from the web origin.
- **Access:** login wall is the only gate (decision locked). Note the residual risk (public URL) and
  that Cloudflare Access can be layered later without app changes.
- **PWA:** manifest + service worker for installability; iOS PWA caveats from
  `02-ios-pwa-considerations.md` (cache limits, service-worker persistence); background location is
  **not reliable on web/iOS** — PF check-in on web is best-effort/foreground-only, call this out.
- **Deploy:** Cloudflare Pages project, build command (`flutter build web --release` + defines),
  output dir `build/web`, SPA routing fallback, custom domain/DNS steps.
- **DoD:** doc reviewed by human; W2 can be executed from it with no open questions.

### R3-W2 · Flutter web PWA build + Cloudflare Pages deploy — `Feature · area:app · needs-human` *(blockedBy R3-W1)* — DROPPED
- Implement per W1: PWA manifest/service worker, build with prod defines, Cloudflare Pages pipeline,
  Supabase redirect/CORS applied, login-only gate verified, all roles smoke-tested on the deployed URL.
- Fold the web build into the release skill ([release-aikarthya-field-ops]) so future releases emit web too.
- **DoD:** the app is reachable at the Cloudflare URL, login works for each role, core flows work,
  installable as a PWA.

---

## Stage D — Documentation & Release gate (#6, #7)

### R3-D1 · Night-shift change + staging→prod migration delta doc — `type:test · needs-human` *(blockedBy all impl)*
Before any commit/merge, produce `NIGHT_SHIFT_RELEASE_NOTES.md` (repo root) covering the **whole**
night-shift branch (Round 1 + 2 + 3):
- Every app change area and every **new migration** that must go staging→prod, in apply order.
- The **migration delta**: `supabase db diff` / list of migrations present on staging but not prod;
  call out R3-B1/B2/B3 plus any Round-2 backend changes.
- **Conflict & risk scan:** RLS additions (additive, low risk), new columns (`reject_reason` — additive),
  new policies, the `pg_cron` extension dependency, any data backfill.
- **Non-destructive recovery:** for each change, how to roll forward/back without dropping data
  (additive-only migrations, `add column if not exists`, policy drop-and-recreate, never `drop table`).
- **DoD:** human can read this and know exactly what prod will receive and how to recover.

### R3-R1 · Merge night-shift→main + prod migration + release (APK · desktop · web) — `needs-human` *(blockedBy R3-D1)*
- One human PR `night-shift/me-mgmt-dashboard` → `main`.
- PROMOTE the staging migrations to prod in the order from R3-D1; redeploy **all** edge functions to
  prod (lesson from [prod-edge-functions-drift] — prod breaks when functions are stale).
- Release via [release-aikarthya-field-ops]: bump version, build APK + Windows desktop (**web dropped
  this round**), upload to Drive, insert the `app_versions` rows (staging then prod).
- **DoD:** prod DB matches staging, app released on APK + desktop, `app_versions` updated.

---

## Dependency / sequencing

```
R3-B1 ─▶ R3-A2
R3-B2 ─▶ R3-A4, R3-A5
R3-B3 ─▶ R3-A3 (relatedTo; A3 can build against the existing table immediately)
(all impl) ─▶ R3-D1 ─▶ R3-R1
```
R3-W1/R3-W2 (web) **dropped this round** — removed from the graph.
R3-A1 (Assessment) has no hard blocker — start it in parallel; only a backend migration is added if
form-submission RLS turns out to block mgmt/me.

**Status:** R3-B1 (AIK-43) **DONE on staging** (30-Jun-2026) — 2 migrations applied + RLS-verified;
flagged for prod PROMOTE. See Linear AIK-43 comment for evidence.

**Status (30-Jun-2026, continued):** AIK-47 (app error-surface; on-device smoke pending),
AIK-44 (reject_reason + SECURITY DEFINER leave→mgmt notify trigger; verified), AIK-45 (pg_cron
15-day cleanup; verified), AIK-46 (Assessment page+nav+route reusing AssessmentTab + form-table
mgmt/me write policies; verified) — all DONE on staging/app, all flagged for prod PROMOTE.
Backend Stage A complete. Remaining: AIK-48 (notif area), AIK-49 (PF leave page), AIK-50 (mgmt
leave admin), AIK-53 (release notes), AIK-54 (merge+prod+release). Web (AIK-51/52) dropped.

**Status (30-Jun-2026, final impl):** AIK-48 (notif bell + list + realtime + leave deep-link),
AIK-49 (PF Leave page + `leaves_pf_delete` policy pushed to staging), AIK-50 (mgmt Leave admin
at `/mgmt/leaves` + Team -> Members Details rename), AIK-53 (`NIGHT_SHIFT_RELEASE_NOTES.md` with
the verified 8-migration prod delta) -- all DONE. All non-Cloudflare issues implemented.
AIK-54 (merge + prod PROMOTE + release) is the only remaining step and is HELD for the user's
on-device test before any push/merge. Prod delta = 8 migrations (1 R2 leftover AIK-36 + 7 R3).

---

## Linear key mapping

Filled in after creation:

Project: **M&E Console — Round 3** · https://linear.app/aikarthya-field-ops/project/mande-console-round-3-b80faf43f932

| Handle | Linear | Title | blockedBy | Status |
|---|---|---|---|---|
| R3-B1 | AIK-43 | attendance RLS for mgmt/me insert+update | — | DONE (staging) |
| R3-B2 | AIK-44 | leaves reject_reason + leave→mgmt notification | — | DONE (staging) |
| R3-B3 | AIK-45 | notifications 15-day cleanup job | — | DONE (staging) |
| R3-A1 | AIK-46 | Assessment console page + nav | — | DONE (app+staging) |
| R3-A2 | AIK-47 | fix mgmt/me check-in writes & counter | AIK-43 | DONE (app; on-device smoke pending) |
| R3-A3 | AIK-48 | in-app notification area for mgmt/me | (rel AIK-45) | DONE (app) |
| R3-A4 | AIK-49 | PF Leave page | AIK-44 | DONE (app+staging) |
| R3-A5 | AIK-50 | mgmt Leave admin under Team | AIK-44 (rel AIK-48) | DONE (app) |
| R3-W1 | AIK-51 | web/PWA Cloudflare strategy doc | — | DROPPED |
| R3-W2 | AIK-52 | Flutter web PWA build + deploy | AIK-51 | DROPPED |
| R3-D1 | AIK-53 | change + migration delta doc | AIK-46..50 | DONE (doc) |
| R3-R1 | AIK-54 | merge + prod migration + release (APK + desktop) | AIK-53 | NEEDS-HUMAN (gated) |

---

## Execution prompts (start work one issue at a time)

Each prompt is self-contained for a fresh agent session on branch `night-shift/me-mgmt-dashboard`.
Run them in dependency order (Stage A backend first). Verify on **staging** before marking done.

**P1 — R3-B1 (attendance RLS):**
> On branch `night-shift/me-mgmt-dashboard`, fix the mgmt/me check-in bug at its root. In
> `aikarthya-supabase`, add a new migration creating `attendance_staff_insert` and
> `attendance_staff_update` RLS policies: `with check / using (pf_id = auth.uid() and (fn_is_mgmt() or
> fn_is_me()))`. Confirm `check_in_point_id`/`check_out_point_id` have no NOT NULL or trigger that
> rejects nulls. Apply to staging, verify a mgmt and a me_associate account can each insert+update an
> attendance row. Update the R3-B1 Linear issue with evidence; flag for prod PROMOTE.

**P2 — R3-B2 (leaves column + notify trigger):**
> On the night-shift branch, in `aikarthya-supabase`: add `reject_reason text` to `leaves`
> (`add column if not exists`), and an `after insert on leaves` trigger that inserts one row into
> `notifications` for every mgmt user (title "New leave request", body with applicant name + dates,
> payload `{type:'leave', leave_id}`). Verify on staging that inserting a leave creates the rows.
> Update R3-B2 with evidence; flag for PROMOTE.

**P3 — R3-B3 (notification cleanup):**
> On the night-shift branch, add a migration registering a daily `pg_cron` job:
> `delete from notifications where is_read = true and created_at < now() - interval '15 days'`.
> Enable `pg_cron` if needed, or note an Edge Function fallback. Verify on staging. Update R3-B3.

**P4 — R3-A1 (Assessment page):**
> On the night-shift branch, add a `/mgmt/assessment` route + a nav item directly above the Programs
> group in `mgmt_nav_panel.dart`, visible to mgmt + me_associate (update `MgmtAccess`). Render the
> existing `AssessmentTab` (from `pf_home/assessment_tab.dart`) inside the console shell — reuse it,
> do not fork. Verify mgmt/me can open a form, save a draft, and submit; if RLS/form_access blocks
> submission, add the minimal backend migration to allow it. Confirm it works in the narrow (mobile)
> MgmtShell layout. Run `flutter analyze` + tests. Update R3-A1.

**P5 — R3-A2 (check-in app fix):** *(after P1)*
> On the night-shift branch, verify the mgmt/me check-in now persists and the WorkTimer counter runs
> after R3-B1. In `staff_check_in_provider.dart`, replace the generic check-in/check-out failure
> messages with the real error detail so RLS gaps are diagnosable. Verify on staging. Update R3-A2.

**P6 — R3-A3 (notification area):**
> On the night-shift branch, add a notification bell + unread badge to `mgmt_header.dart` and a list
> sheet bound to the generic `notifications` table for the current user (Realtime + unread count),
> modeled on the reporting notifications widgets. Tapping a row sets `is_read=true`; leave-type rows
> deep-link to the mgmt leave admin. Verify live on staging. Update R3-A3.

**P7 — R3-A4 (PF Leave page):** *(after P2)*
> On the night-shift branch, unlock the "Apply Leave" tile in `quick_actions_bar.dart` and build the
> PF LeavePage with sections Approved (green) / Rejected (red, tap→reason popup) / Applications
> (deletable like drafts) and a centre "Apply New Leave" button opening a form with fields leave type,
> start date, end date, joining date, reason. Writes a `leaves` row (status pending). Verify the full
> flow on staging. Update R3-A4.

**P8 — R3-A5 (mgmt Leave admin):** *(after P2)*
> On the night-shift branch, under the Team group rename the current page to "Members Details" and add
> a "Leaves" admin page with Approved / Pending / Rejected sections. Pending rows open the request with
> Approve / Reject actions: approve sets status=approved + approved_by=current user; reject sets
> status=rejected + approved_by=current user + reject_reason (required). Verify against the PF side on
> staging. Update R3-A5.

**P9 — R3-W1 (web strategy doc):**
> Write `aikarthya-docs/research/pwa-hosting/09-release-strategy.md` per the R3-W1 spec in
> NIGHT_SHIFT_ROUND3_PLAN.md (Supabase-login-only gate, all roles, anon-key-only in browser,
> redirect/CORS config, PWA manifest/service worker, iOS caveats, Cloudflare Pages deploy steps).
> Mark needs-human for review. Update R3-W1.

**P10 — R3-W2 (web build + deploy):** *(after P9 review)*
> Implement the web/PWA build and Cloudflare Pages deploy per 09-release-strategy.md; apply Supabase
> redirect/CORS; smoke-test login + core flows per role on the deployed URL; fold web into the release
> skill. Update R3-W2.

**P11 — R3-D1 (release notes / migration delta):** *(after all impl)*
> Produce `NIGHT_SHIFT_RELEASE_NOTES.md` per R3-D1: full night-shift change inventory, the
> staging→prod migration delta in apply order, conflict/risk scan, and non-destructive recovery per
> change. Mark needs-human. Update R3-D1.

**P12 — R3-R1 (merge + prod + release):** *(human-gated, after P11)*
> Open the PR night-shift→main, PROMOTE staging migrations to prod in order, redeploy all edge
> functions, and run the release skill for APK + desktop + web. Update R3-R1 + app_versions.
