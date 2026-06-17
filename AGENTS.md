# AGENTS.md - Aikarthya Field Ops (Project Root)

## Project overview

**Aikarthya Field Ops** is a Flutter + Supabase mobile MIS for a non-profit education
programme in India. Four user roles: **PF** (Programme Fellows, field staff), **M&E
Associate** (monitoring & evaluation), **Mgmt** (admin), **HM** (School Leaders,
read-only in v1). Android-first; Web for Mgmt later; no iOS in v1.

Eleven-phase build (P0–P10), one phase at a time. Codex is the builder; Akash
carries prompts and tests on real devices; an architect chat owns the spec.

**Read order for any task (DOX chain first):**

1. **The DOX chain.** This root AGENTS.md, then every AGENTS.md on the route from the
   workspace root to each path you will touch (see the DOX Framework section below). The
   nearest AGENTS.md is the working contract and the first place to look for local rules,
   patterns, commands, and known pitfalls. Most small decisions should be answerable from
   the chain alone.
2. **Domain context, when a term/role/brand question comes up:**
   [`aikarthya-docs/AIKARTHYA-CONTEXT.md`](aikarthya-docs/AIKARTHYA-CONTEXT.md) - the
   programmes (SkillUp/STF/Career Campus), the four roles, the full glossary of
   codes/short-forms (PF, F8, R1b/R1c/R2, cycle, season, SLA, registered point, rubric
   I/II/O codes), and the brand palette + fonts + logo. Do not guess at terms.
3. **Product build truth, when the task changes product behavior, schema, or workflow:**
   [`aikarthya-docs/decisions/8.7-locked-spec.md`](aikarthya-docs/decisions/8.7-locked-spec.md),
   then the numbered revisions in
   [`aikarthya-docs/decisions/amendments/`](aikarthya-docs/decisions/amendments/) (A1..An,
   in order; they supersede the baseline), then
   [`aikarthya-docs/TESTING-HANDOFF-PROTOCOL.md`](aikarthya-docs/TESTING-HANDOFF-PROTOCOL.md)
   (manual-test + dual-target handoff).
4. **The current phase prompt** - only when working a phase or feature stream that has
   one. Maintenance, DOX upkeep, and small fixes do not require a phase prompt.

Brand assets + theme mapping: [`aikarthya-docs/brand/`](aikarthya-docs/brand/) (Aikarthya
logo present; SkillUp teal `#00A3CE`, navy `#13203C`, gold `#FBA211`; Poppins + Montserrat).

## Build Framework (how we build, every feature)

All new screens/features/behaviour follow the Aikarthya Build Framework. Entry point:
[`aikarthya-docs/framework/BUILD-FRAMEWORK.md`](aikarthya-docs/framework/BUILD-FRAMEWORK.md).
Start each feature by copying
[`aikarthya-docs/framework/phase-prompt.template.md`](aikarthya-docs/framework/phase-prompt.template.md).

- Pipeline: brainstorming -> ralplan -> claim (worktree + DOX chain read) -> ultragoal ->
  verify (`flutter test` + one harness) -> cloud sync -> **DOX pass** (update the owning
  AGENTS.md chain) -> handoff.
- There is **no hook or lock enforcement layer**. The former OMC lock board
  (`.omc/locks/`), lock-guard, cloud-sync-gate, and `AIKARTHYA_SKIP_GATES` were removed
  on 13-Jun-2026. Change control is the DOX Decision Gates (below) plus the
  feature-prompt checklist in `aikarthya-docs/framework/phase-prompt.template.md`;
  "done" requires the evidence those gates ask for.
- Parallel streams isolate in git worktrees. Only one stream at a time may edit a given
  file from the shared-file set (router, theme, brick, pubspec, migrations - full list in
  BUILD-FRAMEWORK.md section 2); declare shared files at Stage 0 and sequence those edits
  across streams.
- Mock data + seeder live in `aikarthya-supabase/seed/`.

## Knowledge management - DOX is primary

- The AGENTS.md hierarchy (DOX) is the **primary knowledge management system** for this
  workspace. Durable decisions, local guidelines, operating rules, implementation
  patterns, and known pitfalls live in the nearest owning AGENTS.md - deep enough that
  routine decisions are answerable from the DOX chain alone.
