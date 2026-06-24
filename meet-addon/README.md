# Online Attendance — Google Meet Add-on

A single static page (`index.html` + `config.js`, no build step) that runs inside
a Google Meet side panel. Facilitators start/stop a live attendance window and
watch submissions roll in; teachers sign in by email and self-submit once.

Backend is the existing Supabase project — see migration
`aikarthya-supabase/supabase/migrations/20260624000000_meet_addon_attendance.sql`.
Everything here is protected by RLS; the anon key in `config.js` is publishable.

## Files

| File | What |
|------|------|
| `index.html` | Whole app — auth, PF dashboard, teacher submit. |
| `config.js`  | Supabase URL + publishable anon key + `HOST_ROLES`. **Swap both values for prod when deploying to prod.** |

## How it works

- **Routing** is by `profiles.role`. A login whose profile role is in `HOST_ROLES`
  (`pf`, `me_associate`, `mgmt`) gets the facilitator view. Any other login — including
  a teacher with no profile row — gets the teacher view.
- **PF**: enters a topic (+ optional school), which inserts a `sessions` row with
  `mode='online'`, `attendance_open=true`. Dashboard subscribes to Realtime INSERTs
  on `session_teacher_attendance` for that session. "Stop" sets `attendance_open=false`.
- **Teacher**: signs in via magic link, picks school → name, submits. One submission
  per email per session is enforced by the DB (`23505` → "already recorded").

## Run locally

```sh
npx -y serve meet-addon -l 4180
# open http://localhost:4180
```

(Already wired as the `meet-addon` preview config in `.claude/launch.json`.)

## Deploy (Cloudflare Pages — per pwa-hosting research)

It's two static files. Any static host works; Cloudflare Pages is the chosen one.

1. Push this `meet-addon/` folder somewhere Pages can build from, **or** use Direct Upload:
   ```sh
   npx wrangler pages deploy meet-addon --project-name aikarthya-attendance
   ```
2. Note the URL, e.g. `https://aikarthya-attendance.pages.dev`. That URL is what
   the Meet Add-on loads.
3. For prod, edit `config.js` to the prod project ref / anon key first, then redeploy.

No env vars, no secrets — the only key shipped is the publishable anon key.

## Supabase Auth settings (one-time, per environment)

In **Authentication → URL Configuration**, add the deployed URL (and
`http://localhost:4180` for testing) to **Redirect URLs**, so the magic-link
`emailRedirectTo` lands back on the page. Confirm email sending is enabled
(**Authentication → Providers → Email**). Magic-link delivery uses Supabase's
default email unless an SMTP provider is configured.

## Register as a Google Meet Add-on (Workspace admin)

You confirmed the org has Workspace admin, so a **private** add-on is viable.

1. **Google Cloud project** → enable the **Google Workspace Add-ons API** and the
   **Google Meet Add-ons** feature.
2. Create an **add-on deployment** manifest. Minimal side-panel manifest:
   ```json
   {
     "addOns": {
       "common": { "name": "Online Attendance", "logoUrl": "https://aikarthya-attendance.pages.dev/icon.png" },
       "meet": {
         "web": {
           "sidePanelUri": "https://aikarthya-attendance.pages.dev/",
           "supportsScreenSharing": false
         }
       }
     }
   }
   ```
   (Host the manifest per the Meet Add-ons SDK "static deployment" docs:
   https://developers.google.com/workspace/meet/add-ons/guides/overview)
3. **Install privately**: in the Google Cloud project, under the Workspace Marketplace
   SDK config, set visibility to **Private / your domain only**, then have the Workspace
   admin install it for the org (or specific OUs) from the **Admin console → Apps →
   Google Workspace Marketplace apps**.
4. Add-on now appears in the Meet **Activities** panel for org users.

> The page is self-contained and also works as a plain shared link — if Meet
> registration is delayed, hand out the Pages URL and it behaves identically.
> The Meet Add-ons SDK is only needed if you later want meeting context
> (auto-filling the meeting code); the current page doesn't require it.

## Not done yet (deliberate)

- `icon.png` / logo asset — add one before publishing the manifest.
- Meet SDK meeting-context wiring — only if you want auto-fill; honor-system flow
  doesn't need it.
