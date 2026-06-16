# Flutter Frontend Audit Report

**Date:** 2026-06-15
**Scope:** `aikarthya-field-ops-app/lib` — features, core/widgets, core/theme, core/forms/widgets, core/router

---

## 1. UI/UX Problems

### 1.1 Poor layout on small screens
- **`features/pf_home/home_tab.dart:96-99`** — `ConstrainedBox(maxWidth: 640)` with `Align(alignment: Alignment.topCenter)` is repeated across many tabs (Home, Profile, Assessment, Reporting). On very narrow screens (< 320 dp), nested `DropdownButton` widgets and cycle filter chips can overflow because they rely on `Row` without `Wrap`.
- **`features/pf_home/home_tab.dart:194-216`** — The "Per-School Progress" header + cycle dropdown uses a `Row` with `Expanded` text, but the dropdown container has no `Flexible` wrapper and can overflow if translated labels get long.
- **`features/mgmt/widgets/mgmt_nav_panel.dart:63-65`** — `MgmtNavPanel` has fixed width `284` (`MgmtConsole.navWidth`). On small desktop/tablet viewports there is no responsive collapse behavior other than the hamburger toggle; the content area can shrink to unusable widths.

### 1.2 Confusing navigation
- **`core/router/app_router.dart:160-164`** — `/me` (M&E shell) routes to a `SizedBox.shrink()` placeholder with no visual feedback that the user is in the correct role shell. Same for `/hm` (`app_router.dart:231-235`).
- **`features/pf_home/profile_tab.dart:546-554`** — Attendance Report is pushed via `Navigator.push(MaterialPageRoute(...))` instead of GoRouter, breaking deep-link consistency and browser back-button behavior on web.
- **`features/pf_home/profile_tab.dart:564-599`** — Four Quick Action cards (Apply Leave, Week Off, Payslips, Expenses) are tappable but contain no-op `TODO(akash): Phase 7` callbacks. Users receive zero feedback on tap, which feels broken.

### 1.3 Missing feedback
- **`core/router/app_router.dart:314-318`** — During `AuthStatus.loading`, users are redirected to `/login` and see a static login screen with no "Authenticating..." indicator. The `LoadingAnimation` is never shown during this transition.
- **`core/forms/widgets/location_question_widget.dart:44-50`** — If location permission is denied forever, the widget silently returns without showing any message or guidance to open Settings.
- **`core/forms/widgets/image_question_widget.dart:205-222`** — `_pickImage` can throw (e.g., camera unavailable) but has no `try/catch`; the user sees no error feedback.

---

## 2. Inconsistent Theming

### 2.1 Hardcoded colors instead of theme values
- **`features/auth/login_screen.dart:281`** — `color: Colors.white` inside `CircularProgressIndicator` instead of `AppColors.onPrimary`.
- **`features/auth/login_screen.dart:102-105`** — `BoxShadow(color: Colors.black.withValues(alpha: 0.08), ...)` uses raw `Colors.black` instead of `AppColors.shadow`.
- **`features/splash/cold_boot_splash.dart:37`** — `backgroundColor: const Color(0xFFFEFCFE)` hardcoded; not in `AppColors`.
- **`features/splash/post_login_splash.dart:36`** — Same hardcoded background color.
- **`features/mgmt/widgets/mgmt_header.dart:44-48`** — `BoxShadow(color: Color(0x1A006783), ...)` hardcoded hex.
- **`features/mgmt/widgets/mgmt_nav_panel.dart:72-76`** — `BoxShadow(color: Color(0x14006783), ...)` hardcoded hex.
- **`features/pf_home/profile_tab.dart:908-920`** — Danger zone card uses inline `Color(0x14000000)` shadow and `AppColors.error.withValues(alpha: 0.2)` border instead of semantic tokens.
- **`features/pf_home/home_tab.dart:152-159`** — `_ActionChip` in attendance report uses hardcoded `Color(0xFFD9E6FF)` and `Color(0xFF2C5EB8)` (today chip) and `Color(0xFFF3E5F5)` / `Color(0xFF8E24AA)` (current month chip) with no theme mapping.
- **`features/reporting/widgets/queue/queue_filter_bar.dart:65-98`** — `DropdownButton<String?>` has no `dropdownColor` or `style` set; on dark mode (if ever added) it will fall back to system defaults and look broken.