- The centralized developer wiki at
  [`aikarthya-docs/wiki/`](aikarthya-docs/wiki/) is **deprecated as legacy knowledge
  management** (13-Jun-2026). It is preserved for history and deep background - do not
  delete it - but it is not the source of truth, is not updated as part of routine work,
  and several pages are known-stale. Verify anything read there against the owning
  AGENTS.md and the code before acting on it.
- Product build truth (locked spec + amendments in `aikarthya-docs/decisions/`) remains
  binding and is governed by its own DOX contract; DOX governs how and when to read it.
- When work surfaces something durable - a decision, a pitfall, a contract, a workflow
  change - record it in the nearest owning AGENTS.md **in the same task** (this is the
  DOX pass). Do not add new pages to the wiki.

## Repo layout

Four sibling repos under this workspace root:

| Repo | Purpose | AGENTS.md |
|---|---|---|
| `aikarthya-field-ops-app/` | Flutter client | [`aikarthya-field-ops-app/AGENTS.md`](aikarthya-field-ops-app/AGENTS.md) |
| `aikarthya-supabase/` | Supabase backend (schema, RLS, auth, storage, functions) | [`aikarthya-supabase/AGENTS.md`](aikarthya-supabase/AGENTS.md) |
| `aikarthya-docs/` | Knowledge base (spec, contracts, phase reports, brand) | [`aikarthya-docs/AGENTS.md`](aikarthya-docs/AGENTS.md) |
| `aikarthya-releases/` | Versioned release notes and release summaries | [`aikarthya-releases/AGENTS.md`](aikarthya-releases/AGENTS.md) |

Each repo has its own git history and proprietary LICENSE. Always `cd` into the repo
before running git, Flutter, or Supabase CLI commands.

## Environments (staging + production)

Two Supabase cloud projects, both ap-south-1. Schema is shared (replayed from
`aikarthya-supabase/supabase/migrations/`, the single source of truth); **data is
separate**.

| Env | Supabase ref | Used by | Data |
|---|---|---|---|
| **production** | `nuwqxlhuxwgevxvsyusj` | release builds | real work data |
| **staging** | `fmmnrrjkoqsfwhbmswic` | debug/profile builds, all manual testing | clone of prod data, no auto seed |

### Time-bound rule for production schema migrations

- **Production schema migrations (structural changes) are only allowed between 7 PM and 9 AM IST.**
- The 9 AM–7 PM IST window is reserved for staging schema work. During that window, do not push any migration that alters production tables, columns, indexes, triggers, or constraints.
- Data edits (row inserts, updates, deletes) are **not** structural changes and may happen at any time when required.

### Pre-change checklist for any production database change

Before applying **any** change to the production database (schema or data):

1. Run the relevant e2e tests and confirm they are green.
2. Create or update a review checklist file in `aikarthya-docs/checklists/` that states:
   - What is being changed
   - Why it is needed
   - Which rows/tables are affected
   - Expected outcome
3. Create or update a feedback/review file in `aikarthya-docs/checklists/` for sign-off before execution.
4. Only proceed after explicit user confirmation.

### Environment usage

- **Test on staging, never on production.** Day-to-day development, migration trials, and
  manual device testing all run against staging.
- **Released apps use production.** A release build defaults to production.
- Promotion is one-directional and gated: migrations proven on staging are pushed to
  production after sign-off — never edit production schema by hand. Procedure + scripts:
  [`aikarthya-supabase/AGENTS.md`](aikarthya-supabase/AGENTS.md). App-side env selection
  (`--dart-define=APP_ENV`, `.env.staging`/`.env.production`, STAGING badge):
  [`aikarthya-field-ops-app/AGENTS.md`](aikarthya-field-ops-app/AGENTS.md).

**Release-build rule (binding):** when the user asks to build or produce an Android APK
(or any release artifact), **ask whether it is a Production or Staging release before
building**, then pass the matching `--dart-define=APP_ENV`. Never assume.

## Non-negotiable conventions (all repos)

- Brand is always spelled **"Aikarthya"** (never Aikarthiya / Aikarthaya).
- **No emojis** — code, UI strings, SQL comments, commit messages, docs.
- Dates render as `DD-MMM-YYYY` (e.g. `29-May-2026`). Use `intl` in Dart.
- Money is **INR with 2 decimals** (e.g. `₹1,250.00`).
- Material 3, light theme only in v1.
- Phase reports go to `aikarthya-docs/phases/PN-name/report.md`.

## Phase progress

