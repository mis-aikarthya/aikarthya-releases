# Aikarthya Field Ops v1.0.7+10

**Production release · 21-Jun-2026**

Major release bundling the new AI reporting pipeline with the M&E Associate console.

## Highlights

**AI Observation Reporting pipeline**
- Chat-first Report Generation Studio with live (SSE) streaming.
- Scoring v2, DB-stored prompts & lockable report templates.
- PF review/approve flow, notifications, PDF generation & share.
- Queue dashboard: filters, sortable table, pagination.

**M&E Associate console**
- `me_associate` shares the `/mgmt` console behind a per-role allow-list (lands on `/mgmt/personal`).
- New Personal page with non-geofenced staff check-in.
- Completed Reports view (PDF view + download).
- Org-wide default reporting model (`app_settings`); responsive mobile-friendly shell.

## Database
- New `app_settings` table (org-wide settings) — applied to production 21-Jun-2026.

## Notes
- In-app updater: users on build 9 (v1.0.6+9) will be prompted to update (build 10 > 9).
- Backend: production (`nuwqxlhuxwgevxvsyusj`).

Full details in [CHANGELOG.md](./CHANGELOG.md) and [SUMMARY.md](./SUMMARY.md).
