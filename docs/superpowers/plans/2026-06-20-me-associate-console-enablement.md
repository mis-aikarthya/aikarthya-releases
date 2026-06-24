# M&E Associate Console Enablement — Implementation Plan

> **For agentic workers:** Implement task-by-task. Each task ends with an
> independently verifiable deliverable. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give `me_associate` access to the shared `/mgmt` console with
role-based visibility, add a Personal landing page (identity + non-geofenced
check-in + quick actions) for both roles, a Completed Reports page, an org-wide
default-model setting, and make the console mobile-responsive.

**Architecture:** One console shell (`/mgmt/*`) serves both `mgmt` and
`me_associate`; a `MgmtAccess` helper is the single source of truth for per-role
route allow-list and landing route. New pages are added inside the existing mgmt
`ShellRoute`. Attendance for staff roles is a separate, non-geofenced provider
reusing the `attendance` table.

**Tech Stack:** Flutter, Riverpod, go_router, Supabase (supabase_flutter +
Brick offline-first), Dart.

## Global Constraints

- Staging only. No production deploys until E2E-tested on staging and user
  confirms.
- No emojis in SQL, docs, or commit messages. Dates DD-MMM-YYYY.
- Do not commit unless the user explicitly asks.
- Lint: lines <= 80 chars; run `flutter analyze` clean before considering a task
  done.
- Reuse existing theme tokens (`AppColors`, `AppTypography`) and existing
  patterns; do not restructure unrelated code.
- Only `mgmt` and `me_associate` reach the console; `pf`/`hm` are out of scope.

---

### Task 1: MgmtRoutes constants + MgmtAccess helper

**Files:**
- Modify: `lib/features/mgmt/widgets/mgmt_nav_panel.dart` (MgmtRoutes constants)
- Create: `lib/features/mgmt/mgmt_access.dart`

**Interfaces:**
- Produces: `MgmtRoutes.personal = '/mgmt/personal'`,
  `MgmtRoutes.reportingCompleted = '/mgmt/reporting/completed'`.
- Produces `MgmtAccess`:
  - `static String landing(AppRole role)` -> mgmt `/mgmt/home`,
    meAssociate `/mgmt/personal`.
  - `static bool canAccess(AppRole role, String path)` -> true if the role may
    open that console path.
  - `static bool showHome(AppRole)`, `showPrograms(AppRole)`, `showTeam(AppRole)`.

- [ ] Add the two constants to `MgmtRoutes`.
- [ ] Create `MgmtAccess`. me_associate allow-list: any path starting with
  `/mgmt/personal` or `/mgmt/reporting`. mgmt: all `/mgmt/...`. `showHome/
  showPrograms/showTeam` return `role == AppRole.mgmt`.
- [ ] `flutter analyze` clean.

### Task 2: Extract shared QuickActionsBar

**Files:**
- Create: `lib/features/profile/widgets/quick_actions_bar.dart`
- Modify: `lib/features/pf_home/profile_tab.dart` (use the extracted widget)

**Interfaces:**
- Produces: `class QuickActionsBar extends StatelessWidget` rendering the same
  tiles currently in `profile_tab.dart` `_QuickActionsSection` (Attendance
  Report active -> `AttendanceReportScreen`; Apply Leave / Week Off / Payslips /
  Expenses "coming soon").

- [ ] Move `_QuickActionsSection` body + `_ActionCard` + `_ExpensesCard` +
  `_showComingSoon` into `QuickActionsBar` (public). Keep the `_SectionHeader`
  usage (import/keep a local copy if `_SectionHeader` stays private in
  profile_tab — expose a minimal header inside the widget).
- [ ] Replace the inline `_QuickActionsSection()` in profile_tab with
  `const QuickActionsBar()`; delete the now-unused private classes from
  profile_tab.
- [ ] `flutter analyze` clean; PF profile tab still renders the same actions.

### Task 3: Non-geofenced staff check-in provider + card

**Files:**
- Create: `lib/features/mgmt/providers/staff_check_in_provider.dart`
- Create: `lib/features/mgmt/widgets/staff_check_in_card.dart`