| Phase | Name | State |
|---|---|---|
| P0 | Bootstrap | Done |
| P1 | Schema + RLS | Done (25 tables, 123 RLS policies, 53 pgTAP tests, cloud pushed) |
| P2 | Shell + Auth + Brick + Offline | Done (24 tests pass; Brick code-gen deferred to P2.1) |
| P2.1 | Brick codegen + offline + emulator + desktop | Done (26 tests pass; Android + Chrome + Windows desktop working) |
| P3 | PF Home + Check-in + Registered Points | Done (58 tests pass; cycle dashboard, geofence check-in, debug override) |
| P3.1 | Attendance report v2 | Done |
| P4 | Assessment access (form grants + Assessment tab) | Done |
| Forms v3 | Typed-table forms engine + 5 forms (Observation, Session, Teacher, School, School Leader) | Done |
| Maint | Polishing + targeted debug-fix streams | Done |

This table is a rollup. The authoritative per-phase record is
[`aikarthya-docs/phases/`](aikarthya-docs/phases/) - one folder per phase or fix stream, each with
its own `report.md`. Update the folder first; refresh this rollup when a stream completes.

## Toolchain (Windows machine)

- Flutter 3.44.0 / Dart 3.12.0 — `C:\Users\KIIT0001\flutter\bin\flutter.bat`
- Supabase CLI 2.101.0 — `C:\Users\KIIT0001\scoop\shims\supabase.exe`

PATH is not inherited from the registry at session start. Prefix every PowerShell
command:
```powershell
$env:Path = "C:\Users\KIIT0001\flutter\bin;C:\Users\KIIT0001\scoop\shims;$env:Path"
```

Use absolute paths for all repo operations; the PowerShell working directory defaults
to `aikarthya-docs`, not the workspace root.

---

## Compaction Rules

When context compaction is triggered, follow this structured format strictly:

### 1. Past Works (Prior Summaries)

- Incorporate all previously compacted summaries as **"Past Works"** — do not discard
  or flatten them.
- Stack them chronologically so the history of the session is preserved.

### 2. Recent Queries — DO NOT SUMMARIZE

- Keep the **latest 4 user queries and their full responses verbatim** in context.
- These must remain as-is with complete tool calls, responses, and conversation turns
  intact.
- Do not truncate, paraphrase, or compress these under any circumstance.

### 3. Tool Calls & Work Summary

- Summarize all tool calls, file edits, commands run, and outputs **outside** the
  latest 4 queries.
- Format: `[Tool] → [Action] → [Result/Outcome]` per entry.
- Group by task or goal when multiple tool calls belong to the same workflow.

### 4. Debug, Decision & Learning Log (Separate Section)

- Extract and preserve all debugging steps, architectural decisions, and lessons
  learned into a dedicated section titled **"Debug & Learning Log"**.
- Format each entry as:
  - **Issue / Decision**: brief description
  - **What was tried**: steps taken
  - **Outcome / Learning**: what worked or was concluded
- This section must NEVER be discarded in future compactions — only appended to.

### 5. Memory Preservation Rules

At every compaction stage, the following must be retained in full:

- Project structure and key file paths
- Active goals and pending tasks
- Established conventions (naming, patterns, tools used)
- All entries in the Debug & Learning Log
- The "Past Works" chain

Memory must not regress — each compaction should be a superset of the last.

---

## DOX Framework

- DOX is the AGENTS.md hierarchy installed here for durable operating contracts.
- Follow DOX instructions across any edits.

### Core Contract

- AGENTS.md files are binding work contracts for their subtrees.
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it.

### Read Before Editing

1. Read this root AGENTS.md.
2. Identify every file or folder you expect to touch.
3. Walk from the workspace root to each target path.
4. Read every AGENTS.md found along each route.
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there.
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules.
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX.

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

### Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

### Decision Gates (change control)

DOX is the gatekeeper for every change. There are no enforcement hooks or lock files;
these documentation gates are the control layer. Before editing, classify the change and
pass the matching gate; a change is not done until its closing gate is satisfied.

