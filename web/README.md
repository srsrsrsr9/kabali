# Doddanekkundi Tracker — deployable web app

Drop this folder into a GitHub repo, point a static host at it, connect a
Supabase project, and your notes sync across every device you sign in on.

It works before you do any of that: with `config.js` left at its
placeholders the tracker saves to the device you are using and nothing
else. Connecting Supabase is an upgrade, not a prerequisite.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page. Loads everything below in order. |
| `config.js` | **The only file you edit.** Your Supabase URL and anon key. |
| `schema.sql` | Run once in Supabase to create the table and its security policy. |
| `data.js` | The catalogue — 29 schools, phone numbers, the nine questions, the timeline, rent zones. Edit here to add a school or fix a number. |
| `store.js` | Storage: Supabase, with IndexedDB and localStorage as local mirrors. |
| `app.js` | The interface. |
| `styles.css` | Styling, light and dark. |
| `vendor/` | React and the Supabase client, vendored so there is no CDN to depend on. |
| `netlify.toml` | Netlify settings. No build step; publish directory is `.`. |

## Setting up Supabase

1. **Create a project** at supabase.com — the free tier is ample; this
   stores a few kilobytes.
2. **Create the table.** Dashboard → SQL Editor → New query → paste
   `schema.sql` → Run.
3. **Allow your site to sign people in.** Dashboard → Authentication →
   URL Configuration:
   - *Site URL*: your deployed address, e.g. `https://yoursite.netlify.app`
   - *Redirect URLs*: add the same address. Sign-in links bounce back
     here, and Supabase refuses any address not on this list — this is
     the step people miss, and the symptom is a link that opens but
     never signs you in.
4. **Fill in `config.js`** with the Project URL and the `anon` key from
   Project Settings → API. Commit and redeploy.
5. Open the site, enter your email, and click the link Supabase sends.
   The badge should change from *Saved on this device* to *Synced to
   your account*. Repeat on your phone and the two stay in step.

### About the anon key

It is public by design and ships in every Supabase browser app. What
protects your rows is the row-level security policy in `schema.sql`:
a signed-in user can read and write rows where `user_id = auth.uid()`
and no others. Never put the `service_role` key in `config.js` — that
one bypasses RLS.

## Deploying

**Netlify** — drag this folder onto app.netlify.com/drop, or connect the
repo and accept `netlify.toml` (publish `.`, no build command).

**GitHub Pages** — Settings → Pages → deploy from a branch, folder
`/web` if you keep this layout, or move these files to the repo root.

**Anything else** — it is plain static files. No build step.

## How storage behaves

Writes go to the local mirror first, then to Supabase. A push that fails
is queued and retried on the next edit, on reconnect, and on sign-in, so
losing signal mid-call does not lose the note. Rows changed on another
device arrive live over Supabase realtime.

Conflicts are last-write-wins per row. The only case that loses anything
is two devices editing the same field within seconds, and the loser is
whichever saved first.

The Timeline tab has a Backup panel that copies, downloads and restores
everything as JSON. Use it before switching phones.

## What has and has not been tested

Verified in Chromium: the catalogue renders, edits persist across a
reload from IndexedDB, the sign-in bar appears and validates once
`config.js` is filled in, and the page falls back cleanly when Supabase
is absent.

**Not verified against a live Supabase project** — I had no project to
point at. The sign-in round trip, the upsert, the delete and the realtime
subscription are written to the documented API but unproven. If something
misbehaves after you connect, the browser console plus Supabase's Logs →
API view will name it, and step 3 above is the usual culprit.
