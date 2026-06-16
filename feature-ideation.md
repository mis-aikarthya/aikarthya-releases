# Feature Ideation — Design Studio & Flutter App

**Date:** 2026-06-15
**Author:** Claude Team
**Context:** Based on audit of `design-playground/` and `aikarthya-field-ops-app/lib/`.

---

## 1. Design Studio Features

### 1.1 Undo/Redo System (M — Already Exists, Needs Polish)
**Status:** The `editorStore.ts` already maintains `past` and `future` stacks and exposes `undo()` / `redo()`. The TopBar wires them to buttons.
**What is missing:**
- Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z).
- Visual disabled state on buttons when the respective stack is empty.
- A history panel showing human-readable action labels (e.g., "Changed Button text to 'Save'", "Moved Text into Column").
**Files to change:**
- `design-playground/src/store/editorStore.ts` — add `actionLabel` to each commit.
- `design-playground/src/app/TopBar.tsx` — wire keyboard listeners, disable buttons, maybe add a history dropdown.
**Effort:** Small (1–2 days).

---

### 1.2 Component Library / Reusable Widget Presets (M)
**Why:** The `WidgetType` union already includes `ComponentInstance`, `Project` already has `components: ComponentDef[]`, and `WidgetNode` has `componentRef`. None of this is exposed in the UI. Designers currently rebuild the same cards, buttons, and headers from scratch per screen.
**Implementation notes:**
- Add a "Components" tab to the left palette (`Palette.tsx`).
- Let users select any subtree and "Extract as Component" (saves to `Project.components`).
- `ComponentInstance` nodes reference `componentRef` by name and can override exposed props.
- The Dart generator needs to emit the component as a `StatelessWidget` and instantiate it.
**Files to change:**
- `design-playground/src/model/types.ts` — ensure `Project` is stored somewhere (currently only `ScreenModel` is in editor state).
- `design-playground/src/store/editorStore.ts` — add `extractComponent`, `addComponentInstance` actions.
- `design-playground/src/palette/Palette.tsx` — new tab for components.
- `design-playground/src/renderer/renderNode.tsx` — render `ComponentInstance` by looking up `componentRef`.
- `design-playground/src/theme/dartGenerator.ts` — new `generateComponentWidget()` function.
**Effort:** Medium (3–5 days).

---

### 1.3 Design Tokens Export (JSON, CSS Variables) (S)
**Why:** Right now tokens are only exported as Dart `AppColors` / `AppTypography`. Design handoff to web dashboards, marketing sites, or external contractors needs JSON / CSS.
**Implementation notes:**
- Add an "Export Tokens" button next to "Export Changes Report" in `TopBar.tsx`.
- JSON export: flat or nested object of `colors`, `typography`, `spacing`, `radius`.
- CSS variables export: `--color-primary: #006783;`, `--font-display: ...`.
- Could also generate a Tailwind config snippet.
**Files to change:**
- `design-playground/src/theme/tokenExporter.ts` (new).
- `design-playground/src/app/TopBar.tsx` — add export button.
**Effort:** Small (1 day).

---

### 1.4 Animations in Generated Dart (C)
**Why:** Currently no animation properties exist in `PropDescriptor`. Even simple implicit animations (fade, scale, slide) would make generated UIs feel native.
**Implementation notes:**
- Add an `Animation` group to descriptors with props like `entrance` (`none` | `fade` | `slideUp` | `scale`), `duration`, `curve`.
- The renderer can preview via CSS transitions.
- Dart generator wraps widgets in `AnimatedContainer`, `FadeTransition`, or a custom `EntranceWrapper`.
**Files to change:**
- `design-playground/src/schema/descriptor.ts` — extend `ControlType` and `PropDescriptor`.
- Every widget schema file — add animation props.
- `design-playground/src/renderer/renderNode.tsx` — inject CSS transitions for preview.
- `design-playground/src/theme/dartGenerator.ts` — emit animation wrappers.
**Effort:** Medium–Large (5–7 days). Risk: over-complicating the generator.

---

