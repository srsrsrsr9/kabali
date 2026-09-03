# Doddanekkundi move

Working files for a family relocating to east Bengaluru for the 2027–28
academic year: two children entering Grade 9 and Grade 5, CBSE, Telugu as
second language and Hindi as third, anchored on an office at IndiQube ETA
on the Outer Ring Road at Doddanekkundi.

| File | What it is |
| --- | --- |
| `index.html` | The tracker. 29 schools with numbers, the nine-question call sheet, a rentals list and the timeline. |
| `report.html` | The underlying research: the language rules, the school shortlist, rent bands, sources. |
| `src/*.artifact.html` | The same two pages in Claude Artifact format (no `<html>`/`<head>`/`<body>` wrapper). |

## Where the data is kept

The tracker has two storage backends and picks one at runtime:

- **Published as a Claude Artifact** — it calls `claude.use("db")` and keeps
  everything in the artifact's document store. Shared across your devices,
  survives republishing, and readable back in a Claude session.
- **Anywhere else, Netlify included** — `claude.use` is absent, so it falls
  back to `localStorage`. Data then lives in one browser on one device and
  is not synced or backed up.

The header badge says which one is active: *Synced across your devices* or
*Saved in this browser only*.

## Deploying to Netlify

No build step and no dependencies to install.

```
npx netlify-cli deploy --prod --dir .
```

Or connect the repo at app.netlify.com and accept the settings in
`netlify.toml` — publish directory `.`, build command empty.

## Editing

`index.html` is a single self-contained file: styles at the top, then a
`<div id="root">`, then React 18 from cdnjs and the app in one `<script>`.
The school catalogue, the nine questions, the timeline and the rent zones
are plain arrays at the top of that script — that is where to add a school
or a phone number. Everything a user types is state and lives in the store,
never in the file.

To regenerate `src/*.artifact.html` after editing, strip the
`<!doctype>`/`<html>`/`<head>`/`<body>` wrapper; Artifact supplies its own.

## Caveats carried over from the research

Fee figures are indicative, compiled from school-listing aggregators that
mix one-time and recurring charges. Distances are estimates from area
centroids. Phone numbers came from public directories rather than the
schools. No source confirms that any specific school offers Telugu — that
is what the call sheet is for.
