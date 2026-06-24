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
- **PF**: signs in with email + password (under "Facilitator sign in"), enters a
  topic (+ optional school), which inserts a `sessions` row with `mode='online'`,
  `attendance_open=true`. Dashboard subscribes to Realtime INSERTs on
  `session_teacher_attendance` for that session. "Stop" sets `attendance_open=false`.
- **Teacher**: taps **Continue with Google** — since they're already signed into
  Google to be in the Meet, this captures their verified Gmail in one tap (no
  password, no email link). Then picks school → name, submits. The Gmail is stored
  as `submitted_email`; one submission per Google account per session is enforced by
  the DB (`23505` → "already recorded").

> Note: Google Meet does not expose other participants' emails to an add-on
> (privacy). Each teacher's Gmail comes from their own Google sign-in, not by
> harvesting the participant list.

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

1. **Enable the Google provider** — Authentication → Providers → Google. Create an
   OAuth 2.0 Client ID in Google Cloud (same Workspace project as the add-on),
   set the **Authorized redirect URI** to the Supabase callback shown on that page
   (`https://<ref>.supabase.co/auth/v1/callback`), and paste the client ID/secret
   into Supabase.
2. **Redirect URLs** — Authentication → URL Configuration: add the deployed URL
   (and `http://localhost:4180` for testing) so the OAuth `redirectTo` lands back
   on the page.

No email/SMTP setup is needed — teachers use Google sign-in, not email links.

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
