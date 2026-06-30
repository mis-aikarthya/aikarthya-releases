# Night Shift -- Round 3 Manual Test Checklist

Run every test on the **staging** build (project `fmmnrrjkoqsfwhbmswic`).
Mark each row PASS / FAIL / BLOCKED. For FAIL, note what you saw (error text,
empty screen, wrong value). Tests are grouped by feature / Linear issue.

## Prerequisites

- The night-shift branch app build running against **staging** (anon key +
  Supabase URL pointing at staging).
- Test accounts you can sign into on staging, one per role:
  - **PF** (a Programme Fellow) -- needed for AIK-49 leave + check-in (if PF
    also used).
  - **mgmt** (Management) -- needed for AIK-43 check-in, AIK-46 Assessment,
    AIK-48 notifications, AIK-50 Leave admin.
  - **me_associate** (M&E Associate) -- needed for AIK-43 check-in, AIK-46
    Assessment, AIK-48 notifications. me_associate must NOT see Team/Leaves.
- A second device or the same device for cross-role verification (e.g. PF
  applies for leave, mgmt approves it).

> Tip: keep two signed-in sessions open (PF on one, mgmt on another) so the
> leave + notification flows can be checked end to end without re-login.

---

## 1. AIK-46 -- Assessment page (mgmt + me_associate)

**Page:** left nav -> **Assessment** (above the Programs group).

| # | Step | Expected (PASS) | Fail signal |
|---|---|---|---|
| 1.1 | Sign in as **mgmt**, open Assessment from the nav | Page renders the existing AssessmentTab: tabs **Records & Surveys / Drafts / Submitted** | Blank screen, missing tabs, crash |
| 1.2 | Same as mgmt, on a **narrow/phone-width** window (or actual phone) | Layout is usable -- drawer nav, header, content scrolls; no overflow | Horizontal overflow, cut-off content, broken nav |
| 1.3 | Open a form, fill it, **Save draft** | Draft appears under the **Drafts** tab | Save error / nothing appears in Drafts |
| 1.4 | Open the draft, complete it, **Submit** | Submission moves to the **Submitted** tab; no RLS/permission error | Submit error (42501 / "permission"), draft stays in Drafts |
| 1.5 | Sign in as **me_associate**, open Assessment (nav should show it) | Same AssessmentTab renders; can save draft + submit | me_associate cannot see the Assessment nav item, or submit fails with permission error |
| 1.6 | Sign in as **mgmt/me** and try to reach `/mgmt/assessment` via a typed/deep link | Page loads (allowed by `MgmtAccess`) | Hard-blocked / redirect away |

---

## 2. AIK-43 + AIK-47 -- mgmt + me_associate check-in writes & counter

**Page:** Personal page (mgmt/me) -> the **Staff Check-In** card.

| # | Step | Expected (PASS) | Fail signal |
|---|---|---|---|
| 2.1 | Sign in as **mgmt**, open Personal, tap **Check In** | Status flips to **Checked In**, the work-timer **counter starts ticking**, an attendance row is written to the DB | Generic "Check-in failed. Please try again." (would mean RLS still blocking), or no counter |
| 2.2 | While checked in, confirm a row landed on staging | `select * from attendance where pf_id='<mgmt uuid>' order by created_at desc limit 1;` shows a row with `check_in_at` set, `check_out_at null` | No row in the table |
| 2.3 | Tap **Check Out** | Status -> **Done Today**, `check_out_at` set on the row | Checkout error / status stays Checked In |
| 2.4 | Repeat 2.1-2.3 as **me_associate** | Same behaviour; row lands with `pf_id = <me uuid>` | me_associate cannot check in (RLS error) |
| 2.5 | Sign in as **PF** and check out (geofenced path) | PF checkout works AND a `check_out_flagged` / `attendance_flags` row is created ONLY if the checkout was off-location (geofenced). A normal on-location PF checkout must NOT create a flag | PF checkout creates a false OFF_LOCATION_CHECKOUT flag even when on-location |
| 2.6 | Sign in as **mgmt/me** and force a failing check-in (e.g. go offline / bad state) | The error shown is the **real** Supabase/RLS message (`Check-in failed: ...`), not the old generic text | Generic "Check-in failed. Please try again." (means AIK-47 not deployed) |

