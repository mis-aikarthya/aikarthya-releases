# PF SLA Compliance Report — Design Spec

**Date:** 2026-06-30
**Status:** Draft for review
**Author:** Akash Das (with Claude)
**Feature area:** Management Console → Team → PF Profile

---

## 1. Summary

Add a **"Download SLA Report"** action to each PF's profile page in the Management
Console. Clicking it generates a **one-page PDF** summarising that PF's SLA
compliance — purely from database data, with **no AI inference**. The PDF mirrors
the sample at `.report_assets/SLA-Report-SAMPLE-v3-Janhvi-Mishra.pdf`.

The report answers: how many observations the PF submitted, per school and over
what time frame, whether each report was generated and shared within the SLA, and
which reports are still pending the PF's own review.

---

## 2. The SLA model (the only logic in this feature)

All thresholds are deterministic date math. The clock for every observation
starts at **`obs_date`** (the classroom observation date), combined with the
observation's `end_time` when present, interpreted in **IST (Asia/Kolkata)**:

```
t0 = (obs_date + COALESCE(end_time, '18:00')) AT TIME ZONE 'Asia/Kolkata'
```

| Phase | Window | Owner | Compliant when |
|---|---|---|---|
| **1 — Generation** | t0 → t0 + 24h | Mgmt / system | `report_jobs.completed_at` ≤ t0 + 24h |
| **2 — Approval & Share** | t0 + 24h → t0 + 72h (48h) | **PF** | `report_shares.shared_at` ≤ t0 + 72h |
| **Headline (PF total)** | t0 → shared | **PF** | shared ≤ t0 + 72h |

- **Headline compliance = % of submitted observations whose report was shared
  within 72h of `obs_date`.** This is the PF's number ("majority focused on
  report send").
- Phase 1 (≤24h generation) is shown as a secondary, mgmt-owned metric.
- A report passes only if it cleared **both** phases.
- Each observation resolves to exactly one state:
  `on-time` · `pending PF review` (generated, not yet approved/shared) ·
  `breached` (with the breaching phase named: `gen>24h` or `share>72h`).

### Scope rules

- **Drafts are excluded.** The SLA universe is **submitted observations only**
  (`observations.status = 'submitted'`, which always have `submitted_at` and a
  `report_jobs` row). Drafts never entered the pipeline and do not count toward
  any total or percentage.
- **Respects the page's cycle filter.** If the manager has a cycle selected on
  the PF profile, the report covers only that cycle; with no cycle selected it
  covers all cycles / all-time.

### Open assumption for reviewer

`t0` uses `end_time` when available, else 18:00 IST. The alternative is plain
`obs_date` midnight. This only affects borderline same-day cases. **Confirm or
override at review.**

---

## 3. Architecture

No backend / schema change. Data is read with the **same query pattern as the
existing `reportingStatsProvider`** (`reporting_stats_providers.dart`), scoped to
one PF and joined/aggregated in pure Dart.

```
pf_profile_page.dart
  └─ [Download SLA Report] button (per-PF, respects cycle filter)
        │
        ▼
  pfSlaReportProvider((pfId, cycleId))         ← NEW, pure Dart
        │   reads: observations (status='submitted'), report_jobs,
        │          report_shares, report_reviews, schools
        ▼
  PfSlaReport (model)                          ← NEW
        │   headline counts + per-school rows + breach rows + pending rows
        ▼
  SlaReportPdfBuilder.build(report) → Uint8List  ← NEW
        │
        ▼
  report_pdf_share_helper.downloadOrShare(bytes, fileName)  ← EXISTING
        (web: blob download; native: save/share)
```

### New files

| File | Responsibility |
|---|---|
| `lib/features/mgmt/models/pf_sla_report.dart` | Immutable data model: `PfSlaReport`, `SlaSchoolRow`, `SlaBreachRow`, `SlaPendingRow`. One purpose: hold the computed report. |
| `lib/features/mgmt/providers/pf_sla_report_provider.dart` | `pfSlaReportProvider` — fetches the 5 tables for the PF, applies the SLA model, returns `PfSlaReport`. The ONLY place SLA thresholds live. |
| `lib/features/mgmt/utils/sla_report_pdf_builder.dart` | `SlaReportPdfBuilder.build(PfSlaReport) → Uint8List`. Layout only; no data logic. |

### Changed files