### 1.5 Multi-Screen Management (M)
**Why:** The `Project` type has `screens: ScreenModel[]`, but `editorStore.ts` only tracks a single `screen`. A real app has dozens of screens (login, home, forms, profiles, mgmt console). Designers need to create, rename, duplicate, and switch between screens.
**Implementation notes:**
- Add a screen switcher sidebar or top tab bar.
- Persist `Project` (not just `ScreenModel`) to localStorage or a backend table.
- Export Changes Report should include which screens were touched.
**Files to change:**
- `design-playground/src/store/editorStore.ts` — change state shape from `screen` to `project + activeScreenId`.
- `design-playground/src/app/Shell.tsx` — add screen tabs / list.
- `design-playground/src/diff/diffEngine.ts` — support diffing multiple screens (or run per-screen).
**Effort:** Medium (4–6 days). High impact.

---

### 1.6 Version History / Snapshots (S)
**Why:** The existing undo stack is session-only and in-memory. Designers accidentally refresh and lose work. Snapshots let them label milestones ("v1 before review", "v2 after feedback").
**Implementation notes:**
- Persist snapshots to `localStorage` or IndexedDB.
- Add a snapshots panel with timestamps, labels, and a "Restore" action.
- Each snapshot is a full `Project` JSON blob (gzipped if needed).
- Could be extended later to cloud sync.
**Files to change:**
- `design-playground/src/store/snapshotStore.ts` (new).
- `design-playground/src/app/Shell.tsx` or `TopBar.tsx` — snapshot UI.
**Effort:** Small–Medium (2–3 days).

---

### 1.7 Real-Time Collaboration Markers (W)
**Why:** Useful for a design team, but the current architecture is entirely local. Requires WebSockets/Yjs/CRDT backend.
**Blockers:** No backend infra for real-time sync; no auth in Design Studio.
**Verdict:** Won't have for Q3. Revisit after multi-screen management and cloud persistence are built.

---

### 1.8 Better Preview Modes (Tablet, Dark Mode) (S)
**Why:** `ViewportFrame` already supports `mobile | tablet | desktop | wide`. What's missing:
- Dark mode toggle: `ScreenModel.themeMode` exists but is not wired to the preview renderer or exported to Dart.
- Device frames (iPhone bezel, tablet bezel) for stakeholder demos.
- Rotatable viewport (portrait/landscape).
**Implementation notes:**
- Pass `themeMode` into `renderNode.tsx` and switch CSS variables.
- In Dart generator, emit a `ThemeData.dark()` alongside the light theme, or at least respect the token.
- Add a rotate button next to viewport switcher.
**Files to change:**
- `design-playground/src/renderer/renderNode.tsx` — theme-aware CSS.
- `design-playground/src/theme/dartGenerator.ts` — dark theme export.
- `design-playground/src/app/TopBar.tsx` — dark mode toggle, rotate button.
**Effort:** Small–Medium (2–3 days).

---

## 2. Flutter App Features

### 2.1 Dashboard Widgets for Mgmt (Charts, Stats Cards) (M)
**Why:** The Mgmt Home page already has KPI tiles (`KpiBand`), programme cards, attendance, and a map. But `/mgmt/skillup/dashboard` and `/mgmt/skillup/overview` are currently `MgmtPlaceholderPage`. Management users need visual trends (cycle spread bar chart, report funnel, session completion over time).
**Implementation notes:**
- Use `fl_chart` (already a common choice) or custom `CustomPaint` bars/pies to avoid heavy deps.
- Data is already available via existing providers (`mgmtCycleSpreadProvider`, `mgmtReportFunnelProvider`, `mgmtSessionTargetsProvider`).
- Start with:
  - Cycle spread horizontal bar chart (`byCycle` map).
  - Report funnel vertical bar (not_generated → generated → released → shared).
  - Session target donut (offline vs online done/target).
**Files to change:**
- `aikarthya-field-ops-app/lib/features/mgmt/pages/mgmt_dashboard_page.dart` (new).
- `aikarthya-field-ops-app/lib/features/mgmt/widgets/charts/` (new folder for chart widgets).
- `aikarthya-field-ops-app/lib/core/router/app_router.dart` — replace `MgmtPlaceholderPage` for dashboard route.
**Effort:** Medium (4–5 days). High visibility.