### 2.2 Inconsistent padding
- **`features/pf_home/home_tab.dart:101`** — `padding: const EdgeInsets.fromLTRB(12, 12, 12, 24)`.
- **`features/pf_home/profile_tab.dart:71`** — `padding: const EdgeInsets.fromLTRB(12, 16, 12, 32)`.
- **`features/pf_home/assessment_tab.dart:173`** — `padding: const EdgeInsets.all(16)`.
These three sibling tabs under `PFShell` use different horizontal/vertical paddings, causing visual jump when switching tabs.

### 2.3 Mismatched typography
- **`features/pf_home/assessment_tab.dart:255-265`** — Form cards use `Theme.of(context).textTheme.titleMedium` while the rest of the app uses `AppTypography` tokens.
- **`features/pf_home/assessment_tab.dart:361-365`** — Section header uses `Theme.of(context).textTheme.titleSmall?.copyWith(...)` instead of `AppTypography`.
- **`features/reporting/pages/reporting_queue_page.dart:51-58`** — Page header uses `AppTypography.headlineLarge` and `AppTypography.bodyLarge`, but `MgmtPlaceholderPage` (`features/mgmt/pages/mgmt_placeholder_page.dart:24-26`) uses the same headline token for a centered stub, creating inconsistent hierarchy.

---

## 3. Missing Error / Empty / Loading States

### 3.1 Screens
- **`features/pf_home/home_tab.dart:176-181`** — `schoolsAsync.when(... error: (_, _) => const SizedBox.shrink())` hides the entire metrics grid on error instead of showing a retry button or inline error message.
- **`features/pf_home/home_tab.dart:221-247`** — `schoolProgressAsync.when(... error: (_, _) => const Text('Unable to load school progress.'))` shows plain text with no retry action.
- **`features/pf_home/profile_tab.dart:378-379`** — `asyncSchools.when(... error: (e, st) => const SizedBox.shrink())` — Assigned Schools section completely disappears on error; no fallback UI.
- **`features/pf_home/profile_tab.dart:392-393`** — `asyncSummary.when(... error: (e, st) => const SizedBox.shrink())` — summary line silently disappears on error.
- **`features/pf_teacher_profile/teacher_profile_screen.dart:82-90`** — Error state is just centered `Text('Failed to load profile: $err')` with no retry button or illustration.
- **`features/mgmt/pages/mgmt_home_page.dart:20-47`** — `MgmtHomePage` has no `loading` or `error` wrapper around the entire page; if the initial providers fail, the bands simply render with skeletons or blank data.

### 3.2 Widgets
- **`core/widgets/loading_animation.dart:12-26`** — `ColoredBox(color: Colors.white, ...)` hardcodes a white background. If the app ever supports dark mode, this will flash a white screen. Also no text fallback for accessibility.
- **`core/widgets/error_helpers.dart:10-39`** — `showSyncFailureModal` uses a generic `AlertDialog` with no scrollable content; long diagnostic strings will overflow on small screens.
- **`features/pf_home/widgets/sync_bar.dart:64-94`** — The sync bar shows "Offline" text but offers no direct action to open the offline queue detail or retry individual items.

---

## 4. Accessibility Gaps

