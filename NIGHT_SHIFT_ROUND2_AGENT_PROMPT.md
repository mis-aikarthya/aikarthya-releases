# Night Shift Round 2 — Worker Prompt (ONE issue per run, human-tested)

Paste **the prompt below** into the coding agent. This is the **one-issue-at-a-time** model (same
rhythm as Round 1): the agent implements **exactly one** issue, **leaves a test file** you run, then
**stops and asks you to test** and report what works / what doesn't. No autonomous loop, no AI
auto-verification — **you are the verifier**, and a per-issue test file is what you run to do it.

- **What to build:** Linear team **AIK**, project **"M&E Console — Round 2 (Feedback Fixes)"**, AIK-28 … AIK-41.
- **Operating manual:** `NIGHT_SHIFT_LINEAR_WORKFLOW.md` — shared-branch rule (§0), per-issue lifecycle (§3), staging-first verify (§4), hard rules + Linear GraphQL status fallback (§5).
- **Stage spec + page/route map:** `NIGHT_SHIFT_ROUND2_PLAN.md`.

> One run = one issue. Re-paste the prompt for the next issue **after** you've tested the current one
> and the agent has marked it Done. The agent picks up the next eligible issue automatically.

> The earlier goal-driven, full-loop files (`NIGHT_SHIFT_ROUND2_GOAL.txt`, `/goal` mode) are
> **superseded** by this one-by-one mode — ignore them unless you go back to autonomous running.

---