> 2.5 verifies the AIK-43 second fix: the checkout-flag trigger must no longer
> fire for non-geofenced (staff) checkouts.

---

## 3. AIK-45 + AIK-48 -- In-app notification area (mgmt + me_associate)

**Page:** the **bell icon** in the top-right of the mgmt header.

| # | Step | Expected (PASS) | Fail signal |
|---|---|---|---|
| 3.1 | Sign in as **mgmt** (with at least one unread notification seeded -- see 3.2) | The bell shows a **badge with the unread count**; tapping opens the notification list sheet | No bell, or badge never shows a number |
| 3.2 | Seed a notification: as a **PF**, apply for a leave (Section 4). This creates one notification row per mgmt user (AIK-44 trigger). | mgmt bell badge increments within a few seconds (Realtime) | Badge does not update / no notification appears |
| 3.3 | Tap the bell -> open the list | List shows the leave notification ("New leave request" + applicant + dates) | Empty list, or list does not load |
| 3.4 | Tap the leave notification row | Row is marked read (unread dot disappears), the badge count drops by 1, and the sheet navigates to **/mgmt/leaves** (the Leave admin page) | Row stays unread, badge unchanged, or does not deep-link |
| 3.5 | Tap a generic (non-leave) notification row | Marks read; does NOT navigate away | Generic rows navigate incorrectly |
| 3.6 | Use the **"Clear read"** button (shows only when >=1 read item exists) | Read notifications are removed from the list; badge unaffected for unread | Clear fails / removes unread ones too |
| 3.7 | Sign in as **me_associate** | Bell + list work the same way (me sees notifications addressed to them) | me_associate has no bell, or list errors |
| 3.8 | (Cleanup, DB-side) On staging, check the cron job exists | `select jobname, schedule, command from cron.job where jobname='notifications_cleanup_15d';` returns the row, schedule `17 3 * * *` | Job missing (AIK-45 not applied) |
| 3.9 | (Cleanup predicate) Insert a fake read notification dated 16+ days ago, then run the delete predicate once | That row is deleted; a recent read row and any unread row are kept | Deletes unread/recent rows, or deletes nothing |

---

## 4. AIK-44 + AIK-49 -- PF Leave page (apply / withdraw / view)

**Page:** PF Profile tab -> **Quick Actions** -> **Apply Leave** tile (must now
be ENABLED, no lock icon).

| # | Step | Expected (PASS) | Fail signal |
|---|---|---|---|
| 4.1 | Sign in as **PF**, open Profile, look at the Apply Leave tile | Tile is enabled (no lock, subtitle "Request leave") | Tile still shows "Coming soon" / lock (AIK-49 not deployed) |
| 4.2 | Tap **Apply Leave** | Opens the **My Leaves** page (AppBar "My Leaves", a centred "Apply New Leave" button) | Opens a "coming soon" snackbar, or blank |
| 4.3 | Tap **Apply New Leave** -> fill the form: leave type, start date, end date, joining date, reason -> **Submit** | Snack "Leave application submitted"; the row appears under the **Applications** section (status pending) | Submit error, or row does not appear |
| 4.4 | Submit with end date before start date | Snack "End date cannot be before start date." -- no row created | Allows invalid range |
| 4.5 | Submit with an empty reason | Snack "Fill all fields to apply." -- no row created | Creates a row with blank reason |
| 4.6 | Confirm the DB row | `select * from leaves where pf_id='<pf uuid>' order by created_at desc limit 1;` -> status='pending', requested_on set, dates correct | No row / wrong status |
| 4.7 | On the Applications row, tap the **trash/withdraw** icon -> confirm | Confirm dialog appears; on confirm, row is removed from the list; snack "Application withdrawn"; DB row deleted | No dialog, or row stays after confirm |
| 4.8 | Apply again, then sign in as **mgmt** and **approve** it (Section 5). Back on the PF page (pull to refresh) | The leave moves to the **Approved** section (green); tap shows details with "Approved by <mgmt name>" | Stays in Applications, or no approver name |
| 4.9 | Apply again, have mgmt **reject with a reason** (Section 5). Refresh PF page | The leave moves to the **Rejected** section (red); tap shows a popup with the reject reason and "Rejected by <mgmt name>" | Stays in Applications, or no reason shown |
| 4.10 | Try to withdraw an already-approved/rejected leave | No trash icon on Approved/Rejected rows (only pending Applications are deletable) | Can delete a decided leave |
| 4.11 | Sign in as **mgmt/me**, open the Personal page Quick Actions | Apply Leave tile is DISABLED ("Coming soon", lock) -- mgmt/me cannot apply for leave | mgmt/me can open the leave form |

