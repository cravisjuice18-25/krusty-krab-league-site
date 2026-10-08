# Hall of Records connection

Source: [Krusty Krab League Hall of Records](https://docs.google.com/spreadsheets/d/1J26qCT9Ip0fya2hHAsM8NNaz1G0ZFLWIzKjiPaOOhrc/edit).

The `Sync Hall of Records` GitHub workflow checks the sheet hourly at minute 17,
and whenever the sync implementation changes. GitHub can delay scheduled runs.
It validates the data, commits changed CSV files to `main`, and lets the existing
Cloudflare Git integration publish the website. Nothing needs to be manually
exported or copied. The sheet was already readable without signing in; its
sharing permissions were not changed. It must remain readable for this method.

## What is linked

| Website data | Sheet source |
| --- | --- |
| Teams: career record, all-play record, titles, playoff appearances, Sco finishes, average finish, top weeks | All Games - Raw; Historical; Champions; The Sco; All-Time Owners |
| Current standings and completed current-year game results | All Games - Raw |
| Completed-season standings and historical owner identity | Standings; Seasons; All-Time Owners |
| Champions and original championship game scores | Champions |
| The Sco archive | The Sco; All Games - Raw |
| Play-in winners | The Play-In |
| Head-to-head records | All Games - Raw; known conflicting pairs retain existing records |
| Best franchise player seasons and best positional seasons | Player Season Stats |
| Draft picks, including the latest draft board | Draft History; Past Drafts; Seasons; All-Time Owners |
| Record book and homepage featured records | Records; All Games - Raw; Champions; The Sco |
| Franchise record summaries | All Games - Raw |
| Weekly pick'em totals | Mini Games Query |

The Records page now loads its statistics from `records.csv`. The Seasons page
includes current standings with an explicit through-week label, without
declaring an in-progress season's leader the champion. Other existing pages
continue to consume their original CSV filenames. Trophy Room's existing
standings/play-in-derived displays update from those files.

Editorial descriptions, images, logos, colors, legends, manually chosen draft
callouts, Hall of Fame stories, events, and manually entered awards stay as
authored. The pipeline does not invent these or declare ongoing mini-game
leaders to be season winners. Files not listed above are not overwritten.

## Validation and failure behavior

All sources and outputs validate before writes. A login page, network error,
missing owner, unexpectedly truncated source, duplicate game, incomplete
current week, conflicting current scores, or inconsistent current all-play
results stops the workflow and keeps the last published data. It retries
temporary download failures. Future score placeholders and the voided 2022
championship are excluded. Public outputs never include contact information;
the owner read is limited to columns A:I. No source snapshots or credentials
are committed.

Historical score conflicts are reported in `sync-status.json`; affected H2H
pairs are preserved rather than silently choosing one score. Other valid
datasets can still refresh. Original title-game scores come from the explicit
original-score columns, including the scoring adjustment distinction for
2014–2016.

Read `data/sync-status.json` for the latest successful data update, source,
completed week, and warnings. A monthly heartbeat commit keeps the repository
active during offseason. Unchanged hourly checks do not create commits.

## Maintenance

Keep source columns in their existing order. Tab labels can change because
reads use sheet IDs, but a deleted/recreated tab needs its new ID in
`scripts/sync_records.py`. The script fails if a configured row bound is filled;
increase that bound before records exceed it. An owner expansion or league-size
change requires reviewing the owner count and current-week validation.

Run `python3 scripts/sync_records.py --check` to verify live sources without
writing. Run `python3 scripts/sync_records.py` to regenerate the data. The
workflow also offers **Run workflow** in GitHub Actions for troubleshooting.
