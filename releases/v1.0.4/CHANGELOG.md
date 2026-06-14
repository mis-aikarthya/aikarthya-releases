# Aikarthya Field Ops v1.0.4 — Changelog

**Release Date:** 15-Jun-2026
**Build Number:** 4
**APK Size:** 74.0 MB

## New Features

### 1. Reporting Pipeline Foundation (Phase 1)
- Pure-Dart rubric scoring engine with full test coverage (PRD §6).
- Reusable report template with blank stationery frame (PDF + A4 PNG) bundled in assets.
- Report content builder and draft persistence model for offline report authoring.
- Reporting queue screen (read-only) with shared filter chips for quick navigation.

### 2. Management Console (Mgmt) Shell
- New management dashboard shell with header and left navigation panel.
- Programme band with tabs, KPI cards, attendance band, and field map band.
- Scrollable programme tabs to prevent overflow on narrow viewports.

### 3. Splash & Profile Polish
- Splash screen background updated to `#fefcfe` for seamless GIF blending.
- Splash GIF now fills the screen with 20 px padding instead of a small 200×200 box.
- Profile role label updated from "Programme Fellow" to "Programme Facilitator".

## Fixes

### 1. ProgrammeBand Overflow
- Fixed `Row` overflow in `_ProgrammeTabs` by wrapping tabs in a `SingleChildScrollView` with horizontal scrolling.

### 2. Form Field Updates
- Updated school, leader, and teacher form fields for improved data capture.

## Database Migrations (this release)

| Migration | Description |
|---|---|
| `20260612120000_form_field_updates.sql` | Form field schema adjustments |
| `20260615120000_reporting_pipeline_additions.sql` | Reporting pipeline tables and functions |

## Test Coverage
- 334 tests passing, 0 failures
- `flutter analyze`: 0 errors, 0 warnings

---
*Previous build: v1.0.3 (build 3, 12-Jun-2026)*
