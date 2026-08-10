# Summary — Aikarthya Field Ops v1.2.1+19

Aikarthya Field Ops v1.2.1+19 is a focused release (40 commits on from v1.2.0+18)
built around two themes: the **PF Visit Planner** and the move to **working-day
observation cycles**. Unlike the previous release it carries a large backend half
— 30 Supabase migrations promoted to production in the same window.

**PF Visit Planner (new).** PFs get a month calendar of their school visits, a
scheduler sheet, a visit editor, suggestion detail, a visit pool, absence logging
and a move-visit action, plus a cycle summary rail. Visits are now first-class
rows (`school_visits`) separated from system-generated proposals
(`visit_suggestions`), so a suggestion the PF acts on is withdrawn and the rest
re-spaced automatically. Visits outside the sanctioned window — early visits, and
visits on a logged school closure — route through a management sanction request
with a reason, reviewed in the mgmt console. Cycle visit counts follow
V = max(2, ceil(teachers / 7)), spaced 14 calendar days from cycle 2.

**Working-day observation cycles.** An observation cycle is now 42 **working**
days stored in `school_cycles`, applied from cycle 1 with no cutover seam,
replacing the old 45-calendar-day arithmetic. Logged holidays and closures move
visits rather than silently consuming the cycle. Cycle dates resolve offline
through a new `SchoolCycle` Brick model, and cycle resolution reads synced rows
instead of the ambiguous `v_school_cycles` view. The consolidated report shows
working versus non-working day counts. When a cycle pull fails, the app no longer
claims recalculated dates it does not have.

**Mgmt and M&E console.** New cycle planner, visit sanction review queue, PF
analytics panel and team overview band. School consolidated reports arrive with a
review-state workflow and a proper table; teacher consolidated reports are
defined. Mgmt and M&E can log school closures. M&E associates gain programme
access.

**Ship blocker caught pre-release.** The generated Brick migration for
`VisitSuggestion` also re-added `Observation.next_step`, a column that already
exists (an earlier migration created it by rename). Applying it would have thrown
`duplicate column name` during the local SQLite migration on every device
upgrading from a shipped build, taking the offline store down before the app
could open. Removed; the guard test that caught it stays.

**Backend promotion.** Thirty migrations move production from ledger
`20260805190000` to `20260812160000`. Seven of them rewrite live rows at apply
time — cycle boundaries are recomputed and visit rows seeded for all active
schools. Devices still on v1.2.0+18 keep working through the window
(`v_school_cycles` stays a column superset and keeps its current/next-cycle
coverage), but their cycle dates shift on next sync before they have the app that
explains why. Edge functions are unchanged from 24-Jul-2026, so no redeploy.

Version numbering follows the 03-Jul-2026 rule: patch increments by one from
v1.2.0+18 to v1.2.1+19. Web ships at the same version as APK and Windows.
`app_versions` rows publish with `force_update = false`.