### 4.1 Missing semantics labels
- **`features/pf_home/widgets/check_in_card.dart:148-179`** — The Check In / Check Out `FilledButton.icon` has no `Semantics` wrapper and no `tooltip`, so screen readers may only announce "Button" without context.
- **`features/pf_home/home_tab.dart:207-215`** — `_ProgressCycleDropdown` is a raw `DropdownButton` inside a `Container`; no `Semantics(label: 'Select cycle filter', ...)` wrapper.
- **`features/mgmt/widgets/mgmt_nav_panel.dart:160-164`** — `_chevron` icon is decorative but not marked with `excludeFromSemantics: true`.
- **`features/mgmt/widgets/mgmt_header.dart:55-59`** — Hamburger `IconButton` has `tooltip: 'Toggle navigation'` (good), but the logo `InkWell` (`features/mgmt/widgets/mgmt_header.dart:64-86`) has no tooltip or semantic label for screen readers.
- **`core/forms/widgets/form_question_container.dart:24-73`** — The required asterisk (`*`) is rendered as plain `Text` with `color: AppColors.error`. Screen readers will not announce that the field is required unless the `Semantics` widget wraps it with `hint: 'required'`.

### 4.2 Poor contrast / small touch targets
- **`core/forms/widgets/form_question_container.dart:41-48`** — Required asterisk is `TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)` with no minimum font size guarantee; on systems with scaled text it may become tiny.
- **`features/pf_home/widgets/check_in_card.dart:148-179`** — `FilledButton.icon` height is `40` (` SizedBox(height: 40, child: FilledButton.icon(...))`). Material recommends 48 dp minimum; this is below spec.
- **`features/mgmt/widgets/mgmt_header.dart:128-177`** — `_NetworkPill` is `height: 36`. While acceptable for non-interactive text, it is tappable and slightly below the 48 dp comfortable target.
- **`features/mgmt/widgets/mgmt_nav_panel.dart:165-209`** — Profile header `CircleAvatar(radius: 22)` and text are wrapped in a `Row` with no `Semantics` grouping; screen readers traverse name and team label separately without knowing they belong to a profile header.

### 4.3 Missing screen reader announcements
- **`core/widgets/offline_indicator.dart:21-75`** — The reconnect toast "Synced N" uses `ScaffoldMessenger.showSnackBar`, which does announce on TalkBack/VoiceOver, but the persistent banner itself has no `Semantics.liveRegion`, so the offline-to-online transition is not proactively announced.
- **`features/pf_home/widgets/check_in_card.dart:191-194`** — `_CompletedTodayBanner` has no `Semantics` wrapper; screen readers may skip it because it contains only `Row` > `Icon` + `Text` without a live region.

---

## 5. Polish Opportunities

### 5.1 Animations & transitions
- **`core/router/app_router.dart:78-81`** — `FadeInWrapper` is only applied to the `PFShell` root. Individual route transitions (e.g., `/pf/school/:schoolId` → `/pf/teacher/:teacherId`) have no page-level transition; they snap in instantly.
- **`features/pf_home/home_tab.dart:76-94`** — `RefreshIndicator` has no custom color or progress indicator styling; it defaults to the platform `CircularProgressIndicator`, which clashes with the brand teal on Android.
- **`features/pf_home/profile_tab.dart:98-108`** — `_IdentityCardSection` switches from skeleton → data instantly with no fade animation, causing a visual pop.

### 5.2 Haptic feedback
- **`features/pf_home/widgets/check_in_card.dart:148-179`** — Check In / Check Out button presses emit no haptic feedback. A light `HapticFeedback.lightImpact()` on state change would improve perceived responsiveness.
- **`features/pf_home/assessment_tab.dart:243-247`** — Form card taps have no haptic feedback.
- **`core/forms/widgets/form_footer.dart:46-69`** — Submit / Draft button presses have no haptic feedback.

### 5.3 Better placeholders
- **`features/pf_teacher_profile/teacher_profile_screen.dart:82-90`** — Error state could show an illustration (e.g., `Icons.error_outline` at 64 dp) instead of plain text.
- **`features/pf_home/home_tab.dart:176-181`** — `SizedBox.shrink()` on metrics error removes the card entirely; a `Placeholder` or inline retry card would look more intentional.
- **`features/mgmt/pages/mgmt_placeholder_page.dart:8-38`** — Placeholder page shows a static icon and text. Adding a skeleton shimmer or a "Coming soon" illustration would improve perceived quality.

