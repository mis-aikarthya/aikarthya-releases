---
name: update-database-aikarthya-field-ops
description: |
  Use this skill whenever the user wants to modify, delete, edit, or update data inside an Aikarthya Field Ops Supabase database.
  Triggers include: "delete row", "remove data", "update row", "fix data", "change value",
  "clean up test data", "modify records", "edit database", or any data-only change request.
  This skill is for DATA changes only — not schema migrations. It inspects the data,
  builds a plan, asks the user for final confirmation, then executes.
  Always use this skill for data edits unless the user explicitly says otherwise.
---

# update-database-aikarthya-field-ops

Modify, delete, or edit data in the Aikarthya Field Ops Supabase databases.

## Scope

This skill covers **data-only** operations:
- Deleting test rows
- Updating column values in existing rows
- Inserting small amounts of reference/fix data
- Cleaning up bad data
- Any DML (INSERT, UPDATE, DELETE) that does not change table structure

It does **not** cover:
- Creating / altering / dropping tables, columns, indexes, triggers, or constraints (schema migrations)
- Running `CREATE`, `ALTER`, `DROP`, `RENAME COLUMN`, `ADD COLUMN`, etc.

If the user asks for a schema change, stop and route to the migration workflow instead, respecting the production schema time-bound rule.

## Hard rule: production schema changes

- Structural database changes (migrations) may only be pushed to production between **7 PM and 9 AM IST** (outside 9 AM–7 PM).
- This skill performs **data edits**, which are allowed at any time.
- During the 9 AM–7 PM window, if a schema change is needed, direct the user to use the **staging** database.

## Before any production data change

Before applying changes to **production**, ensure:
1. Any relevant e2e tests have been run recently.
2. A checklist file exists or is created (see Checklist below).
3. A feedback/review file exists or is created for sign-off.

If these do not exist, create them in `aikarthya-docs/checklists/` and ask the user to confirm before proceeding.

## Step 1 — Identify the target database

Ask the user (use AskUserQuestion if unclear):
- Which database should this action target? **Production** or **Staging**?

Refs:
- Production: `nuwqxlhuxwgevxvsyusj`
- Staging: `fmmnrrjkoqsfwhbmswic`

If the user already stated the database, proceed. If ambiguous, ask.

## Step 2 — Inspect the data before changing it

Link to the chosen project:

```bash
cd aikarthya-supabase
supabase link --project-ref <ref>
```

Run a read-only query to understand the rows to be changed. For example:

```bash
supabase db query --linked "SELECT * FROM <table> WHERE id = '<uuid>';"
```

Identify:
- Table name(s)
- Row identifiers (UUIDs or primary keys)
- Foreign-key dependencies that may block deletes
- Any triggers (e.g., immutability triggers) that may block modifications
- Number of rows affected
- Whether dependent rows in other tables must be deleted first

## Step 3 — Build a plan

Draft a concise plan in markdown. Include:
- Target database (production/staging)
- Table(s) affected
- Row identifiers
- Exact SQL operations to run
- Order of operations (e.g., delete child rows before parent rows)
- Any triggers that need to be temporarily disabled and re-enabled
- Rollback considerations (if possible)

Save the plan to a temporary file, e.g.:

```
aikarthya-docs/checklists/db-edit-plan-<timestamp>.md
```

## Step 4 — Ask for final user confirmation

Present the plan to the user and ask for explicit confirmation with AskUserQuestion. For example:

```
I found the following rows. I will:
1. Disable trigger X on table Y.
2. Delete 3 dependent rows from table Z.
3. Delete 1 row from table Y where id = ...
4. Re-enable trigger X.

Do you want me to proceed? [Yes / No / Modify plan]
```

Do **not** execute destructive or modifying operations until the user confirms.

## Step 5 — Execute the plan

Run the SQL using the linked project:

```bash
supabase db query --linked "<SQL>"
```

If a trigger must be disabled:

```sql
ALTER TABLE <table> DISABLE TRIGGER <trigger_name>;
-- DML statements
ALTER TABLE <table> ENABLE TRIGGER <trigger_name>;
```

Always re-enable the trigger in the same command.

## Step 6 — Verify the change

Run a follow-up query to confirm the change:

```bash
supabase db query --linked "SELECT count(*) FROM <table> WHERE id = '<uuid>';"
```

Also verify the trigger state if it was touched:

```bash
supabase db query --linked "SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = '<trigger_name>';"
```

## Step 7 — Document and report

1. Append a brief note to the plan file confirming execution, timestamp, and result.
2. Update or create the review/feedback checklist file:
   - `aikarthya-docs/checklists/db-edit-feedback-<timestamp>.md`
3. Report to the user:
   - Rows affected
   - Tables changed
   - Verification counts
   - Any errors or blockers encountered

## Special cases

### Deleting rows with immutability triggers

Some tables have triggers like `trg_obs_immutability` that prevent modifying submitted observations. To delete such rows:

1. Disable the trigger for that table only.
2. Delete dependent child rows first (e.g., `report_jobs`).
3. Delete the parent row.
4. Re-enable the trigger immediately.

### Foreign-key blocks

If a delete fails due to a foreign-key constraint, inspect the dependent table and include deletion of dependent rows in the plan.

### Large or batch deletes

For deletes affecting many rows, prefer adding a `LIMIT` clause or breaking into smaller batches, and always report the count before and after.

## Safety reminders

- Never run schema-change SQL with this skill.
- Always confirm with the user before `DELETE` or `UPDATE` on production.
- Always verify the change afterward.
- Always keep the immutability trigger enabled except during the exact delete operation.
- Keep a written plan and feedback file for every production edit.
