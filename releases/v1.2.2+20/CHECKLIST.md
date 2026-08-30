# CHECKLIST — v1.2.2+20

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | `flutter analyze` clean on master | ✅ | prior session (783 tests green) |
| 2 | `flutter test` full suite | ✅ | 783 tests, incl. 9 agent-config tests |
| 3 | APK installs + launches to login | ⬜ | pending device smoke (Drive folder ready) |
| 4 | Login → PF Home loads (prod) | ⬜ | pending device smoke |
| 5 | Console role: agent bubble opens panel | ⬜ | UAT rounds 1–3 passed on STAGING backend |
| 6 | PF: `/agent/chat` page loads | ⬜ | verified on staging host + staging Pages |
| 7 | Leave apply → category/quota visible | ⬜ | tested on staging; prod schema live |
| 8 | Cycle End queue shows jobs | ✅ | prod backfill seeded 23 ready jobs |
| 9 | School Closures date-range editor | ⬜ | tested on staging; migration live on prod |
| 10 | Update prompt offers 1.2.2+20 (app_versions row) | ✅ | prod row live (published 2026-08-31) |
| 11 | Prod agent guest boots after migrations | ✅ | aikarthya-agent.pages.dev; tables migrated, AI control plane seeded |

**Backend wave executed 2026-08-31 (PROMOTE):** 22 migrations (all in supabase_migrations history), prod cycle-end backfill (4 groups / 29 members / 23 ready C1 jobs), 32 edge functions redeployed, vault seeded from staging (OpenRouter + Ollama credentials), AI routes incl. aikarthya_agent, app_versions published, prod web deployed to app-aikarthya (app.aikarthya.org.in), tag v1.2.2+20 pushed.

**Sign-off:** release published; rows 3–4 pending one device smoke of the Drive APK.