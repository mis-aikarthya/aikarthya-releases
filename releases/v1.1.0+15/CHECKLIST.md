# Test Checklist — Aikarthya Field Ops v1.1.0+15

Sign off each row after verifying on a fresh install from the Drive artifacts.

## Android (APK, min_sdk 21)

- [ ] App installs over v1.0.9+13 and the in-app updater offers the Drive
      download page (no native in-app install).
- [ ] New app logo shows on splash + launcher icon.
- [ ] Sign in as mgmt → M&E console loads: SkillUp Overview stat cards +
      Reports Queue (Awaiting generation / Awaiting PF review / Released — not
      yet shared / Shared with teacher) with real counts.
- [ ] SkillUp Dashboard charts render (Syncfusion), filter bar collapses,
      cycle/context/school filters apply.
- [ ] PF performance table: columns keep width on a phone (horizontal scroll,
      no ellipsis crush); row tap opens PF profile.
- [ ] PF profile: targets vs achievements, school visit log, Download SLA
      Report button produces a one-page PDF.
- [ ] Team roster: last-login + platform + app version shown; admin edit
      (C13) saves profile/role/active/form-access; school assign/unassign (C14).
- [ ] Work Days Rewind: full-year heatmap + timeline times in IST + trail map.
- [ ] Background location: check-in writes a `location_pings` row; pings resume
      after app restart (cold-start auth rehydrate); no spurious check-in error.
- [ ] PF with a null `school_id` online session (e.g. Sandhya Yadav) loads
      without "Could not load" / "—" in the PF Performance table.

## Windows desktop (zip)

- [ ] App launches from the unzipped Release folder.
- [ ] Sign in + console smoke: Overview + Dashboard + Team + PF profile render.
- [ ] New logo on Windows title bar / taskbar.

## Backend (production)

- [ ] `app_versions` has android 1.1.0+15 (is_active, min_sdk 21, download_url
      = Drive folder) and windows 1.1.0+15 (is_active, min_sdk NULL).
- [ ] Old android 1.0.9+13 row remains is_active=false (superseded) — or as
      left; the updater picks the highest build for the platform.

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Built by | Agent (night shift) | 2026-07-01 | Artifacts + Drive upload + app_versions rows |
| Tested by | | | |
| Approved by | | | |