---

### 2.2 Offline-First UX Improvements (S)
**Why:** The app already has `offlineQueueCountProvider`, `syncServiceProvider`, and the network pill in `MgmtHeader`. But users can't see *which* records are queued, their retry status, or errors.
**Implementation notes:**
- Add a "Sync Details" bottom sheet / dialog accessible from the network pill or a new settings entry.
- Show list of queued items with entity type, timestamp, and error message if failed.
- Add a "Retry Failed" bulk action and "Clear Completed".
- Toast / Snackbar on sync completion (`X records synced`).
**Files to change:**
- `aikarthya-field-ops-app/lib/core/brick/queue_provider.dart` — expose detailed queue items.
- `aikarthya-field-ops-app/lib/features/mgmt/widgets/sync_detail_sheet.dart` (new).
- `aikarthya-field-ops-app/lib/features/mgmt/widgets/mgmt_header.dart` — long-press or tap pill to open sheet.
**Effort:** Small–Medium (3–4 days).

---

### 2.3 Bulk Actions in Lists (S)
**Why:** Mgmt users need to select multiple schools/teachers/reports and act on them (e.g., export CSV, mark inactive, bulk-assign PF). Currently there are no data tables with selection.
**Implementation notes:**
- Introduce a reusable `SelectableDataTable` or `BulkActionList` widget.
- Use Flutter's `DataTable` with checkbox column + sticky header.
- Actions appear in an app bar bottom sheet when items are selected.
- First target: School Data page (`/mgmt/skillup/school-data`) which currently doesn't exist.
**Files to change:**
- `aikarthya-field-ops-app/lib/core/widgets/selectable_list.dart` (new).
- `aikarthya-field-ops-app/lib/features/mgmt/pages/mgmt_school_data_page.dart` (new).
**Effort:** Medium (3–4 days).

---

### 2.4 Search / Filter Across Entities (M)
**Why:** As the org scales, scrolling through hundreds of schools or teachers is impractical. The mgmt console needs global and per-page search.
**Implementation notes:**
- Add a `SearchBar` to `MgmtHeader` or to each page.
- Debounced query against Supabase `.ilike()` or client-side filter for offline resilience.
- For Schools: search by name, area, cycle number.
- For Team: search by PF name.
**Files to change:**
- `aikarthya-field-ops-app/lib/features/mgmt/providers/mgmt_search_providers.dart` (new).
- `aikarthya-field-ops-app/lib/features/mgmt/widgets/mgmt_header.dart` — add search field (collapsible, desktop-only or responsive).
- Each entity list page.
**Effort:** Small–Medium (2–3 days). High ROI.

---

### 2.5 Pull-to-Refresh (M)
**Why:** Standard mobile pattern. The mgmt providers are `FutureProvider`s that auto-fetch once; users have no way to manually refresh a single band without tapping the global sync pill.
**Implementation notes:**
- Wrap each band / page body in `RefreshIndicator`.
- On refresh, invalidate the relevant provider(s) only (not the whole home set).
- This also works for PF screens (`HomeTab`, `AssessmentTab`).
**Files to change:**
- `aikarthya-field-ops-app/lib/features/mgmt/pages/mgmt_home_page.dart` — wrap `SingleChildScrollView` in `RefreshIndicator`.
- Any other list-heavy page.
**Effort:** Small (1 day). Should be done immediately.

---

### 2.6 Deep Linking Improvements (S)
**Why:** GoRouter is already configured, but there is no handling of push notifications that open specific records, no Android/iOS intent filters for `/pf/school/:schoolId`, and no shareable URLs from within the app.
**Implementation notes:**
- Register URL schemes / universal links in `AndroidManifest.xml` and `Info.plist`.
- Handle `go_router` `extra` payloads safely when coming from cold start.
- Add a "Share" action on `SchoolProfileScreen` and `TeacherProfileScreen` that copies a deep link to clipboard.
**Files to change:**
- `android/app/src/main/AndroidManifest.xml`
- `ios/Runner/Info.plist`
- `aikarthya-field-ops-app/lib/core/router/app_router.dart` — add `redirect` guards for malformed deep links.
- Entity detail screens — add share button.
**Effort:** Small–Medium (2–3 days).

