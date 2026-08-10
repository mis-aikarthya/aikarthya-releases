# Release Checklist — Aikarthya Field Ops v1.2.1+19

Backend: **production** (`nuwqxlhuxwgevxvsyusj`) · Date: 2026-08-10

## Build & publish

- [x] `flutter analyze` — 0 errors, 0 warnings (info-level lints only)
- [x] `flutter test` — 1393 passed, 0 failed
- [x] Version bumped to `1.2.1+19` per the 03-Jul-2026 patch-increment rule
- [x] App, supabase and docs repos committed and pushed
- [ ] Backend promotion signed off (`db-edit-feedback-2026-08-10-visit-planner-prod-promotion.md`)
- [ ] 30 migrations pushed to production inside the 18:00–09:00 IST window
- [ ] Promotion verified (ledger 216 / `20260812160000`; 40 schools with current + next cycle)
- [ ] APK built (`flutter build apk --release`, APP_ENV defaults to production)
- [ ] Windows zip built
- [ ] Web built (`--dart-define=APP_ENV=production`) + zipped
- [ ] SHA-256 recorded in RELEASE-NOTES.md
- [ ] Uploaded to Google Drive
- [ ] Web deployed to Cloudflare `app-aikarthya --branch=main`
- [ ] `app_versions` rows upserted (android + windows + web, is_active = true, build 19)
- [ ] Git tag `v1.2.1+19` pushed

## e2e / smoke (sign-off)

| Check | Result | Notes |
|-------|--------|-------|
| App upgrades in place over v1.2.0+18 (no Brick migration crash on first launch) | | The `next_step` duplicate-column blocker fixed pre-release; this is its live proof |
| App boots offline after upgrade (local store intact) | | |
| PF: planner calendar renders the current cycle's visits | | |
| PF: acting on a suggestion withdraws it and re-spaces the rest | | |
| PF: early visit and closure-day visit both raise a sanction request with reason | | |
| PF: cycle summary rail shows correct working-day boundaries | | |
| PF: closures visible are only the PF's own schools | | |
| PF: offline session topic saved from Update > Toggle Offline Session appears in the scheduler | | Web mapper gap fixed; verify on web specifically |
| Mgmt: sanction review queue approve / reject round-trips | | |
| Mgmt / M&E: school closure logging saves | | |
| Mgmt: school consolidated report review states | | |
| Consolidated report shows working vs non-working day counts | | |
| Devices still on v1.2.0+18 keep loading cycles after the promotion | | Compatibility claim in the promotion plan |

## Notes

- Signed with debug keystore (existing TODO) — same key as v1.2.0+18 for this package.
- The backend half of this release must land before the APK is distributed, or the
  planner surfaces fail against the pre-promotion schema.
