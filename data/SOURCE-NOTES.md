# Data refresh: 2026-09-30

Source: Krusty Krab League Hall of Records, https://docs.google.com/spreadsheets/d/1J26qCT9Ip0fya2hHAsM8NNaz1G0ZFLWIzKjiPaOOhrc/edit

- teams.csv: overall W-L-T, all-play W-L-T and top-week counts derived from completed All Games - Raw rows Q4:AC1900, including 2026 Week 3. Other identity and completed-season fields preserved.
- current-standings.csv and game-results.csv: 2026 Weeks 1–3 from the same raw game log. All 24 owner-week rows have matching reciprocal scores; PF and PA totals balance.
- pickem-weekly.csv: Mini Games Query A1:V17, correct-pick counts through Week 3. ESPN uses ten points per correct pick.
- standings.csv remains the completed-season archive. In-progress standings are separate because existing page rendering treats rank as a completed-season finish. New current-season files require a future display integration.
- mini-games.csv remains an archive of season winners, not ongoing leaders. No 2026 winner has been declared.
- Added canonical .csv copies of three existing files to match site loader paths; retained originals.
- Corrected Travis Kelce spelling in all-time-players.csv.

Unresolved historical source inconsistencies; historical H2H was not regenerated:
- 2020 Week 16 Miner–Kyle: Miner score 119 in Miner row, 111 in Kyle row.
- 2021 Week 17 Gary–Miner: Miner score 128 in Gary row, 127 in Miner row.
- 2023 Week 4 Kyle–Miner: Kyle score 77 in Kyle row, 78 in Miner row.

Some historical standings contain conflicting owner identities and record/percentage values. Those rows were preserved pending reconciliation. Editorial power ranks, legends choices and season winners were preserved.
