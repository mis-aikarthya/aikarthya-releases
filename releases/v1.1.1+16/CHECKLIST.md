# Test Checklist — Aikarthya Field Ops v1.1.1+16

Sign off each row after verifying on a fresh install from the Drive artifacts.

> **Re-spin 03-Jul-2026 (~17:45 IST).** The first 1.1.1+16 APK/Windows build
> cold-boot-crashed (`duplicate column name: next_step` in Brick migration
> `20260702204008`); fixed by stripping the spurious `InsertColumn`/`DropColumn`
> `next_step` (commit `95fa77d`, pushed to `master`). Stuck installs self-heal on
> next launch. The artifacts on Drive were replaced in place (same folder link).
> Re-verify the cold-boot row below on a device that hit the crash.

## Android (APK, min_sdk 21)

- [ ] App installs over v1.1.0+15 and the in-app updater offers the Drive
      download page (dismissible; force_update = false).
- [ ] Existing PF / M&E flows unchanged: sign in as mgmt -> M&E console loads
      (Overview, Dashboard, Team, PF profile, Work Days Rewind); sign in as PF
      -> home + observation / session / attendance submit work.
- [ ] School Profile form shows the new "Follows govt holidays?" toggle and
      saves without error (column already on prod).
- [ ] mgmt -> /mgmt/stf/checkins page loads (last 30 days; empty until STF
      fellows are provisioned).
- [ ] STF facilitator shell renders for an stf_facilitator account (Home /
      Assessments / Profile tabs; resync button; real-month metrics).
- [ ] STF session / observation forms open and submit for an stf_facilitator
      (clone of PF flow, rewired to stf_* persistence).
- [ ] DCR journal: save as draft, resume via tap, edit submitted, swipe-to-
      discard a draft.
- [ ] Background location + check-in still writes a `location_pings` row; pings
      resume after restart.

## Windows desktop (zip)

- [ ] App launches from the unzipped Release folder.
- [ ] Sign in + PF / mgmt smoke; STF facilitator shell renders (if a facilitator
      account is available).

## Web/PWA (app-aikarthya.pages.dev)

- [ ] Cloudflare Pages Production deploy shows Environment=Production,
      Branch=main in `wrangler pages deployment list`.
- [ ] App boots on app-aikarthya.pages.dev; PF online check-in / observation
      submit work; mgmt console loads.
- [ ] HTML renderer (not CanvasKit) confirmed in the served index.html.

## Backend (production)

- [ ] `app_versions` has android 1.1.1+16 (is_active, min_sdk 21, download_url
      = Drive folder) and windows 1.1.1+16 (is_active, min_sdk NULL).
- [ ] Old android 1.1.0+15 row remains is_active=false (superseded).
- [ ] `schools.follows_govt_holidays` and `stf_attendance` present on prod
      (confirmed pre-release).
- [ ] (After 7 PM IST) remaining STF-only migrations applied to prod + all edge
      functions redeployed to prod (incl. send-stf-email).

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Built by | Agent | 2026-07-03 | Artifacts + Drive upload + app_versions rows + web deploy |
| Tested by | | | |
| Approved by | | | |