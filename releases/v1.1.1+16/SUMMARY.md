# Summary — Aikarthya Field Ops v1.1.1+16

> **Re-spin 03-Jul-2026 (~17:45 IST).** The first 1.1.1+16 APK/Windows build
> cold-boot-crashed on Android/Windows: the G10 Brick migration
> `20260702204008` re-inserted `Observation.next_step`, which already exists via
> the `RenameColumn` in migration `20260616140256`, so boot threw
> `duplicate column name: next_step` and the app stuck on the first screen.
> Fixed by stripping the spurious `InsertColumn`/`DropColumn` `next_step`
> (commit `95fa77d`); web was unaffected (Brick is gated behind
> `kIsBrickSupported`, false on web). Stuck installs self-heal on next launch.
> Drive artifacts replaced in place (same folder link / `app_versions` rows).

Aikarthya Field Ops v1.1.1+16 ships the Super Teacher Fellowship (STF) app
layer end to end (P0 foundations through Phase 8) plus the G01-G17 + G05/G06
roadmap gap-fix, 22 commits on from v1.1.0+15 (the M&E console release). STF
adds two new roles (`stf_fellow`, `stf_facilitator`), a facilitator 3-tab shell
(Home / Assessments / Profile), fellow web check-in/out against `stf_attendance`,
STF session and observation forms cloned from the PF equivalents and rewired to
STF persistence, an OCR submission form + SLA dashboard, a fellow feedback
form, a DCR (Daily Class Report) journal with draft / submitted states +
tap-to-resume + swipe-to-discard, classroom assignments, and a facilitator home
dashboard with real-month metrics and resync. The gap-fix hardens STF (email
templates, question engine options/answer_key, DCR partial-save + edit/delete,
offline stf_sessions area support, geofence gate, SLA 8h warning, School Profile
"follows govt holidays?", me_associate STF nav, session geo + handout, OCR
observed-teacher selector fix, mgmt /mgmt/stf/checkins page) and ships PF /
shared fixes (SkillUp assessment cast, observation submit hang, cycle bucketing,
report attendance scope, mgmt/pf_home/auth/profile polish). No STF fellows are
provisioned yet, so the STF surfaces are present but unused; STF email sending
(G23 SMTP secrets) is the one remaining operator-side gap. The web/PWA deploys
to app-aikarthya.pages.dev (Cloudflare Pages Production, branch main) under the
same version; `app_versions` rows for android and windows are published with
`force_update = false`. Backend: `schools.follows_govt_holidays`,
`stf_attendance`, and the `stf_*` tables are already on production, so the
additive app changes are safe against the live prod DB; the remaining STF-only
migrations are scheduled for the 7 PM-9 AM IST prod window.