# Night Shift — Linear Workflow

How an agent picks up and ships the **M&E mgmt dashboard + frontend** work, one issue at a time, autonomously.

This effort is planned as **2 Linear projects → 6 milestones → 22 issues** (AIK-6 … AIK-27) in team **AIK**. This doc is the operating manual; the issues are the source of truth for *what* to build.

---

## 0. The one rule that overrides convention

Normal convention here is **one issue → one branch**. For Night Shift that is **suspended**: every issue lands on **one shared branch**, reviewed and merged to `main` **once** by a human at the end.

- **Git branch:** `night-shift/me-mgmt-dashboard`
- **Display name (Linear / PR title):** `auto M&E mgmt dashboard and frontend development - Night Shift`

(Git branch names can't contain spaces — the git name and the display name are deliberately different.)

First agent to start creates it:
```bash
git checkout main && git pull
git checkout -b night-shift/me-mgmt-dashboard   # or: git checkout night-shift/me-mgmt-dashboard if it exists
```
Every subsequent agent just `git checkout night-shift/me-mgmt-dashboard && git pull`.

---

## 1. One agent, one issue, at a time

- An agent works **exactly one** issue. No batching, no "while I'm here".
- **Before touching code**, move the issue to **In Progress** (claims it — another agent must never pick an In Progress issue).
- When done → **Done**. When partially done / blocked mid-flight → push what's real, then move it **back to Todo** with a comment describing exactly what remains, so the next agent resumes cleanly.

## 2. Picking the next issue

Pick the **lowest-numbered** issue (AIK-6 first, then AIK-7, …) that is **both**:
1. in state **Todo**, and
2. has **all of its `blockedBy` issues in Done**.

If the lowest-numbered Todo is still blocked, skip to the next eligible one. The `blockedBy` relations are set in Linear — check them, don't guess from the title.

`needs-human` issues (**AIK-22**, **AIK-24**): build + verify them like any other, but **do not merge** — leave the work on the branch and stop at `needs-review` for a human.

## 3. Per-issue lifecycle

```
Todo ──claim──▶ In Progress ──build on shared branch──▶ verify on staging
                                                              │
                          ┌───────── all AC met? ────────────┤
                          ▼ yes                               ▼ no / partial
                  attach evidence,                    push real progress,
                  commit, label needs-review,         comment what remains,
                  move ──▶ Done                        move ──▶ Todo
```

Steps:
1. **Claim** — issue → **In Progress**.
2. **Read** the issue body fully: Context, Acceptance criteria, Reuse/files, Verify, Depends on, DoD. Reuse what it points to — do **not** rebuild providers/maps/calendars that already exist.
3. **Build** on `night-shift/me-mgmt-dashboard`.
4. **Verify on staging** (see §4). No staging proof = not done.
5. **Evidence** — paste the verify output / screenshot path into a Linear comment on the issue.
6. **Commit** to the shared branch. Message: `AIK-N: <what> — <why>` ending with the Co-Authored-By trailer.
7. **Close out** — all AC met → label `needs-review`, move **Done**. Partial → push, comment the remainder, move back **Todo**.

**Status is the source of truth for what is ongoing.** At *every* transition you
must update the issue's Linear status so the board reflects reality: claim →
**In Progress**, finish → **Done** + `needs-review`, partial → **Todo** + a
what-remains comment. Never leave an issue you have started sitting in its old
state — the next run picks issues mechanically by status, so an untransitioned
issue gets re-picked and the work is duplicated. If you cannot transition via
the MCP tool, use the GraphQL fallback in §5 before you stop.

## 4. Verification (staging-first, always)

- App issues:
  ```bash
  cd aikarthya-field-ops-app && flutter run -d chrome --dart-define=APP_ENV=staging
  ```
  plus `flutter analyze` clean.
- Backend issues: `cd aikarthya-supabase && ./scripts/push-staging`, then verify the schema/RLS/function on the **staging** DB.
- Every issue carries its own **Verify** block — that is the bar.

## 5. Hard rules 🔒

- **Staging only.** Never push to **prod** autonomously. Prod is a deliberate human step: `aikarthya-supabase/scripts/push-prod` and typing **`PROMOTE`**. After any backend change, prod also needs **all** edge functions redeployed (prod has drifted before).
- **Secrets never in Linear** (or commits, or logs). Reference them; don't paste them. The Supabase **service-role key lives only in an Edge Function**, never in the client bundle.
- **`needs-human` gate** — privileged auth-adjacent paths (**AIK-22** role/active edits, **AIK-24** password reset) are built + verified but **held for human review**, never auto-merged.
- **Reuse before building.** The issues name existing providers/widgets to extend (`mgmt_home_providers.dart`, `FieldMapBand`, the attendance calendar, `sync_outbox`, `currentLocationProvider`). Re-implementing them is a bug, not progress.
- **One human PR at the end** — when the branch is green and all non-`needs-human` issues are Done, a human opens **one** PR (`auto M&E mgmt dashboard and frontend development - Night Shift`) to `main`.
- **Linear transitions are mandatory, with a GraphQL fallback.** The Linear MCP
  `update_issue` tool has a known defect: it rejects every status *name*
  (`In Progress`, `Done`, …) with `stateId must be a UUID` and exposes no state
  UUIDs or label field, so status/label transitions fail while reads, resource
  fetches, and comments still work. When the MCP tool fails (or any Linear
  write is blocked), do **not** abandon the transition — call Linear's GraphQL
  API directly with the same credential the MCP server uses:
  1. Read `LINEAR_API_KEY` from the MCP config (`~/.claude.json` →
     `mcpServers.linear.env.LINEAR_API_KEY`). Use it **in-memory only** — never
     echo, log, commit, or paste it (it is a secret; §5 secret rule applies).
  2. Resolve UUIDs:
     `query { issue(id:"<issueId>") { state{id,name} team{ states{nodes{id,name,type}} labels{nodes{id,name}} } } }`
     → pick the `Done` (type `completed`) state id and the `needs-review` label
     id. Also `query { issue(id:"<id>") { labels{nodes{id,name}} } }` to read the
     issue's current labels so you **add** to them, not replace.
  3. Apply the transition:
     `mutation { issueUpdate(id:"<id>", input:{ stateId:"<doneId>", labelIds:[...existing, "<needsReviewId>"], title:"<clean title>" }) { success issue{ state{name} labels{nodes{name}} } } }`
     posted to `https://api.linear.app/graphql` with header
     `Authorization: <LINEAR_API_KEY>`.
  Build the JSON body with `python -c "import json; ...json.dumps({'query': q})"`
  (`jq` is not installed on this host). Confirm the mutation returns
  `success: true` and re-check via `search_issues` before stopping. This
  fallback exists precisely so no issue is left untransitioned.

---

## 6. The map (sequence + dependencies)

Team **AIK**. Project IDs: Foundation `02bf74c0-322e-4ab4-b0b7-3c9f3e355455` · Console `cd78dadb-b9c8-429d-b7dd-9acf1c369128`.

### Project A — Location & Data Foundation (build first)
**M0 · Location Breadcrumb + Shared Data**
| # | Issue | Blocked by | Notes |
|---|-------|-----------|-------|
| AIK-6 | F1 · `location_pings` table + RLS + index | — | **start here** (backend) |
| AIK-7 | F4 · `mgmtPfKpiProvider` (shared KPIs) | — | reads existing tables |
| AIK-13 | F2 · mobile 30-min capture → `sync_outbox` | AIK-6 | |
| AIK-14 | F3 · `mgmtPfCurrentLocationProvider` (≤100 m) | AIK-6 | |

### Project B — M&E Console Pages
**M1 · SkillUp Overview**
| AIK-8 | C1 · scaffold + stat cards + reports-queued | — |
| AIK-15 | C2 · area OSM map + school hover | AIK-8 |
| AIK-26 | C3 · PF → current school/HO table | AIK-8, AIK-14 |

**M2 · SkillUp Dashboard**
| AIK-9 | C4 · scaffold + filter bar | — |
| AIK-16 | C5 · charts band | AIK-9 |
| AIK-17 | C6 · PF performance table | AIK-9, AIK-7 |
| AIK-18 | C7 · individual PF profile | AIK-9, AIK-7 |

**M3 · School Data**
| AIK-10 | C8 · school list + columns + open profile | — |
| AIK-19 | C9 · school profile page | AIK-10 |

**M4 · Team — analytics + admin**
| AIK-11 | C10 · roster + member-mgmt scaffold | — |
| AIK-20 | C11 · per-PF attendance viz | AIK-11 |
| AIK-21 | C12 · per-PF KPI panel | AIK-11, AIK-7 |
| AIK-22 | C13 · member admin edit (role/active) 🔒 | AIK-11 | **needs-human** |
| AIK-23 | C14 · assign schools (`pf_assignments`) | AIK-11 |
| AIK-24 | C15 · password reset (Edge Function) 🔒 | AIK-11 | **needs-human** |

**M5 · Work Days Rewind**
| AIK-12 | C16 · scaffold + extract shared calendar | AIK-11 |
| AIK-25 | C18 · visual day timeline (events) | AIK-12 |
| AIK-27 | C17 · timeline map (trail, 50 m merge) | AIK-12, AIK-13 |

Foundation (M0) unblocks the data-driven console pages. Within each milestone the scaffold (C1/C4/C8/C10/C16) comes first; everything else builds on it.