| File | Change |
|---|---|
| `lib/features/mgmt/pages/pf_profile_page.dart` | Add a "Download SLA Report" button (near the existing header/WDR button), wire it to the provider + builder + download helper, with a loading state and success/error `SnackBar`. |
| `pubspec.yaml` | Add the PDF-generation dependency (see §5). |

### Why these boundaries

- **Provider holds all SLA logic** → the thresholds (24h/72h, drafts-excluded,
  t0 definition) are testable in isolation and changeable in one file.
- **Builder is layout-only** → it takes a finished model and draws; it can be
  changed without touching logic, and vice versa.
- **Download reuses existing infra** → no new platform code.

---

## 4. Report layout (one page)

Reproduces `.report_assets/SLA-Report-SAMPLE-v3-Janhvi-Mishra.pdf`:

1. **Header** — title, PF name, "Auto-generated • No AI • Submitted observations
   only", generated date, cycle/window, SLA-clock note.
2. **Phase legend** — three cards: Generation (≤24h, mgmt), Approval & Share
   (48h, PF), Headline (obs → shared ≤72h).
3. **KPI strip (5)** — Submitted obs (drafts-excluded note) · Reports generated ·
   Gen SLA ≤24h % · **PF SLA shared ≤72h %** · Pending PF review.
4. **Per-school table** — school · obs · time frame · gen ≤24h (x/n) ·
   shared ≤72h (x/n) · pending. Plus a TOTAL row.
5. **SLA breaches table** — school · obs date · generated · shared ·
   breach phase · obs→share days. Capped (e.g. top 8 by delay) with a
   "… N more" line; **never silently truncate — state the dropped count.**
6. **Pending PF review table** — school · obs date · generated · status ·
   days pending.
7. **Footer** — definitions, drafts-excluded note, source tables, filter applied.

Filename: `SLA-{PFNameSlug}-{cycle|all}-{YYYYMMDD}.pdf`.

### Empty/edge states

- PF with 0 submitted observations → report still generates, KPI strip shows
  zeros, tables show a single "No submitted observations in this selection" row.
- Report generated but never shared → counts as **pending** if status is
  `pf_review`, else a **share-phase breach** once past 72h.
- Percentages with a 0 denominator render as `—`, not `0%` or a divide error.

---

## 5. PDF engine decision

**Recommended: `syncfusion_flutter_pdf`.**

- The app already depends on `syncfusion_flutter_charts` and
  `syncfusion_flutter_pdfviewer` (same Syncfusion license), so this adds no new
  vendor/licensing surface.
- `PdfGrid` renders bordered tables natively — a direct match for this layout.
- Works on web + Android + Windows, the platforms the console targets.

**Alternative: `pdf` + `printing`** (BSD/Apache, very popular, expressive layout
DSL). Lighter licensing but a new vendor in the tree. Download already solved by
`report_pdf_share_helper`, so `printing` is not required for saving.

*Decision pending reviewer (§ open question).*

---

## 6. Testing

- **Unit (logic):** feed `pfSlaReportProvider`'s pure aggregation function
  fixture rows covering: draft excluded; gen on-time vs late; shared on-time vs
  late; pending (`pf_review`, no share); 0-denominator; cycle filter. Assert the
  resulting `PfSlaReport` counts/percentages.
- **Golden / smoke (PDF):** build a `PfSlaReport` fixture, run
  `SlaReportPdfBuilder.build`, assert non-empty bytes + a PDF magic header;
  optionally a golden image of page 1.
- **Manual:** on the mgmt console, open a real PF (e.g. Janhvi Mishra), download,
  and verify the numbers match a direct SQL check against production.

---

## 7. Out of scope (YAGNI)

- Bulk "all PFs" / multi-page team export (possible later; per-PF first).
- Server-side / scheduled generation, email delivery.
- Configurable SLA thresholds in a settings UI (thresholds are constants in the
  provider for now).
- Charts/graphs — tables only.

---

## 8. Decisions locked with user

| Decision | Choice |
|---|---|
| SLA shape | Phased: 24h generation (mgmt) + 48h approval/share (PF) = 72h total |
| Headline metric | Full chain: shared within 72h of obs date |
| Clock start (t0) | `obs_date` (classroom observation date) |
| Drafts | Excluded — submitted observations only |
| Entry point | Mgmt Console → Team → PF Profile page |
| Date scope | Respects the page's cycle filter |
| Data source | Pure-Dart provider (no RPC/migration), prod data |
