# Aikarthya Field Ops v1.0.9+13

**Production release · 22-Jun-2026**

Bug-fix release for the reporting dashboard, report PDFs, and the SkillUp
session form.

## Highlights

**Reporting dashboard**
- Sortable column headers on every section (Queue, PF Review, Final,
  Reverted/Failed).
- Per-section pagination (10 rows/page) so large lists stay fast.
- Final section no longer shows a count badge.

**Report PDFs**
- Fixed PDFs that sometimes showed a blank page in Completed Reports and on the
  PF/teacher report screens; the viewer now reports a clear error with Retry.
- "Detailed Suggestions" bullets now sit on the same line as their text.
- Descriptive file names, e.g.
  `SkillUp_Tr.Akash-Das_Cycle1_Obs1_2026-06-22.pdf`.

**SkillUp session form**
- M&E Associate and Mgmt users can now save session details online (fixed a
  permission error on sync).

**Notifications**
- Fixed a rendering glitch when opening a report-review notification.

## Database
- `sessions` INSERT/UPDATE RLS for `me_associate` + `mgmt` — applied to
  production 22-Jun-2026.
- `app_versions` row for build 13 — applied to production 22-Jun-2026.

## Notes
- In-app updater: users on build 10 (v1.0.7+10) will be prompted to update
  (build 13 > 10).
- Backend: production (`nuwqxlhuxwgevxvsyusj`); all 8 edge functions redeployed.

Full details in [CHANGELOG.md](./CHANGELOG.md) and [SUMMARY.md](./SUMMARY.md).