### 5.4 Scroll physics & overscroll
- **`features/pf_home/profile_tab.dart:66-90`** — `SingleChildScrollView` has no `physics: const BouncingScrollPhysics()` or `ClampingScrollPhysics` explicit choice; on iOS the default bounce may feel odd against the `ConstrainedBox` center alignment.
- **`features/auth/login_screen.dart:93-94`** — `SingleChildScrollView` inside `SafeArea` has no `keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag`, so the keyboard persists when the user scrolls the login form.

---

## 6. Dead Code, Unused Imports, Outdated TODOs

### 6.1 Dead / placeholder code
- **`features/me_home/me_shell.dart:9-71`** — Entire `MEShell` is a placeholder with `Center(child: Column(...))` saying "Review queue and reports will appear here."
- **`features/hm/hm_shell.dart:9-72`** — Entire `HMShell` is a placeholder with the same pattern.
- **`features/mgmt/pages/mgmt_placeholder_page.dart:8-38`** — Explicitly acknowledged as stub, but six routes in `app_router.dart` all route to it; this is expected but still dead UI.
- **`core/router/app_router.dart:14-15`** — `MgmtNavPanel` is imported but never used directly in `app_router.dart` (only inside `MgmtShell`).

### 6.2 Unused imports
- **`features/pf_home/profile_tab.dart:17`** — `import 'package:flutter/services.dart';` is present. `Clipboard` and `ClipboardData` are used in `_copyDiagnostics`, so the import is actually used. However `profile_tab.dart:15` imports `package:flutter/foundation.dart` only for `kIsWeb` (used on lines 743 and 747), which is legitimate but narrow usage.
- **`features/pf_home/profile_tab.dart:9`** — `import 'package:aikarthya_field_ops/features/pf_home/providers/pf_home_providers.dart';` is imported but `pf_home_providers.dart` exports are not referenced inside `profile_tab.dart` (the file uses profile-specific providers). **Likely unused.**

### 6.3 Outdated TODOs
- **`features/pf_home/profile_tab.dart:564`** — `// TODO(akash): Phase 7` — Apply Leave action.
- **`features/pf_home/profile_tab.dart:579`** — `// TODO(akash): Phase 7` — Week Off action.
- **`features/pf_home/profile_tab.dart:590`** — `// TODO(akash): Phase 7` — Payslips action.
- **`features/pf_home/profile_tab.dart:599`** — `// TODO(akash): Phase 7` — Expenses action.
- **`features/pf_home/profile_tab.dart:869`** — `// TODO(akash): navigate to sync queue detail`.
- **`features/reporting/providers/reporting_queue_providers.dart:200`** — `// TODO(shared-count): implement shared count (handled elsewhere)`.

### 6.4 Duplicate logic
- **`features/mgmt/widgets/mgmt_header.dart:185-191`** — `_initials()` method is duplicated almost verbatim in `MgmtNavPanel` (`features/mgmt/widgets/mgmt_nav_panel.dart:47-53`). Consider a shared `StringExtensions` or `UserAvatar` widget.
- **`features/auth/login_screen.dart:351-376`** — `_LoginTextField` rebuilds its own `FocusNode` and focus-change logic. This could be simplified with `Focus` widget or reused across forms.

---

## Summary Table

| Category | Count | Severity |
|---|---|---|
| UI/UX Problems | 6 | Medium-High |
| Inconsistent Theming | 10 | Medium |
| Missing States | 9 | High |
| Accessibility Gaps | 9 | High |
| Polish Opportunities | 8 | Low-Medium |
| Dead Code / TODOs | 7 | Low |

**Recommended priority order:**
1. Fix missing error/loading states (especially `SizedBox.shrink()` error fallbacks).
2. Add `Semantics` wrappers and 48 dp minimum touch targets.
3. Replace hardcoded colors with `AppColors` / theme tokens.
4. Provide user feedback for no-op Quick Action taps (snackbar or disable).
5. Extract duplicate `_initials` logic and remove unused imports.
