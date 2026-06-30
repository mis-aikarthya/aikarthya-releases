# M&E Associate Enablement + Shared Responsive Console — Design

Date: 20-Jun-2026
Status: Approved for spec review
Scope: Pre-first-release feature. Staging only; no production deploys until the
full pipeline is built and E2E-tested on staging and the user confirms.

## 1. Problem and goals

`me_associate` (M&E Associate) is responsible for reporting but currently lands
on `/me`, a placeholder shell with no functionality. Management (`mgmt`) has the
full console at `/mgmt/*`. We want both roles to share one console with
role-based visibility, give M&E Associates real access to the reporting
pipeline, add a personal landing page (attendance + quick actions) for both
roles, add a Completed Reports page, add an org-wide default-model setting, and
make the whole console mobile-responsive (the mgmt top bar currently crops on
phones).

Goals:

1. `me_associate` and `mgmt` share the same console shell (`/mgmt/*`) with
   conditional, role-based navigation and route access.
2. New Personal landing page for both roles: identity header, greeting,
   non-geofenced check-in, quick-action bar.
3. `me_associate` gets the Reporting group: Dashboard, Studio, Teacher Report,
   Stats, and a new Completed Reports page.
4. New Completed Reports page (both roles): released/shared reports with View +
   Download.
5. Org-wide default model setting, set by mgmt, used by everyone; me_associate
   may still override the model per session.
6. Responsive console: fixed left nav on wide screens, Drawer nav with a
   safe-area top bar on phones. Fixes the existing mgmt mobile crop.

Non-goals (unchanged this release): PF and HM shells, the report status state
machine, Drive/PDF backend, the existing report generation flow, any production
deploy.

## 2. Roles, landing, and visibility

Single source of truth: a `MgmtAccess` helper that answers two questions —
"can role R open route X?" and "what is role R's landing route?".

Landing routes (via `roleHomePath`):

- `mgmt` -> `/mgmt/home`
- `me_associate` -> `/mgmt/personal` (repointed from the retired `/me`)

Navigation/route visibility:

| Nav item / route group        | mgmt | me_associate |
| ----------------------------- | ---- | ------------ |
| Personal (`/mgmt/personal`)   | Yes  | Yes          |
| Home (`/mgmt/home`)           | Yes  | Hidden + blocked |
| Programs / SkillUp / STF      | Yes  | Hidden + blocked |
| Team (`/mgmt/team`)           | Yes  | Hidden + blocked |
| Reporting: Dashboard          | Yes  | Yes          |
| Reporting: Studio             | Yes  | Yes          |
| Reporting: Teacher Report     | Yes  | Yes          |
| Reporting: Stats              | Yes  | Yes          |
| Reporting: Completed Reports  | Yes  | Yes          |

"Hidden + blocked" means the nav item is not rendered AND the router redirect
sends any direct navigation back to the role's landing route.

## 3. Architecture

### 3.1 Routing (`lib/core/router/app_router.dart`)

- Retire the `/me` placeholder. `roleHomePath(meAssociate)` returns
  `/mgmt/personal`.
- The redirect guard currently allows only `mgmt` into `/mgmt/*`. Extend it so
  `me_associate` is also allowed into `/mgmt/*`, then apply the per-role
  allow-list from `MgmtAccess`: if the role cannot open the requested
  `/mgmt/...` path, redirect to that role's landing route.
- Add routes inside the existing mgmt `ShellRoute`:
  - `GoRoute('/mgmt/personal', name: 'mgmtPersonal')` -> `PersonalPage`
  - `GoRoute(MgmtRoutes.reportingCompleted, name: 'mgmtReportingCompleted')` ->
    `CompletedReportsPage`

### 3.2 Access helper (`lib/features/mgmt/mgmt_access.dart`, new)

```dart
abstract final class MgmtAccess {
  // Routes a role may open inside the console.
  static bool canAccess(AppRole role, String path);
  // The landing route for a role.
  static String landing(AppRole role);
  // Whether a nav group/leaf is visible for a role (used by the nav panel).
  static bool showHome(AppRole role);
  static bool showPrograms(AppRole role);
  static bool showTeam(AppRole role);
  // Reporting group + Personal are visible to both supported roles.
}
```

Only `mgmt` and `me_associate` reach the console; `pf`/`hm` are routed
elsewhere by the guard and are out of scope here.

### 3.3 Navigation panel (`lib/features/mgmt/widgets/mgmt_nav_panel.dart`)

- Wrap Home, Programs (and its SkillUp/STF children), and Team in
  `if (MgmtAccess.showX(role))` so they do not render for `me_associate`.
- Add a Personal top item (icon `Icons.person_outline`) routing to
  `/mgmt/personal`, visible to both roles, placed at the top (above Home for
  mgmt; first item for me_associate).
- Add a Completed Reports leaf under the Reporting group, after Stats, routing
  to `MgmtRoutes.reportingCompleted`.
