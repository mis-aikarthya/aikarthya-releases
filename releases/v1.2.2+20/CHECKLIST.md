# CHECKLIST — v1.2.2+20

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | `flutter analyze` clean on master | ✅ | prior session (783 tests green) |
| 2 | `flutter test` full suite | ✅ | 783 tests, incl. 9 agent-config tests |
| 3 | APK installs + launches to login | ⬜ | pending device smoke |
| 4 | Login → PF Home loads (prod) | ⬜ | pending |
| 5 | Console role: agent bubble opens panel | ⬜ | UAT rounds 1–3 done on STAGING |
| 6 | PF: `/agent/chat` page loads | ⬜ | done on staging :8765 + staging Pages |
| 7 | Leave apply → category/quota visible | ⬜ | tested on staging |
| 8 | Cycle End queue + template builder open | ⬜ | tested on staging |
| 9 | School Closures date-range editor | ⬜ | tested on staging |
| 10 | Update prompt offers 1.2.2+20 (app_versions row) | ⬜ | pending Step 7 |
| 11 | Prod agent guest boots after migrations | ⬜ | pending backend wave |

**Sign-off:** pending — complete rows 3–11 after backend promotion, then close FEEDBACK.