---

## 5. AIK-44 + AIK-50 -- mgmt Leave admin (approve / reject)

**Page:** left nav -> **Leaves** (mgmt only; appears under "Members Details").

| # | Step | Expected (PASS) | Fail signal |
|---|---|---|---|
| 5.1 | Sign in as **mgmt**, open the nav | Two items where Team used to be: **Members Details** (renamed from Team) and **Leaves** | Still a single "Team" item, or "Leaves" missing |
| 5.2 | Open **Members Details** | Roster still works as before (just renamed) -- list of members, openable | Roster broken by the rename |
| 5.3 | Open **Leaves** | Page renders three sections: **Pending (N)**, **Approved (N)**, **Rejected (N)** with counts | Blank / missing sections |
| 5.4 | Have a PF apply for a leave (Section 4), then refresh Leaves | A pending row appears showing the PF's name, leave type, date range, reason | Row missing, or PF name shows "PF" (join failed) |
| 5.5 | Tap **Approve** on a pending row | Snack "Leave approved"; row moves to the Approved section; DB: status='approved', approved_by set to the mgmt uuid | Approve error / row stays pending |
| 5.6 | On another pending row, tap **Reject** -> leave the reason blank -> Reject | Dialog does NOT close with success (blank reason blocked); no status change | Allows blank reason |
| 5.7 | Tap **Reject** -> enter a reason -> Reject | Snack "Leave rejected"; row moves to Rejected; the reason shows on the row; DB: status='rejected', approved_by set, reject_reason set | Reject error / reason not stored |
| 5.8 | Confirm the PF side reflects the decision | PF Leave page (refresh) shows the leave in Approved or Rejected with the right approver name + reason (cross-checks 4.8/4.9) | PF side does not update |
| 5.9 | Sign in as **me_associate**, check the nav | me_associate must NOT see Leaves or Members Details; typing `/mgmt/leaves` is hard-blocked (redirects away / not allowed) | me_associate can reach the Leave admin |
| 5.10 | (Trigger, DB-side) After a PF applies, confirm one notification per mgmt user was created | `select count(*) from notifications where payload->>'type'='leave' and payload->>'leave_id'='<leave uuid>';` == number of mgmt users | 0 rows (AIK-44 trigger not firing -- SECURITY DEFINER missing) |

---

## 6. Cross-cutting / regression

| # | Step | Expected (PASS) | Fail signal |
|---|---|---|---|
| 6.1 | All the above on **desktop (wide)** and **phone (narrow)** widths | No layout breakage; nav collapses to drawer on narrow | Overflow / broken layout |
| 6.2 | Sign out / sign back in across roles | Role-based nav visibility is correct each time (mgmt sees everything; me sees Personal/Assessment/Reporting only) | Stale nav from previous role |
| 6.3 | Reporting group still works (Dashboard, Stats, Completed Reports, Studio) | Unchanged from Round 1/2 | Broken by Round 3 edits |
| 6.4 | `flutter analyze` already clean on the touched trees -- no action needed, but if you see a runtime crash, note the stack | App stable through all flows | Crash / red screen |

---

## How to report back

For each table, give me the row numbers and PASS/FAIL, e.g.:

```
1.1 PASS, 1.2 PASS, 1.3 FAIL (draft not saved, snackbar "permission denied")
2.1 PASS
...
```

I will fix any FAIL before AIK-54 (merge + prod PROMOTE + release). Nothing is
pushed or merged until you confirm these pass.