**Interfaces:**
- Produces: `staffCheckInProvider`
  (`NotifierProvider<StaffCheckInNotifier, CheckInState>`) reusing the existing
  `CheckInState`/`CheckInStatus` from `check_in_provider.dart`, but with no
  geofence. Methods `checkIn()`, `checkOut()`, plus GPS-decision helpers
  mirroring the PF provider.
- Produces: `class StaffCheckInCard extends ConsumerWidget`.

- [ ] Implement `StaffCheckInNotifier`: reuse `CheckInState`/`CheckInStatus`.
  Rehydrate today's open/completed attendance for `profile.id` (Brick on native,
  Supabase on web) exactly like `checkInProvider._loadOpenAttendance`.
- [ ] `checkIn()`: ensure GPS ready (reuse the same permission/service checks),
  acquire a fix best-effort, then INSERT into `attendance` with
  `check_in_point_id = null`. If no fix, still allow check-in with null lat/lng
  (no geofence gate).
- [ ] `checkOut()`: acquire best-effort fix, UPDATE the open row with
  `check_out_at`, location (nullable), `check_out_point_id = null`,
  `check_out_flagged = false`.
- [ ] `StaffCheckInCard`: visually match `CheckInCard` (date circle, status pill,
  work timer, Check In/Out button) minus near-point/not-near-point messaging;
  show a brief "Recording location" state during acquisition.
- [ ] `flutter analyze` clean.

### Task 4: Personal page

**Files:**
- Create: `lib/features/mgmt/pages/personal_page.dart`

**Interfaces:**
- Consumes: `staffCheckInProvider`, `StaffCheckInCard`, `QuickActionsBar`,
  `authProvider`.
- Produces: `class PersonalPage extends ConsumerWidget`.

- [ ] Build the page: identity header (avatar from `profile.photoPath` or
  initials, full name, role chip), centered time-of-day greeting, then
  `StaffCheckInCard`, then `QuickActionsBar`. Max-width constrained, scrollable,
  pull-to-refresh optional. Match console page styling (background, padding).
- [ ] `flutter analyze` clean.

### Task 5: Router — landing, allow me_associate, guard, new routes

**Files:**
- Modify: `lib/core/router/app_router.dart`

**Interfaces:**
- Consumes: `MgmtAccess`, `PersonalPage`, `CompletedReportsPage` (Task 8 — add
  the route referencing it; if Task 8 not yet done, temporarily point to a
  placeholder and finalize in Task 8).

- [ ] `roleHomePath(meAssociate)` returns `/mgmt/personal`. Remove the `/me`
  route and its import; keep `MEShell` file but unreferenced (or delete import
  only).
- [ ] In `redirectForAuthState` authenticated branch: allow `me_associate` into
  `/mgmt` like mgmt, but gate with `MgmtAccess.canAccess(role, currentPath)` —
  if false, return `MgmtAccess.landing(role)`. For mgmt keep existing
  allow-all-`/mgmt` behavior (canAccess returns true for all `/mgmt/...`).
- [ ] Add `GoRoute(MgmtRoutes.personal, name: 'mgmtPersonal')` -> `PersonalPage`
  inside the mgmt `ShellRoute`.
- [ ] Add `GoRoute(MgmtRoutes.reportingCompleted, name:
  'mgmtReportingCompleted')` -> `CompletedReportsPage` inside the mgmt
  `ShellRoute` (wire in Task 8).
- [ ] `flutter analyze` clean.

### Task 6: Nav panel role visibility + new items

**Files:**
- Modify: `lib/features/mgmt/widgets/mgmt_nav_panel.dart`

**Interfaces:**
- Consumes: `MgmtAccess`, `MgmtRoutes`.

- [ ] Read `role` from `authProvider.profile`. Add a Personal `_TopItem`
  (`Icons.person_outline`) at the top routing to `MgmtRoutes.personal`, visible
  to both.
- [ ] Wrap Home in `if (MgmtAccess.showHome(role))`; wrap Programs group in
  `if (MgmtAccess.showPrograms(role))`; wrap Team in
  `if (MgmtAccess.showTeam(role))`.
