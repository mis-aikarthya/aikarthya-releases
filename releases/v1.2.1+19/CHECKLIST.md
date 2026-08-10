# Release Checklist — Aikarthya Field Ops v1.2.1+19

Backend: **production** (`nuwqxlhuxwgevxvsyusj`) · Date: 2026-08-10

## Build & publish

- [x] `flutter analyze` — 0 errors, 0 warnings (info-level lints only)
- [x] `flutter test` — 1395 passed, 0 failed (re-run after the 10-Aug post-build PF fixes)
- [x] Version bumped to `1.2.1+19` per the 03-Jul-2026 patch-increment rule
- [x] App, supabase and docs repos committed and pushed
- [x] Backend promotion signed off (`db-edit-feedback-2026-08-10-visit-planner-prod-promotion.md`)
- [x] 30 migrations pushed to production — **at 11:20 IST, outside the
      18:00–09:00 window.** The breach was raised with the operator, who chose
      to push immediately rather than wait; recorded in the promotion plan's
      execution record. `push-prod.ps1`'s own 09:00–18:00 guard was left intact.
- [x] Promotion verified (ledger 216 / `20260812160000`; 40 schools with current + next cycle)
- [x] APK built (`flutter build apk --release`, APP_ENV defaults to production) —
      rebuilt 10-Aug after the PF fixes, 103.2 MB, SHA-256
      `3d0a8ce42b119ecf245265c2606f21e72130dc1aa51a6a36b9ed527578751f14`.
      The first attempt failed: `flutter pub get` writes `integration_test`
      (a dev dependency) into the gitignored `GeneratedPluginRegistrant.java`,
      and release builds drop dev dependencies from the Gradle classpath, so
      `package dev.flutter.plugins.integration_test does not exist`. Deleting
      the stale registrant and re-running `flutter pub get` cleared it. Expect
      this after any integration-test run.
- [x] ~~Windows zip built~~ — **out of scope for this release** by the operator's
      decision on 10-Aug: Android and web only, since that is what PFs use. The
      Windows build was produced and verified green but is not published and gets
      no `app_versions` row.
- [x] Web built (`--dart-define=APP_ENV=production`) + zipped — 22.1 MB
- [x] SHA-256 recorded in RELEASE-NOTES.md (APK + web)
- [ ] **Artifacts rebuilt after the 10-Aug post-build fixes.** The first APK
      (`db1f6ce1…`) and the first Windows build predate the PF home / planner
      corrections and must not ship. Every artifact needs a rebuild, a fresh
      SHA-256, and a re-run of the upgrade-path test below.
- [x] **Brick upgrade path proven on a device.** The full 1.2.0+18 → 1.2.1+19
      run below was against APK `db1f6ce1…`. It carries over to the shipping
      artifact because `lib/brick/` is byte-identical between the two builds —
      the post-build fixes touched providers, widgets and the sync service only,
      no model, adapter or SQLite migration. The rebuilt APK
      (`3d0a8ce4…`) was then installed with `adb install -r` over that already
      migrated store and launched clean: zero `E/flutter`, process alive, PF
      home and planner both rendering real production rows. A fresh uninstall /
      reinstall-from-18 cycle was not repeated, because it would have required
      re-entering credentials that are not held in this session. Original run:
      `brick_migration_test.dart` is
      a source scan, not a migration run, and this exact class of failure
      shipped once already in v1.1.1+16, so the upgrade was run for real on the
      `aikarthya_pixel` emulator: v1.2.0+18 installed and left to complete its
      full migration chain, then v1.2.1+19 installed over it with `adb install
      -r` (which also proves the signing key matches) and launched. Result:
      `versionCode=19 / versionName=1.2.1`, zero `E/flutter`, zero
      `duplicate column`, process alive 90s after launch, session carried over
      from the old install and the PF home screen rendered.
- [x] Uploaded to Google Drive — `Version1.2.1+19`, APK + web zip only:
      https://drive.google.com/drive/folders/1GBBmBtZTuVsQnrv0RWfi-SOIKm0BZ4gI
- [x] Web deployed to Cloudflare `app-aikarthya --branch=main` — deployment
      `fae90bd6`, listed as Environment **Production** / Branch **main**
- [x] `app_versions` rows upserted — **android + web only**, build 19,
      `is_active = true`, `force_update = false`. Older android and web rows
      (builds 18, 16, 15) set `is_active = false` so exactly one row per
      platform is current; the pre-existing windows rows were left untouched.
- [ ] Git tag `v1.2.1+19` pushed

## e2e / smoke (sign-off)

| Check | Result | Notes |
|-------|--------|-------|
| App upgrades in place over v1.2.0+18 (no Brick migration crash on first launch) | PASS | Emulator, 10-Aug-2026. All four new migrations applied clean; the `next_step` blocker fixed pre-release is proven dead |
| App boots offline after upgrade (local store intact) | | Signed-in session did survive the upgrade; airplane-mode boot still untested |
| PF: home Per-School Progress lists the PF's schools | PASS | Emulator on the shipping APK against **production**, 10-Aug-2026. Renders school cards, not the empty state. Prod was checked first so the result is decisive: all four PFs have a current `v_school_cycles` row for every assigned school (12/12, 9/9, 9/9, 4/4), so an empty list here would have been a client bug |
| PF: each school card shows Visits / Observations / Offline Sessions | PASS | e.g. New Girls School MJM — Visits 2/3, Observations 4/15, Offline Sessions 0/3, "Cycle Ends: Aug 19" |
| PF: planner opens on the calendar with no Cards view | PASS | `/pf/planner` renders August 2026 directly; no view toggle. Visit chips on 4, 6 and 7 Aug, suggestion markers on 19–22, today outlined, 15 Aug shaded as a holiday |
| PF: planner calendar renders the current cycle's visits | PASS | Same run; zero `E/flutter` across launch, sync, home and planner |
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
