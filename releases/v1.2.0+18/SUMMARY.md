# Summary — Aikarthya Field Ops v1.2.0+18

Aikarthya Field Ops v1.2.0+18 is a large release (286 commits on from v1.1.1+16)
built around three themes: an **offline-sync overhaul**, the **mgmt console
overhaul**, and **live push/email notification delivery on production**.

**Installs as a NEW app.** The Android application identity moved from the old
`org.aikarthya.fieldops` (last shipped in v1.1.1+16) to the permanent
`in.org.aikarthya.app`. Because the package name differs, Android installs
v1.2.0 as a **separate app** rather than an in-place upgrade — users keep the old
app until they remove it, and the old app's in-app update dialog points them to
the Drive folder to install the new one. The new package matches the production
Firebase registration (`aikarthya-field-ops-production`,
`1:206844666486:android:61f89c417850508566f557`), so FCM push works on the new
build.

**Offline-sync overhaul.** STF fellow reads now survive offline; the reachability
probe and offline profile fallback are repaired; the web write queue gained
`upsert` and `rpc` ops and drains cross-platform; `student_attendance` marks
queue-and-replay offline with snapshot-fallback reads and queued-mark overlay;
and all STF form persistence (session + roster, DCR, observation, OCR,
submissions, items, assignments) plus mgmt-console STF writes now route through
the three-way sync branch (Brick / web write-queue / direct-Supabase). Ten new
`stf_*` Brick models back the offline spine.

**Mgmt console overhaul.** STF navigation restructured with an STF overview,
schools table, team roster role tabs, urban/rural + nature/month/session
categorization for STF assignments and feedback, reporting SkillUp/STF programme
tabs and filters, and graceful per-chart degrade. A Critical `me_associate`
STF-access regression caught in final review was fixed (access block restored,
overview reuses fellow ids).

**Notification delivery, now live on prod.** Production FCM was previously
disabled in app code (null Firebase options → no token → no endpoint); this
release adds `firebase_options_production.dart` and flips the transport selector
so Android registers a real FCM endpoint, and sets the production
`WEB_PUSH_VAPID_PUBLIC_KEY` in `.env.production` so browsers can subscribe to Web
Push. PF-ops notifications are routed with a home-vs-resume route allowlist
split. The backend half of the chain (6 pf-ops producer migrations + all 20 edge
functions + Vault + function secrets) was promoted to production on 2026-07-24;
delivery lights up once devices running this build register endpoints.

Web/PWA deploys to `app-aikarthya.pages.dev` (Cloudflare Pages Production, branch
`main`). `app_versions` rows for android, windows, and web publish with
`force_update = false`. Release signs with the debug keystore (existing TODO),
consistent with the v1.2.0+17 build of the same new package.