- [ ] Add a Completed Reports `_LeafItem` after Stats inside the Reporting group,
  routing to `MgmtRoutes.reportingCompleted`.
- [ ] `flutter analyze` clean.

### Task 7: Org-wide default model

**Files:**
- Create: `aikarthya-supabase/supabase/migrations/<ts>_app_settings.sql`
- Create: `lib/features/reporting/providers/reporting_default_model_provider.dart`
- Modify: `lib/features/reporting/providers/report_studio_providers.dart`
  (`selectedModelProvider` seeds from the persisted default)
- Modify: `lib/features/reporting/widgets/studio/studio_controls_panel.dart`
  ("Save as default" button)

**Interfaces:**
- Produces: `reportingDefaultModelProvider` (FutureProvider<String>) reading
  `app_settings.reporting_default_model`, fallback `minimax-m3`.
- Produces: a write function `setReportingDefaultModel(String model)`.

- [ ] Migration: `create table if not exists public.app_settings (key text
  primary key, value text not null, updated_at timestamptz not null default
  now(), updated_by uuid references auth.users(id));` + seed
  `reporting_default_model = 'minimax-m3'`; RLS: select for authenticated,
  insert/update only when caller role is mgmt (subquery on profiles). Apply to
  STAGING.
- [ ] `reporting_default_model_provider.dart`: read the row;
  `setReportingDefaultModel` upserts the row with `updated_by = auth uid`.
- [ ] `selectedModelProvider`: initialize from `reportingDefaultModelProvider`
  value when available (keep `minimax-m3` as ultimate fallback).
- [ ] Studio controls: add a "Save as default" button next to the model
  selector, shown only when `role == AppRole.mgmt`; on tap call
  `setReportingDefaultModel(selected)` then invalidate
  `reportingDefaultModelProvider`; snackbar on success/failure.
- [ ] `flutter analyze` clean.

### Task 8: Completed Reports page

**Files:**
- Create: `lib/features/reporting/providers/completed_reports_providers.dart`
- Create: `lib/features/reporting/pages/completed_reports_page.dart`
- Modify: `lib/core/router/app_router.dart` (finalize the route from Task 5)

**Interfaces:**
- Consumes: existing `reporting_queue_providers.dart` filter/query plumbing,
  `ReportPdfViewerPage` / the PDF viewer widget.
- Produces: `completedReportsProvider`, `class CompletedReportsPage`.

- [ ] `completedReportsProvider`: query reports with status in
  ('released','shared'), reusing the queue query/filters where possible.
- [ ] `CompletedReportsPage`: filters + table mirroring the Reporting Dashboard,
  listing completed reports. Each row has a View action opening the PDF in a
  dialog and a Download action saving with a human-readable name (teacher +
  cycle).
- [ ] Confirm the router route points to `CompletedReportsPage`.
- [ ] `flutter analyze` clean.

### Task 9: Responsive shell + safe-area header

**Files:**
- Modify: `lib/features/mgmt/mgmt_shell.dart`
- Modify: `lib/features/mgmt/widgets/mgmt_header.dart`

**Interfaces:**
- Consumes: `MgmtNavPanel`.

- [ ] `MgmtShell`: `LayoutBuilder` breakpoint at 900 px. Wide: current Row with
  fixed nav. Narrow: `Scaffold` with `drawer: Drawer(child: MgmtNavPanel)` and a
  header hamburger that opens it; child takes full width. Selecting a nav item on
  narrow closes the drawer (pass an `onNavigate` callback or use
  `Navigator.pop`).
- [ ] `MgmtHeader`: wrap content in `SafeArea(top: true)` so the status bar inset
  is additive (fixes the phone crop). Show a hamburger/menu button on narrow
  widths that opens the drawer.
- [ ] `flutter analyze` clean; verify header is not cropped at phone width.

---

## Verification (after all tasks)

- `flutter analyze` clean across the app.
- E2E on staging (mobile + desktop), per the spec section 6 checklist.
- Report results to the user. Do not commit or deploy to prod unless the user
  asks.
