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
| `vendor/` | React, the Supabase client and Leaflet, vendored so there is no CDN to depend on. |
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

Verified in Chromium, with the real vendored supabase-js and its HTTP
calls intercepted:

- the catalogue renders and edits survive a reload out of IndexedDB;
- a seeded session is detected — the badge reads *Synced to your account*
  and the sign-in bar shows the signed-in address;
- the initial pull runs exactly once and rows that exist only on the
  server appear in the UI;
- an edit issues `POST /rest/v1/tracker_rows?on_conflict=user_id,collection,doc_id`
  carrying exactly the five table columns;
- deleting a row issues `DELETE ...?collection=eq.<c>&doc_id=eq.<id>`;
- with `config.js` blanked the app falls back cleanly to device storage.

The delete filters on collection and doc_id only, not user_id. That is
deliberate — the RLS policy scopes it to the caller's own rows, which is
also what stops a client deleting anyone else's.

**Not verified against the live project**: the sign-in email round trip
and realtime, because the Supabase host is unreachable from the machine
this was built on. If a sign-in link opens but never signs you in, the
cause is almost always step 3 — the deployed address missing from
Authentication → URL Configuration → Redirect URLs.

## The map

The Map tab uses Leaflet with OpenStreetMap tiles, not the Google Maps
JavaScript API. That API needs a key with billing enabled on a Google
Cloud project, which is a bigger commitment than a map of 29 pins
deserves; Leaflet and OSM need nothing. Every pin still links out to
Google Maps for the real address and directions.

Pins are locality centroids, not geocoded addresses — no geocoding
service was reachable when this was built. They are accurate enough to
show which side of the Outer Ring Road a school is on and how the
shortlist sits against the office. Janes International is exact, from a
Google Maps link.

To correct a pin, edit `COORDS` in `data.js`. To switch to Google Maps
proper, you would add a key to `config.js` and swap the Leaflet calls in
`MapView`; say so and it can be done.