---

### 2.7 Accessibility Enhancements (S)
**Why:** Field ops users may have vision impairments or use the app in bright sunlight. The app has no explicit `Semantics` labels, and some custom widgets (KPI chips, map pins) are likely invisible to screen readers.
**Implementation notes:**
- Audit all custom widgets for `Semantics` wrappers.
- Ensure every `IconButton` has a `tooltip`.
- Add `MergeSemantics` around KPI bands so screen readers announce "Partner Schools, 42, across 5 areas" as one sentence.
- Test with TalkBack / VoiceOver.
**Files to change:**
- `aikarthya-field-ops-app/lib/features/mgmt/widgets/home/*.dart`
- `aikarthya-field-ops-app/lib/features/mgmt/widgets/mgmt_nav_panel.dart`
- `aikarthya-field-ops-app/lib/features/mgmt/widgets/mgmt_header.dart`
**Effort:** Small–Medium (3–4 days, mostly testing).

---

### 2.8 Biometric Auth Option (C)
**Why:** PFs log in multiple times a day in the field. PIN / biometric re-auth is faster than full email+password each time.
**Implementation notes:**
- Use `local_auth` package.
- After first login, store a refresh token securely (already via `flutter_secure_storage`?) and offer biometric unlock.
- Add toggle in Profile / Settings.
- Fallback to password on biometric failure or device change.
**Files to change:**
- `aikarthya-field-ops-app/lib/core/auth/auth_notifier.dart` — add biometric unlock path.
- `aikarthya-field-ops-app/lib/features/auth/login_screen.dart` — biometric prompt on app resume.
- `pubspec.yaml` — add `local_auth`.
**Effort:** Medium (3–4 days). Security-sensitive; needs thorough testing.

---

## 3. Summary Table

| # | Feature | MoSCoW | Effort | Impact |
|---|---------|--------|--------|--------|
| DS-1 | Undo/Redo polish (shortcuts, labels) | **Must** | S | High |
| DS-2 | Component library / presets | **Must** | M | Very High |
| DS-3 | Design tokens export (JSON/CSS) | **Should** | S | Medium |
| DS-4 | Animations in generated Dart | **Could** | M–L | Medium |
| DS-5 | Multi-screen management | **Must** | M | Very High |
| DS-6 | Version history / snapshots | **Should** | S–M | High |
| DS-7 | Real-time collaboration markers | **Won't** | L | High |
| DS-8 | Better preview modes (dark, rotate) | **Should** | S–M | Medium |
| FL-1 | Dashboard widgets (charts) | **Must** | M | Very High |
| FL-2 | Offline-first UX (queue details) | **Should** | S–M | High |
| FL-3 | Bulk actions in lists | **Should** | M | Medium |
| FL-4 | Search / filter across entities | **Must** | S–M | High |
| FL-5 | Pull-to-refresh | **Must** | S | High |
| FL-6 | Deep linking improvements | **Should** | S–M | Medium |
| FL-7 | Accessibility enhancements | **Should** | S–M | High |
| FL-8 | Biometric auth option | **Could** | M | Medium |

---

## 4. Recommended Sprint Order

**Phase 1 (Quick wins + Foundations):**
1. DS-1 Undo/Redo polish
2. DS-8 Better preview modes (dark mode toggle)
3. FL-5 Pull-to-refresh
4. FL-4 Search / filter across entities
5. DS-3 Design tokens export

**Phase 2 (High-impact structural):**
6. DS-5 Multi-screen management
7. DS-2 Component library / presets
8. FL-1 Dashboard widgets (charts)
9. FL-7 Accessibility enhancements

**Phase 3 (Polish & advanced):**
10. FL-2 Offline-first UX improvements
11. FL-6 Deep linking improvements
12. DS-6 Version history / snapshots
13. FL-3 Bulk actions in lists
14. DS-4 Animations in generated Dart
15. FL-8 Biometric auth option

---

*End of report.*
