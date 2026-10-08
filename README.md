# Krusty Krab League

Static league website for https://krustykrableague.com. HTML, CSS and browser JavaScript; no production build or package installation required.

## Local preview

Run `python3 -m http.server 8765` at the repository root and open http://localhost:8765.

## Data and automatic refresh

Pages read the existing `data/*.csv` files through `data-loader.js`. The hourly Hall of Records workflow updates those files from the Google spreadsheet. See `data/SYNC.md` for source setup and `data/SOURCE-NOTES.md` for known historical inconsistencies. Current standings and weekly results remain separate from completed-season archives. No client-side credentials are needed.

- Standings: current playoff positions, lifetime franchise records, current pick’em totals.
- Head-to-Head: franchise selector and recorded series totals.
- Weekly Results: season/week selector and one scoreboard card per matchup.
- Hall of Fame: editorial moments supplied by the existing CSV.
- League Alumni: former owners and franchise history.
- Rules: established league format and the official ESPN settings link.

Shared navigation, accessibility, active-page indication and unavailable-artwork fallback live in `site.js`. Editorial legends and unavailable historical facts should be supplied in the data rather than guessed in code. Hall of Fame deliberately displays text rather than owner photos.

Cloudflare hosting remains configured by `wrangler.jsonc`; no hosting migration is required. Legacy rivalry/constitution/league-map URLs redirect to their completed destinations.

## Checks

Run `python3 scripts/check_site.py` and `node --test tests/data-loader.test.cjs`. A separate DOM smoke check verified rendering of 17 page variants, current standings, active/alumni filtering, head-to-head selection, weekly scoreboards, and dropdown interactions. Full browser layout verification still needs a reachable preview or deployment.