- `MgmtRoutes` gains `static const String personal = '/mgmt/personal';` and
  `static const String reportingCompleted = '/mgmt/reporting/completed';`.

### 3.4 Personal page (`lib/features/mgmt/pages/personal_page.dart`, new)

Vertical layout, centered, max-width constrained (consistent with other pages):

1. Identity header: avatar (photo or initials) + full name + role chip. Reads
   `authProvider.profile` (`fullName`, `photoPath`, `role`).
2. Greeting: time-of-day greeting with the user's first name.
3. `StaffCheckInCard` (section 3.5).
4. `QuickActionsBar` (section 3.6).

Used by both roles. Simple, no PF-specific metrics or assigned-schools.

### 3.5 Non-geofenced attendance

New, isolated from the PF flow.

- `lib/features/mgmt/providers/staff_check_in_provider.dart` (new):
  `staffCheckInProvider` — a check-in/out state machine that acquires GPS to
  record current location but performs NO geofence/near-point logic. Writes to
  the same `attendance` table (`Attendance` brick model) with:
  - `pf_id` = current user's profile id
  - `check_in_lat`/`check_in_lng`, `check_out_lat`/`check_out_lng` = recorded
    location (best effort; null if unavailable)
  - `check_in_point_id` = null, `check_out_point_id` = null
  - `check_out_flagged` = false (never flagged; there is no point to miss)
  - Rehydration mirrors `checkInProvider`: load today's open/completed
    attendance for the user (Brick on native, Supabase on web).
- `lib/features/mgmt/widgets/staff_check_in_card.dart` (new): a check-in card
  visually consistent with the PF `CheckInCard` (date, status pill, work timer,
  Check In/Out button) but with no "near point / not near any registered point"
  messaging. While acquiring GPS it shows a brief "Recording location" state and
  proceeds whether or not a precise fix is obtained.

Rationale for a separate provider/card: the PF `checkInProvider` near-point and
flagging logic is load-bearing for field attendance; a separate staff flow
avoids destabilizing it.

Schema note: no migration expected — `check_in_point_id` and
`check_out_point_id` are already nullable. Verify on staging that there is no
NOT NULL constraint or trigger requiring a point on `attendance` before
implementing; if one exists, route it through the schema-change workflow
(staging anytime; prod only 7 PM-9 AM IST with checklist).

### 3.6 Quick-action bar (shared)

- Extract the PF Profile tab's `_QuickActionsSection`, `_ActionCard`,
  `_ExpensesCard`, and the `_showComingSoon` helper into
  `lib/features/profile/widgets/quick_actions_bar.dart` as a public
  `QuickActionsBar` widget.
- `lib/features/pf_home/profile_tab.dart` uses the extracted widget in place of
  the inline section (behaviour unchanged).
- The Personal page uses the same `QuickActionsBar`.
- Tiles unchanged: Attendance Report (active, opens `AttendanceReportScreen`);
  Apply Leave / Week Off / Payslips / Expenses ("coming soon").

### 3.7 Completed Reports page

- `lib/features/reporting/pages/completed_reports_page.dart` (new): filters +
  table mirroring the Reporting Dashboard, listing only reports whose status is
  `released` or `shared`.
- `lib/features/reporting/providers/completed_reports_providers.dart` (new):
  `completedReportsProvider` reusing the existing queue providers' filter/query
  plumbing (`reporting_queue_providers.dart`), constrained to
  `status in ('released','shared')`.
- Each row exposes a View action that opens the report PDF in a popup/dialog
  (reusing `ReportPdfViewerPage`/the existing PDF viewer widget inside a
  dialog), with a Download action that saves the PDF under a human-readable
  report name (teacher + cycle).
- Visible to both `mgmt` and `me_associate`.

### 3.8 Org-wide default model

- New Supabase table (staging):

  ```sql
  create table if not exists public.app_settings (
    key text primary key,
    value text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users (id)
  );
  ```

  Seed: `insert ... ('reporting_default_model', 'minimax-m3')`. RLS: readable by
  authenticated users; writable only by `mgmt` (a policy checks the caller's
  role via the profiles table). The app writes the row directly through
  Supabase under the user's RLS context — no edge function.
- `reportingDefaultModelProvider` (FutureProvider<String>) reads
  `reporting_default_model` from `app_settings`, falling back to `minimax-m3`.
- `selectedModelProvider` initializes from `reportingDefaultModelProvider` when
  it resolves (instead of the hardcoded `_defaultModel`). The hardcoded const
  remains only as the ultimate fallback.
- Studio model selector (`studio_controls_panel.dart`) gains a "Save as default"
  button next to the model dropdown:
  - Visible/enabled only for `mgmt`.
  - On tap, persists the currently selected model to `app_settings`
    (`reporting_default_model`) and refreshes `reportingDefaultModelProvider`.
  - `me_associate` sees the dropdown and can change the model for their own
    session (`selectedModelProvider.set`) but has no "Save as default" button.

The mgmt-only restriction is enforced both in the UI (button hidden) and by the
table's write policy.

### 3.9 Responsive console shell

