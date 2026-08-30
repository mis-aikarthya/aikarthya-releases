# v1.2.2+20 — Changelog

**Release date:** 2026-08-31 · **Backend:** production · **Previous:** v1.2.1+19 (10-Aug)
**Backend dependency:** requires the 22 pending Supabase migrations + full edge-function redeploy + prod backfills (see RELEASE-NOTES.md).

## Features

### Aikarthya Agent
- Agent bubble + squeeze side panel + full-page Agent Space (web, console roles)
- `/agent/chat` full-bleed chat page for Programme Facilitators via Home quick action
- Aikarthya Agent workload route in Reporting AI settings (its own model + route)
- Guest app hosted as a pure-static Cloudflare Pages deployment (`aikarthya-agent.pages.dev`)

### Leave management
- Dynamic leave categories, half-day leaves, quota balances, unpaid status
- Mgmt leave admin (approvals, unpaid/fellow routing), Leave Settings page,
  Office Holidays editor with optional holidays
- M&E console apply-leave wiring; facilitator team leave requests view

### STF (fellows + facilitators)
- Quick Actions section on facilitator Home (attendance, leave, agent)
- Dedicated fellow leave + attendance pages

### Cycle End reporting
- Template Builder redesign Phases 1–4: pages, insert palette, object tools,
  inline rich-text editor with Expand popup, bound-table placeholders
- Read-only Preview + on-demand AI binder text generation
- Report generation flow, asset library, CSV feedback import, report queue + manual scope dialog

### Reporting AI
- AI Settings page + scoped prompt lab (per-workload model/route control)

### Mgmt console
- School Closures: date ranges + SA/FA exam kinds, editable table

## Fixes
- STF fellow roster load failure + quick-action label truncation
- Cycle End: image snapshot pinning, reorder bypass, realtime move/pan/zoom,
  observation picker via Drive thumbnails, readiness checks + generation errors
- Reporting AI fallback + live generation hardening
- Observation nav kept on legacy routes; reporting navigation subgroups

## Chores
- Version bump 1.2.1+19 → 1.2.2+20
- DOX updates across app/agent/supabase repos