| Change class | Gate before editing | Gate before "done" |
|---|---|---|
| Code edit within existing behavior | Nearest AGENTS.md (and parents) read | Verification commands in the nearest AGENTS.md green |
| New feature / screen / behavior | Build Framework pipeline started (feature prompt copied); DOX chain read; locked spec + amendments checked | Verify stage green; DOX pass done; phase/feature report written |
| Durable contract change (API surface, schema mapping, workflow, folder structure) | Owning AGENTS.md and `aikarthya-docs/contracts/` read | Owning AGENTS.md + contracts updated in the same task |
| Product build-truth change (roles, schema semantics, platform rules, programme logic) | `decisions/8.7-locked-spec.md` + amendments read | New numbered amendment written in `decisions/amendments/` |
| Backend schema change | `aikarthya-supabase/supabase/AGENTS.md` migration discipline | Local pgTAP green; pushed to cloud; pushed migration filename recorded in the feature prompt |
| New durable folder boundary | Parent AGENTS.md read | Child AGENTS.md created; parent Child DOX Index updated |
| AGENTS.md create/move/delete | Parent AGENTS.md read | Every affected Child DOX Index refreshed |

Rules of use:

- A single task often crosses classes (a feature that changes schema crosses three rows);
  pass every gate that applies.
- When uncertain which class a change is, apply the strictest plausible gate.
- Decision records have one home each: product decisions -> a numbered amendment;
  operational/workflow decisions -> the nearest owning AGENTS.md; one-off context and
  evidence -> the phase/feature report. Never record a durable decision only in chat,
  commit messages, or the legacy wiki.

### Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index.
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index.
- Each parent explains what its direct children cover and what stays owned by the parent.
- The closer a doc is to the work, the more specific and practical it must be.

### Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards.
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty.
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists.

Default section order:

- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

### Style

- Keep docs concise, current, and operational.
- Document stable contracts, not diary entries.
- Put broad rules in parent docs and concrete details in child docs.
- Prefer direct bullets with explicit names.
- Do not duplicate rules across many files unless each scope needs a local version.
- Delete stale notes instead of explaining history.
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist.

### Closeout

1. Re-check changed paths against the DOX chain.
2. Update nearest owning docs and any affected parents or children.
3. Refresh every affected Child DOX Index.
4. Remove stale or contradictory text.
5. Run existing verification when relevant.
6. Report any docs intentionally left unchanged and why.

### User Preferences

When the user requests a durable behavior change, record it in this section or in the relevant child AGENTS.md. Current durable preferences are:

- Keep AGENTS.md files as the binding DOX hierarchy for project and subtree work contracts.
- Re-read the applicable DOX chain in each session before editing.
- Run a DOX pass after every meaningful change and update the closest owning AGENTS.md when contracts change.
- DOX is the primary knowledge management system (13-Jun-2026): durable knowledge, decisions, and guidelines are recorded in the nearest owning AGENTS.md, deep enough to decide locally without consulting centralized docs.
- The `aikarthya-docs/wiki/` knowledge base is deprecated legacy reference: preserve it, do not extend it, and verify its claims against DOX + code before relying on them.
- No lock/hook protection framework (13-Jun-2026): the OMC lock board and gate hooks are removed and must not be reintroduced; change control runs through the DOX Decision Gates and the feature-prompt checklist.
- Staging/production split (16-Jun-2026): test on staging, release from production; schema flows staging->production via gated promotion only (see the Environments section).
- Release-build environment is explicit (16-Jun-2026): before building any Android/APK or release artifact, ask whether it targets production or staging and pass the matching `--dart-define=APP_ENV`; never assume.

### Child DOX Index

- [`aikarthya-field-ops-app/AGENTS.md`](aikarthya-field-ops-app/AGENTS.md) - Flutter client contract. Owns app source, tests, platform folders, app assets, release APK artifacts produced inside the app repo, and its nested DOX index.
- [`aikarthya-supabase/AGENTS.md`](aikarthya-supabase/AGENTS.md) - Supabase backend contract. Owns migrations, pgTAP tests, seed data, storage/function artifacts, and its nested DOX index.
- [`aikarthya-docs/AGENTS.md`](aikarthya-docs/AGENTS.md) - Knowledge-base contract. Owns locked specs, amendments, contracts, phase prompts/reports, wiki, brand assets, and its nested DOX index.
- [`aikarthya-releases/AGENTS.md`](aikarthya-releases/AGENTS.md) - Release-records contract. Owns versioned changelogs, summaries, and release metadata exported from the build.

Root-owned only:

- Workspace-level operating rules, repo index, global conventions, compaction rules, and DOX framework.
- Creation or removal of top-level repo folders and their AGENTS.md entries.