- `lib/features/mgmt/mgmt_shell.dart` becomes width-aware via `LayoutBuilder`
  with a breakpoint at ~900 px:
  - Wide (>= 900): current layout — header on top, fixed floating left nav +
    routed child in a Row.
  - Narrow (< 900): the nav panel is presented as a `Drawer` opened by a
    hamburger button in the header; the routed child takes the full width.
- `lib/features/mgmt/widgets/mgmt_header.dart` wraps its content in `SafeArea`
  (top) so the status-bar inset is additive and the bar no longer crops on
  phones; it shows a hamburger/menu button on narrow widths that opens the
  drawer.
- The same `MgmtNavPanel` content is reused inside the drawer (no duplicate nav
  definition). Selecting a nav item on narrow widths closes the drawer.
- Applies to both roles.

## 4. Data flow

- Auth: `authProvider.profile.role` drives `MgmtAccess` decisions in the router
  guard and the nav panel.
- Attendance: `staffCheckInProvider` -> `attendance` table (Brick on native,
  Supabase on web), keyed by `pf_id` = user id.
- Completed reports: `completedReportsProvider` -> existing report queue query
  plumbing filtered to released/shared.
- Default model: `app_settings` (`reporting_default_model`) ->
  `reportingDefaultModelProvider` -> seeds `selectedModelProvider`; mgmt "Save
  as default" writes back to `app_settings`.

## 5. Error handling

- Attendance: GPS permission/service errors surface inline on the card (reuse
  the PF pattern's messaging, minus geofence cases). A failed write keeps the
  prior state and shows a retry message. Location is best-effort: check-in still
  proceeds and records null coordinates if no fix is obtained, since there is no
  geofence gate.
- Default model: if `app_settings` read fails, fall back to `minimax-m3`. If the
  mgmt save fails, show a snackbar and leave the existing default unchanged.
- Completed reports / PDF: existing reporting error and empty states apply;
  download failures show a snackbar.
- Routing: unknown or unauthorized `/mgmt/...` paths for `me_associate` redirect
  to `/mgmt/personal`.

## 6. Testing

- Unit: `MgmtAccess` (per-role route allow-list and landing); redirect guard for
  `me_associate` (allowed routes pass, blocked routes redirect to
  `/mgmt/personal`); `staffCheckInProvider` writes null point ids and
  `check_out_flagged = false`.
- Widget: nav panel renders the correct item set per role; Personal page renders
  identity + greeting + check-in + quick actions; "Save as default" button shown
  only for mgmt.
- E2E (staging, both mobile and desktop layouts):
  1. me_associate login lands on Personal; nav shows only Personal + Reporting.
  2. me_associate check-in/out from an arbitrary location records lat/lng with
     null point, not flagged.
  3. me_associate opens Reporting Dashboard, Studio, Stats, Completed Reports.
  4. Completed Reports lists only released/shared; View opens the PDF; Download
     saves with a proper name.
  5. mgmt sets a default model; a new generation (mgmt and me_associate) uses it.
  6. me_associate overrides the model for a session without changing the default.
  7. Mobile: console header is not cropped; hamburger opens the drawer; nav
     selection closes it. Verify on a phone-width window.
  8. mgmt still sees Home/Programs/Team and the program snapshot Home.

## 7. Files

New:

- `lib/features/mgmt/mgmt_access.dart`
- `lib/features/mgmt/pages/personal_page.dart`
- `lib/features/mgmt/providers/staff_check_in_provider.dart`
- `lib/features/mgmt/widgets/staff_check_in_card.dart`
- `lib/features/profile/widgets/quick_actions_bar.dart`
- `lib/features/reporting/pages/completed_reports_page.dart`
- `lib/features/reporting/providers/completed_reports_providers.dart`
- `lib/features/reporting/providers/reporting_default_model_provider.dart`
- `aikarthya-supabase/supabase/migrations/<ts>_app_settings.sql` (staging)

Modified:

- `lib/core/router/app_router.dart` (guard, landing, new routes)
- `lib/features/mgmt/mgmt_shell.dart` (responsive layout + drawer)
- `lib/features/mgmt/widgets/mgmt_header.dart` (SafeArea + hamburger)
- `lib/features/mgmt/widgets/mgmt_nav_panel.dart` (role visibility, Personal +
  Completed Reports items, `MgmtRoutes` constants)
- `lib/features/pf_home/profile_tab.dart` (use extracted `QuickActionsBar`)
- `lib/features/reporting/widgets/studio/studio_controls_panel.dart` ("Save as
  default" button)
- `lib/features/reporting/providers/report_studio_providers.dart`
  (`selectedModelProvider` seeds from the persisted default)

## 8. Rollout

All work lands on staging. Build the full set, run the E2E checklist on staging
(mobile + desktop), get user confirmation, then schedule the production steps
(any prod schema change for `app_settings` only in the 7 PM-9 AM IST window with
a checklist; deploy any new/changed edge functions; APK rebuild) as a separate,
later step.
