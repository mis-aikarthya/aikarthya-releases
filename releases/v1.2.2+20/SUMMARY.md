# SUMMARY — v1.2.2+20

This release ships four months of field-ops work in one wave: the **Aikarthya
Agent** (an AI assistant embedded across the web console and PF chat, backed
by its own Supabase agent tables and a static Cloudflare Pages guest app),
**leave management** with categories, quotas and an office-holidays calendar,
**STF quick actions** with dedicated fellow leave/attendance pages, and the
complete **Cycle End reporting pipeline** with a redesigned template builder,
rich-text editing, previews and AI-assisted report text. Backend-first
promotion is safe for the live v1.2.1+19 population — every pending
migration is additive — but the new app must not ship (Drive publish +
app_versions row) until the 22 migrations, prod backfills, edge-function
wave and vault seeding are done on production.