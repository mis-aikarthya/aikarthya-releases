# Night Shift — Round 2 (Feedback Fixes) Plan

Source: your tested feedback on `NIGHT_SHIFT_TEST_CHECKLIST.md`.
✅ items (no action): AIK-5/8, AIK-23, AIK-22, AIK-24.
Everything below is ⚠️/❌ feedback decomposed into stage-ordered work.

The one **blocker** that recurs across three sections (Overview map, Work Days Rewind, F2) is the **Android location-ping failure**. It is Stage 0 — almost every location feature stays empty until it's fixed.

---

## Stage 0 — Android location pings (CRITICAL, blocks all location features)

**R2-0a · Fix Android 30-min location capture (web works, Android writes nothing)** — `Bug · area:app · needs-human`
- Symptom: web (Sagnik's account) writes a `location_pings` row every 30 min and the Overview table updates; the **Android device writes no rows at all** — no row on check-in, none after 90 min, nothing after refresh.
- Likely causes to diagnose: Android background execution (no foreground service / WorkManager), runtime location permission (background/"allow all the time"), OEM battery-optimization killing the timer, Geolocator config differing from web, or the `sync_outbox` flush never firing on mobile.
- Fix: get Android to capture on the same cadence the web path already proves works, delivered through `sync_outbox`. Verify real rows land from a physical device.
- DoD: physical Android device, checked in → ≥2 pings within ~60 min visible in `location_pings`; survives app backgrounded.

**R2-0b · Capture must continue when the app is closed/backgrounded** — `Feature · area:app · needs-human`
- Foreground service (persistent notification) + WorkManager periodic task so pings continue while the app is closed or the screen is locked. This is the known background-reliability ceiling from AIK-13 — now a hard requirement.

**R2-0c · Write the check-in event itself as a `location_pings` row** — `Improvement · area:app`
- On check-in, immediately write a ping (the check-in fix) so the trail/current-location has an anchor without waiting 30 min. Small, but depends on 0a's write path.

---

## Stage 1 — SkillUp Overview (M1)

**R2-1a · Overview map: collapsible + PF-dot hover popups** — `Improvement · area:app`
- Map starts **collapsed** (tile/placeholder); user expands to view.
- Hovering a **PF check-in dot** shows a popup with the **PF's name** (mirror the existing school hover card).

**R2-1b · Overview stat cards rework + rename** — `Improvement · area:app`
- Rename section **"Field Fellows – Current Location" → "Programme Fellow – Current Location"**.
- **Drop** the area/block count (we don't count blocks).
- Add **"Today's Observations"** card (total observations done today).
- Add **"Sessions Taken Today"** card with two real figures: **Offline sessions** / **Online sessions**.
- Make cards **compact + responsive**; general design polish.

**R2-1c · Work Days Rewind button on each PF current-location row** — `Improvement · area:app`
- Each PF row gets a button that opens that PF's Work Days Rewind page. (Depends on AIK-12 WDR entry.)

---

## Stage 2 — SkillUp Dashboard: filters + charts (M2)

**R2-2a · Filter bar: collapsible + Context filter + School multi-select** — `Improvement · area:app`
- Filter bar **collapsible, default collapsed**.
- Replace **Area/Block** filter with **Context (Rural / Urban)**.
- Add a **School** filter (multi-select of school names).

**R2-2b · Adopt `syncfusion_flutter_charts`; rebuild all dashboard charts** — `Improvement · area:app`
- **Do not hand-paint charts.** Use `syncfusion_flutter_charts` (license applied for; use watermarked free build until the key is granted, then swap the key).
- **Sessions Trend:** fix the **inverted (upside-down) bars**. Make it dynamic — *all cycles* → sessions per cycle; *single cycle selected* → that cycle's **online vs offline** split (the per-cycle chart hides).
- **Observation Completion:** fix the calculation — required = **1 observation per teacher per cycle** (2 cycles ⇒ 2/teacher); reuse the PF Home "cumulative observation" calc. New chart, sized like its peers.
- **Attendance Trends:** no filter → trend (updated library). Cycle/date filter → **Pie** of Present / Half-day / Absent with counts, and **Total Working Days** below (= working days × #PFs in scope; PF-specific = no multiply). Example: 3 PFs, 1 holiday in the week, presents 5+3+3=11, absents=4, working days=15.
- **Online/Offline split → Donut.**
- **Teacher Reached → horizontal funnel:** Observation Done → Report Written → Shared (counts + arrows).
- Add any further charts that aid the overview.

---

## Stage 3 — PF Performance Table + PF Profile (M2)

**R2-3a · PF performance table: layout + KPI columns + filter binding** — `Improvement · area:app`
- Headers **wrap (max 3 lines), never truncate/ellipsis** on narrow screens.
- Add **column dividers** (currently unreadable).
- Columns: Days in field; **Schools Visited (data source → location-ping near a school**, not assignments); Observations (total); **Sessions Conducted**.
- Table **respects the Dashboard filters** (PF-specific drill-down).

**R2-3b · PF profile: extra KPIs, observation targets, logs, WDR button** — `Improvement · area:app`
- More performance KPIs for clarity.
- **Target vs Achievement:** add **Observation** targets + achievements (targets from the cumulative-observation calc) and **Sessions** on the cumulative basis.
- Add **Observation-by-school**, **School Visit Logs**, **Attendance record**, and a **Work Days Rewind** button (top **and** bottom).

**R2-3c · Shared compact GitHub-style attendance heatmap** — `Improvement · area:app` *(shared widget; also satisfies AIK-20/21 redesign)*
- Replace the massive calendar with a compact monthly **heatmap**: small rounded squares, **one colour per day**, weekday-aligned, month labels, subtle spacing.
- Legend: Present=green, Absent=red, Leave=orange, Holiday=light blue/grey, Weekly Off=dark grey, Half Day=light green, Off-location=maroon.
- **Tap a day → detail popover.** Used by PF Profile (C7) **and** Team per-PF (C11).

---

## Stage 4 — School Data (M3)

**R2-4a · School profile: real data + visualizations** — `Improvement · area:app`
- Profile/list look is poor and thin on data. Pull the full `school_profile` table: total students, total teachers, **HM name**, school timings, and other visualizable fields.
- Add charts/tables for the school; redesign list + profile.

---

## Stage 5 — Team (M4)

**R2-5a · Roster/detail: last-login time + client platform** — `Improvement · area:app` *(may need a backend field)*
- Show each member's **last login time** and the **app/platform** they signed in from (mobile vs desktop) — so we can see whether they've updated their app and when they were last active.

**R2-5b · Team per-PF attendance: WDR button at top + heatmap redesign** — `Improvement · area:app`
- WDR button moved to the **top**; attendance uses the shared heatmap from R2-3c. (Mostly satisfied by R2-3c.)

---

### Dependency / sequencing
- **Stage 0 first** — Overview table, WDR trail, and any "schools visited via ping" KPI all read empty until Android pings work.
- R2-3c (heatmap) is shared → build once, consume in R2-3b and R2-5b.
- Stages 1, 2, 4, 5 (UI) can proceed in parallel with Stage 0; only their *data* waits on pings.

`blockedBy` wired in Linear: AIK-37/38/39 ← AIK-28 · AIK-40/41 ← AIK-34.

---

## Pages / routes the agent touches

| Stage · Issue | Linear | Route / surface | File area (reuse, don't rebuild) |
|---|---|---|---|
| S0 · R2-0a/b/c | AIK-28/37/38 | **PF mobile app** — check-in + location-capture service (NOT the console) | location capture service, `sync_outbox`, `location_pings` |
| S1 · R2-1a/b/c | AIK-29/30/31 | `/mgmt/skillup/overview` | `field_map_band.dart`, Overview stat cards, current-location table, WDR route |
| S2 · R2-2a/b | AIK-32/33 | `/mgmt/skillup/dashboard` | C4 filter provider, C5 charts band → `syncfusion_flutter_charts` |
| S3 · R2-3a | AIK-39 | `/mgmt/skillup/dashboard` (PF performance table) | `mgmtPfKpiProvider`, C4 filter provider |
| S3 · R2-3b | AIK-40 | PF profile page (opened from C6 table) | `mgmtPfKpiProvider`, shared heatmap, PF Home cumulative-obs calc |
| S3 · R2-3c | AIK-34 | shared widget (PF profile + Team + WDR) | shared calendar from AIK-12 |
| S4 · R2-4a | AIK-35 | `/mgmt/skillup/school-data` + school profile | `school_profile` table, C8 aggregate provider |
| S5 · R2-5a | AIK-36 | `/mgmt/team` + member detail | roster/detail (C10); `auth.users.last_sign_in_at` / client-platform source |
| S5 · R2-5b | AIK-41 | Team member detail (per-PF attendance) | shared heatmap (AIK-34), C10 container |

## How the agent runs this

Goal-driven, **one continuous run that loops through all 14 issues** — not one-per-run. Per issue: **claim → build on the shared branch → self pre-check (analyze) → verify via Codex → evidence + commit → update Linear status → pick the next eligible issue → repeat** until none remain. The full worker prompt is `NIGHT_SHIFT_ROUND2_AGENT_PROMPT.md`. The operating manual `NIGHT_SHIFT_LINEAR_WORKFLOW.md` (lifecycle, hard rules, Linear GraphQL status-transition fallback) applies unchanged.

**No human verification loop.** Verification is delegated to AI agents: **Codex** is the primary verifier (runs the app on staging, judges every acceptance criterion including visual ones, returns a TEXT verdict); **Antigravity (`agy`)** is the fallback for visual review only. The implementing/orchestrating model has **no image recognition** — it never captures a screenshot and feeds it to itself; visual PASS always comes back as text from Codex/agy.

**Residual human steps** (the loop builds + AI-verifies these as far as possible, flags the remainder, and continues — it does not stall): AIK-28 + AIK-37 (a physical Android device must prove real pings land and survive app-close — Codex can only verify the code path/build/non-regression), AIK-33 (Syncfusion license-key drop-in; watermark until then), AIK-36 (last-login data source confirmation). These land at `needs-review`, not Done. Shared branch: `night-shift/me-mgmt-dashboard`. Staging only; one human PR to `main` at the end.
