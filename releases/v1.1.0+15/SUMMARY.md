# Summary — Aikarthya Field Ops v1.1.0+15

Aikarthya Field Ops v1.1.0+15 ships the full M&E Management Console
(AIK-7 through AIK-42) to Android and Windows desktop, 80 commits on from the
last Android release (v1.0.9+13). The console now covers the SkillUp Overview
and Dashboard (stat cards, filter-aware Syncfusion charts, PF performance
table, PF profiles, school data + profiles), the team roster with admin edit
and school assignments, per-PF attendance, and Work Days Rewind (timeline,
trail map, and a full-year status heatmap). Background location capture moved
to a foreground service + WorkManager with env-driven ping cadence, and the
check-in event itself is now written as a `location_pings` row. The reporting
side gains a one-page SLA report PDF with a Download button on the PF profile.
Hardening fixes ship too: a null `school_id` (valid for online programme-level
sessions) no longer crashes the PF KPI provider, the Reports Queue pipeline
correctly labels the PF review stage and counts `pf_review` reports, and the
PF tables keep natural column width with horizontal scroll on phones. The
in-app updater now opens the Drive download page (dead native installer code
removed), and a new app logo is applied across all platforms. The web/PWA
build was released separately at v1.1.0+14 on Cloudflare Pages and is excluded
from this package.