```
GOAL
Do EXACTLY ONE Round 2 issue this run, then STOP and hand it to me to test. Round 2 = Linear team AIK,
project "M&E Console — Round 2 (Feedback Fixes)", issues AIK-28..41 (stages S0..S5). Do NOT batch, do
NOT loop, do NOT start a second issue. The most important one is S0 (AIK-28): the Android device must
actually write location_pings (today only the web path works) — until that lands every location
feature (Overview current-location table, Work Days Rewind trail, ping-based "schools visited") is empty.

I (the human) am the verifier. You implement one issue and LEAVE A TEST FILE I can run; you do not
self-approve and you do not need image recognition — I do the visual checking from the steps you leave.

OPERATING STYLE — lazy senior dev (ponytail, full). Climb the ladder before writing: does it need to
exist? does it already live in this repo? stdlib/native? one line? Round 1 already built the providers,
maps, calendar, and mgmt shell you need (FieldMapBand, mgmt_home_providers.dart, the shared calendar
extracted in AIK-12, sync_outbox, mgmtPfKpiProvider, mgmtPfCurrentLocationProvider). Re-implementing
any of them is a bug, not progress. Never shorten your UNDERSTANDING of the problem — read the issue
and the code it touches end to end first, then be lazy about the solution.

== 0. Read first ==
1. NIGHT_SHIFT_LINEAR_WORKFLOW.md (repo root) — operating manual (§0 shared branch, §3 lifecycle,
   §4 staging verify, §5 hard rules + Linear GraphQL status-transition fallback).
2. NIGHT_SHIFT_ROUND2_PLAN.md (repo root) — stage spec + the page/route map (which route each issue
   touches; reuse what it names).
3. The AGENTS.md DOX chain (repo root + aikarthya-docs/AGENTS.md and nested). Non-negotiables:
   NO emojis anywhere, dates DD-MMM-YYYY, INR 2 decimals, Material 3 light theme, reuse the existing
   mgmt design system.
4. Confirm Linear (team AIK) is reachable. If not, STOP and report "Linear unavailable".

== 1. Pick ONE issue ==
Query the Round 2 project. An issue is ELIGIBLE if BOTH:
  (a) NOT started (state Backlog or Todo — Round 2 issues are seeded in Backlog), and
  (b) ALL of its blockedBy issues are Done.
Take the LOWEST-numbered eligible issue (AIK-28 first). Check the ACTUAL blockedBy relations
(inverseRelations query, manual §5) — never infer from titles. If none is eligible, STOP and tell me
why (e.g. "the next issue is blocked by AIK-X which is still in review"). Do exactly this one issue.

== 2. Claim it ==
Move it to In Progress (claims it). Read the full body: Context, Acceptance criteria, Reuse/files,
Verify, Notes. The body is the spec.

== 3. Build on the shared branch ==
  cd "C:\Users\KIIT0001\Desktop\Aikarthya-field-ops"
  git checkout night-shift/me-mgmt-dashboard 2>/dev/null || (git checkout main && git pull && git checkout -b night-shift/me-mgmt-dashboard)
  git pull
Implement, reusing the Round 1 widgets/providers the issue names. Mark deliberate simplifications with
a // ponytail: comment naming the ceiling.
Round-2-specific notes:
  - S2 charts (AIK-33): `flutter pub add syncfusion_flutter_charts`; do NOT hand-paint charts. No
    license key yet -> watermarked free build is fine (// ponytail: watermark until key).
  - S0 (AIK-28/37/38): the WEB path already writes pings on the 30-min cadence — diff Android against
    it; the fix is almost certainly Android background execution / permission / sync_outbox flush, not
    the write SQL. AIK-38 (check-in as a ping) reuses AIK-28's fixed path.
  - S3 heatmap (AIK-34) is a SHARED widget — build once; AIK-40 + AIK-41 consume it.

== 4. LEAVE A TEST FILE FOR ME (this is the handoff) ==
For this one issue, create/update a SINGLE test file so I can verify it myself:
  a. AUTOMATED part (cover every acceptance criterion logic can prove): write a Dart test at
       aikarthya-field-ops-app/test/round2/aik_<N>_test.dart
     (widget/unit), or — when it needs the real app against staging — an integration test using the
     existing harness integration_test/helpers/pf_test_harness.dart (see the project memory
     "automated-integration-testing" for the run command + gotchas). Cover the measurable criteria:
     the math (working-days, cumulative-observation, observation-completion = 1 obs/teacher/cycle),
     the data shape, provider output, the ping-near-a-school calc, etc.
  b. RUN IT yourself before handing off:
       cd "C:\Users\KIIT0001\Desktop\Aikarthya-field-ops\aikarthya-field-ops-app"
       flutter pub get && flutter analyze        (must be clean)
       flutter test test/round2/aik_<N>_test.dart  (must pass; or the integration run cmd)
     Fix until analyze is clean and the test passes.
  c. MANUAL/VISUAL part (what a test can't see): put a numbered "MANUAL CHECK" list as a top
     doc-comment in the same test file — one line per visual acceptance criterion, each phrased so I
     can answer working / not working. Include: the exact route to open
     (e.g. /mgmt/skillup/overview), the run command
     (flutter run -d chrome --dart-define=APP_ENV=staging), what to click, and what I should SEE.

== 5. Record, commit, and ASK ME TO TEST — then STOP ==
  - Linear comment on the issue: your flutter analyze output, the test file path + "X/Y automated
    checks pass", and the MANUAL CHECK list.
  - Commit to the shared branch:  git add -A && git commit  (message "AIK-N: <what> — <why>", ending
    with the Co-Authored-By trailer).
  - Move the issue to In Review (label needs-review) — NOT Done. I decide Done after I test.
  - Then STOP. In your final message to me, in plain text, give:
      * which issue you did (AIK-N + one-line what),
      * the test file to run + the EXACT command,
      * the numbered MANUAL CHECK list,
      * what you expect me to see for each.
  Do NOT pick another issue. Wait for my feedback (what works / what doesn't).

== NEXT RUN (after I give feedback) ==
I paste my feedback. Then:
  - All automated + manual checks pass -> move the issue to Done. Now the next issue becomes eligible;
    pick it (back to step 1) ONLY if I tell you to continue.
  - Something is broken -> fix THAT issue (same lifecycle, update its test file), commit, hand it back
    to me to re-test. An issue is not Done until I confirm.

== HARD RULES (security — never relax; full text in manual §5) ==
- Staging only. NEVER push to prod autonomously, NEVER open a PR. Prod = a human typing PROMOTE via
  aikarthya-supabase/scripts/push-prod, plus redeploying ALL edge functions.
- Secrets NEVER in Linear, commits, logs, test files, or this prompt. Service-role key lives only in
  an Edge Function; Syncfusion key and any login live only in git-ignored files — reference by PATH.
- Reuse before building. No emojis in anything you write.
- needs-human items (AIK-28/37 physical-device ping test, AIK-33 Syncfusion license key, AIK-36
  last-login data source): build them + leave the test file, and put the residual I must do (run on a
  real Android phone / drop in the key / confirm the data source) at the top of the MANUAL CHECK list.
  Leave them at In Review (needs-review), never auto-Done.
- You do NOT verify visuals — I do. Do not screenshot-and-interpret; just leave the MANUAL CHECK list.
```
