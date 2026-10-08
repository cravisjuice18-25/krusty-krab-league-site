#!/usr/bin/env python3
"""Translate the Hall of Records into the site's existing CSV contracts.

Only public league statistics are fetched. No Google credentials, workbook
copies, contact columns, or raw source dumps are saved in the repository.
"""
import argparse
import collections
import concurrent.futures
import csv
import datetime as dt
import io
import json
import math
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHEET = "1J26qCT9Ip0fya2hHAsM8NNaz1G0ZFLWIzKjiPaOOhrc"
# Restrict columns as well as rows; particularly exclude owner contact columns.
SOURCES = {
    "All-Time Owners": (752949370, "A1:I1000"),
    "All Games - Raw": (1313069724, "Q1:AC20000"),
    "Historical": (1245638722, "A1:CE1000"),
    "Champions": (512998425, "A1:AN1000"),
    "The Sco": (1393102613, "A1:AH1000"),
    "Standings": (1830019433, "A1:M3000"),
    "Seasons": (1054013018, "A1:BD3000"),
    "The Play-In": (793596196, "A1:AF1000"),
    "Past Drafts": (2064930203, "A1:M3000"),
    "Draft History": (623874621, "A1:J10000"),
    "Player Season Stats": (716083030, "A1:AT10000"),
    "Records": (358320048, "A1:I3000"),
    "Season-By-Season": (326432403, "A1:AT1000"),
    "Mini Games Query": (880427843, "A1:T1000"),
}

def cell(row, index):
    return str(row[index]).strip() if index < len(row) and row[index] is not None else ""

def number(value):
    value = str(value).replace(",", "").strip()
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("Non-finite number")
    return result

def fmt(value):
    return format(number(value), ".10g")

def norm(value):
    return re.sub(r"[^a-z0-9]", "", str(value).lower())

def year(value):
    return bool(re.fullmatch(r"20\d{2}", str(value)))

def record(w, l, t):
    return f"{int(w)}-{int(l)}" + (f"-{int(t)}" if t else "")

def csv_text(headers, rows):
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=headers, lineterminator="\n", extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()

def existing(filename):
    with (ROOT / "data" / filename).open(newline="") as stream:
        reader = csv.DictReader(stream)
        return reader.fieldnames, [row for row in reader if any(row.values())]

def fetch_source(name):
    gid, rectangle = SOURCES[name]
    url = f"https://docs.google.com/spreadsheets/d/{SHEET}/export?" + urllib.parse.urlencode(
        {"format": "csv", "gid": gid, "range": rectangle})
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "KKL-Records-Sync/1.0"})
            with urllib.request.urlopen(request, timeout=45) as response:
                if "text/csv" not in response.headers.get("Content-Type", ""):
                    raise ValueError(f"{name}: Google returned a login/error page instead of CSV")
                text = response.read(5_000_001).decode("utf-8-sig")
                if len(text) > 5_000_000:
                    raise ValueError(f"{name}: source exceeds size limit")
            rows = list(csv.reader(io.StringIO(text)))
            limit = int(re.search(r"(\d+)$", rectangle).group(1))
            if len(rows) >= limit:
                raise ValueError(f"{name}: enlarge the configured row bound before syncing")
            if not rows or not any(any(row) for row in rows):
                raise ValueError(f"{name}: empty source")
            return name, rows
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))

def transform(sources):
    outputs, warnings = {}, []
    owners, ids, aliases, franchises, statuses = {}, {}, {}, {}, {}
    for row in sources["All-Time Owners"]:
        if re.fullmatch(r"KKL\d{3}", cell(row, 0)):
            slug = cell(row, 1).lower()
            owners[slug] = cell(row, 1)
            ids[cell(row, 0)] = slug
            aliases[norm(cell(row, 1))] = slug
            for alias in re.split(r"[,;/]", cell(row, 6)):
                if alias:
                    aliases[norm(alias)] = slug
            franchises[slug] = cell(row, 5)
            statuses[slug] = "Active" if cell(row, 2) == "ACTIVE" else "Inactive"
    if len(owners) != 12 or sum(v == "Active" for v in statuses.values()) != 8:
        raise ValueError("Owner registry must contain the 12 known owners and 8 active owners")

    def owner(value):
        result = ids.get(value) or aliases.get(norm(value))
        if not result:
            raise ValueError(f"Unmapped owner: {value!r}")
        return result

    def emit(filename, rows, headers=None, minimum=1):
        if len(rows) < minimum:
            raise ValueError(f"{filename}: unexpectedly empty/truncated output")
        if headers is None:
            headers, previous = existing(filename)
            if len(rows) < len(previous) * .8:
                raise ValueError(f"{filename}: output unexpectedly lost more than 20% of its rows")
        outputs[filename] = csv_text(headers, rows)

    # Raw rows include future schedule placeholders. Only recorded W/L/T games
    # count, and the voided 2022 championship is excluded explicitly.
    games = []
    keys = set()
    for row in sources["All Games - Raw"]:
        if not year(cell(row, 0)) or not cell(row, 2) or cell(row, 8) not in {"W", "L", "T"}:
            continue
        if cell(row, 0) == "2022" and cell(row, 7) == "Finals":
            continue
        game = dict(year=int(cell(row, 0)), week=int(number(cell(row, 1))),
                    owner_id=owner(cell(row, 2)), points_for=number(cell(row, 3)),
                    opponent_id=owner(cell(row, 6)), points_against=number(cell(row, 5)),
                    game_type=cell(row, 7), result=cell(row, 8),
                    weekly_rank=cell(row, 9), all_play_wins=int(number(cell(row, 10) or ("0" if cell(row, 7) == "PlayIn" else ""))),
                    all_play_losses=int(number(cell(row, 11) or ("0" if cell(row, 7) == "PlayIn" else ""))), all_play_ties=int(number(cell(row, 12) or ("0" if cell(row, 7) == "PlayIn" else ""))))
        key = (game["year"], game["week"], game["owner_id"])
        if key in keys:
            raise ValueError(f"Duplicate game: {key}")
        keys.add(key)
        expected = "W" if game["points_for"] > game["points_against"] else "L" if game["points_for"] < game["points_against"] else "T"
        if game["result"] != expected:
            raise ValueError(f"Score/result conflict: {key}")
        games.append(game)
    if len(games) < 1500:
        raise ValueError("Historical game source unexpectedly truncated")
    lookup = {(g["year"], g["week"], g["owner_id"]): g for g in games}
    latest = max(g["year"] for g in games)
    historical_conflicts = set()
    for g in games:
        other = lookup.get((g["year"], g["week"], g["opponent_id"]))
        if not other or other["opponent_id"] != g["owner_id"] or other["points_for"] != g["points_against"] or other["points_against"] != g["points_for"]:
            if g["year"] == latest:
                raise ValueError(f"Current matchup does not reconcile: {g['year']} W{g['week']} {g['owner_id']}")
            historical_conflicts.add((g["year"], g["week"], *sorted([g["owner_id"], g["opponent_id"]])))
    for y, w, a, b in sorted(historical_conflicts):
        warnings.append(f"{y} W{w}: {a}/{b} reciprocal scores disagree; historical H2H pair preserved.")

    current = [g for g in games if g["year"] == latest]
    grouped = collections.defaultdict(list)
    for g in current:
        grouped[g["week"]].append(g)
    for w, group in grouped.items():
        expected_count = 2 if all(g["game_type"] == "PlayIn" for g in group) else 8
        if len(group) != expected_count or len({g["owner_id"] for g in group}) != expected_count:
            raise ValueError(f"Current week {w} is incomplete; retaining previous site data")
        for g in group:
            if g["game_type"] == "PlayIn":
                continue
            others = [h for h in group if h["owner_id"] != g["owner_id"]]
            ap = (sum(g["points_for"] > h["points_for"] for h in others),
                  sum(g["points_for"] < h["points_for"] for h in others),
                  sum(g["points_for"] == h["points_for"] for h in others))
            if ap != (g["all_play_wins"], g["all_play_losses"], g["all_play_ties"]):
                raise ValueError(f"Current all-play does not reconcile: {w} {g['owner_id']}")
    if sorted(grouped) != list(range(1, max(grouped) + 1)):
        raise ValueError("Current season has missing completed weeks")
    through = max(grouped)
    emit("game-results.csv", current)

    # Season table supplies a year-specific team-name/owner mapping. Never infer
    # the historical owner of a recycled team name from its present franchise.
    season_rows = [r for r in sources["Seasons"] if year(cell(r, 3)) and cell(r, 1)]
    season_map = {}
    season_by_owner = {}
    team_aliases = collections.defaultdict(set)
    for o, name in franchises.items():
        if name:
            team_aliases[norm(name)].add(o)
    for row in season_rows:
        o = owner(cell(row, 1))
        season_map[(cell(row, 3), norm(cell(row, 2)))] = o
        season_by_owner[(cell(row, 3), o)] = row
        team_aliases[norm(cell(row, 2))].add(o)
    def historical_owner(y, name):
        exact = season_map.get((y, norm(name)))
        candidates = team_aliases.get(norm(name), set())
        return exact or aliases.get(norm(name)) or (next(iter(candidates)) if len(candidates) == 1 else None)
    standings, current_year = [], None
    for row in sources["Standings"]:
        if year(cell(row, 1)):
            current_year = cell(row, 1)
            continue
        if not current_year or not re.fullmatch(r"\*?\d+[.]?", cell(row, 1)):
            continue
        o = historical_owner(current_year, cell(row, 2))
        if not o:
            # Some early team labels differ between the two source tabs. An
            # exact PF match (with the documented historical scoring factor)
            # can resolve identity without guessing from a reused name.
            factor = 1.25 if int(current_year) <= 2016 else 1
            matches = [so for (sy,so), sr in season_by_owner.items() if sy == current_year and abs(number(cell(sr,13)) / factor - number(cell(row,6))) < .01]
            if len(matches) == 1:
                o = matches[0]
                warnings.append(f"{current_year}: archive team label {cell(row,2)!r} mapped to {owners[o]} by exact season PF.")
        if not o:
            raise ValueError(f"Unmapped historical team: {current_year} {cell(row, 2)}")
        standings.append(dict(year=current_year, rank=re.sub(r"\D", "", cell(row, 1)), owner_id=o,
                              team=cell(row, 2), team_rating=fmt(cell(row, 3)), record=cell(row, 4),
                              win_pct=fmt(cell(row, 5)), points_for=fmt(cell(row, 6)), avg_for=fmt(cell(row, 7)),
                              points_against=fmt(cell(row, 8)), avg_against=fmt(cell(row, 9)),
                              point_margin=fmt(cell(row, 10)), avg_point_margin=fmt(cell(row, 11)), moves=cell(row, 12)))
    for y in {r["year"] for r in standings}:
        group = [r for r in standings if r["year"] == y]
        if len(group) != 8 or len({r["owner_id"] for r in group}) != 8:
            raise ValueError(f"Archive standings identity conflict in {y}")
    emit("standings.csv", standings)

    championship_rows = []
    for row in sources["Champions"]:
        if not year(cell(row, 1)):
            continue
        if not cell(row, 4):
            if "void" in cell(row, 2).lower():
                championship_rows.append(dict(year=cell(row, 1), champion="No Winner", champion_owner_id="na", runner_up="NA", final_score="NA", champion_record="NA"))
            continue
        o = owner(cell(row, 4))
        championship_rows.append(dict(year=cell(row, 1), champion=owners[o], champion_owner_id=o,
                                     runner_up=owners[owner(cell(row, 37))],
                                     final_score=f"{fmt(cell(row, 38))}-{fmt(cell(row, 39))}",
                                     champion_record=record(number(cell(row, 6)), number(cell(row, 7)), number(cell(row, 8)))))
    emit("champions.csv", championship_rows)

    sco_rows = []
    for row in sources["The Sco"]:
        if year(cell(row, 1)) and cell(row, 4):
            y, o = cell(row, 1), owner(cell(row, 4))
            loser_games = [g for g in games if str(g["year"]) == y and g["owner_id"] == o and g["game_type"] == "Losers"]
            game = loser_games[0] if len(loser_games) == 1 else None
            sco_rows.append(dict(year=y, owner_id=o, team=cell(row, 3), regular_season_seed=cell(row, 10),
                                 regular_season_record=record(number(cell(row, 18)), number(cell(row, 19)), number(cell(row, 20))),
                                 avg_points_for=fmt(cell(row, 12)), round_1_loss="Yes",
                                 sco_game_loss=f"{fmt(game['points_for'])}-{fmt(game['points_against'])}" if game else "",
                                 sco_opponent=owners[game["opponent_id"]] if game else ""))
    emit("the-sco.csv", sco_rows)

    playin_groups = collections.defaultdict(list)
    y = None
    for row in sources["The Play-In"]:
        if year(cell(row, 1)):
            y = cell(row, 1)
        if y and cell(row, 4) and cell(row, 2):
            playin_groups[y].append(row)
    playins = []
    for y, group in playin_groups.items():
        if len(group) != 2:
            raise ValueError(f"Play-in pair incomplete: {y}")
        win, lose = sorted(group, key=lambda r: number(cell(r, 2)), reverse=True)
        playins.append(dict(year=y, winner_owner_id=owner(cell(win, 4)), winner_team=cell(win, 3),
                            opponent_owner_id=owner(cell(lose, 4)), opponent_team=cell(lose, 3),
                            score=f"{fmt(cell(win, 2))}-{fmt(cell(lose, 2))}", notes=""))
    emit("play-in.csv", playins)

    headers, teams = existing("teams.csv")
    historical_summary = {owner(cell(r,1)):r for r in sources["Historical"] if norm(cell(r,1)) in aliases and cell(r,13)}
    for team in teams:
        o = owner(team["owner_id"])
        own_games = [g for g in games if g["owner_id"] == o]
        counts = collections.Counter(g["result"] for g in own_games)
        team.update(status=statuses[o], owner=owners[o], record=record(counts["W"], counts["L"], counts["T"]),
                    titles=str(sum(r["champion_owner_id"] == o for r in championship_rows)),
                    sco_finishes=str(sum(r["owner_id"] == o for r in sco_rows)),
                    playoff_appearances=str(len({g["year"] for g in own_games if g["game_type"] == "Semifinals"})),
                    all_play_record=record(sum(g["all_play_wins"] for g in own_games), sum(g["all_play_losses"] for g in own_games), sum(g["all_play_ties"] for g in own_games)),
                    top_week_count=str(sum(g["weekly_rank"] == "1" and g["game_type"] != "PlayIn" for g in own_games)))
        if franchises[o]:
            team["team_name"] = franchises[o]
        if o in historical_summary:
            team["average_finish"] = fmt(cell(historical_summary[o],13))
    emit("teams.csv", teams, headers)
    team_lookup = {r["owner_id"]: r for r in teams}

    regular_current = [g for g in current if g["game_type"] == "R"]
    current_standings = []
    for o in owners:
        own = [g for g in regular_current if g["owner_id"] == o]
        if not own:
            continue
        c = collections.Counter(g["result"] for g in own)
        pf, pa = sum(g["points_for"] for g in own), sum(g["points_against"] for g in own)
        current_standings.append(dict(year=latest, through_week=through, owner_id=o, team=team_lookup[o]["team_name"],
                                     record=record(c["W"], c["L"], c["T"]), win_pct=fmt((c["W"] + c["T"] / 2) / len(own)),
                                     points_for=fmt(pf), points_against=fmt(pa), avg_for=f"{pf/len(own):.2f}", avg_against=f"{pa/len(own):.2f}",
                                     point_margin=fmt(pf-pa), status="in_progress"))
    current_standings.sort(key=lambda r: (-number(r["win_pct"]), -number(r["points_for"]), r["owner_id"]))
    for i, row in enumerate(current_standings, 1):
        row["rank"] = i
    emit("current-standings.csv", current_standings, minimum=8)

    # Publish reciprocal H2H updates except the known inconsistent historical
    # pairs. Keep their existing rows rather than choose one side's score.
    headers, old_h2h = existing("team-h2h.csv")
    bad_pairs = {frozenset((a, b)) for y, w, a, b in historical_conflicts}
    h2h = []
    for a in owners:
        for b in owners:
            pair = [g for g in games if g["owner_id"] == a and g["opponent_id"] == b]
            if not pair:
                continue
            if frozenset((a,b)) in bad_pairs:
                h2h.extend(r for r in old_h2h if r["owner_id"].lower() == a and r["opponent_id"].lower() == b)
                continue
            c = collections.Counter(g["result"] for g in pair)
            pf, pa = sum(g["points_for"] for g in pair), sum(g["points_against"] for g in pair)
            h2h.append(dict(owner_id=a, opponent_id=b, opponent_name=owners[b], total_games=len(pair),
                            record=record(c["W"], c["L"], c["T"]), win_pct=fmt((c["W"]+c["T"]*.5)/len(pair)),
                            points_for=fmt(pf), points_against=fmt(pa), margin=fmt(pf-pa)))
    emit("team-h2h.csv", h2h, headers)

    players = []
    for r in sources["Player Season Stats"]:
        if year(cell(r, 6)) and cell(r, 1) and cell(r, 4) in {"QB", "RB", "WR", "TE", "K", "D/ST", "DEF"}:
            players.append(dict(owner_id=owner(cell(r, 1)), position="D/ST" if cell(r,4) == "DEF" else cell(r, 4), player=cell(r, 2), nfl_team=cell(r, 3), points=fmt(cell(r, 44)), year=cell(r, 6)))
    best = {}
    for row in players:
        key = row["owner_id"], row["position"]
        if key not in best or number(row["points"]) > number(best[key]["points"]):
            best[key] = row
    emit("team-players.csv", list(best.values()))
    # Existing all-time cards represent best single seasons, not career totals.
    alltime = []
    for position in ["QB", "RB", "WR", "TE", "D/ST", "K"]:
        pos = [p for p in players if p["position"] == position]
        top = max(number(p["points"]) for p in pos)
        for p in pos:
            if number(p["points"]) == top:
                alltime.append(dict(rank=1, position=position, player=p["player"], nfl_team=p["nfl_team"], points=p["points"], year=p["year"], owner_id=p["owner_id"],
                                    fantasy_team=team_lookup[p["owner_id"]]["team_name"], record_type=f"Best {position} Season", notes=""))
    emit("all-time-players.csv", alltime)

    # Historical draft table is already normalized. Past Drafts supplies the
    # newest draft as an eight-column board that has not reached that table yet.
    draft = {}
    for r in sources["Draft History"]:
        if year(cell(r, 0)):
            o = owner(cell(r, 4))
            item = dict(zip(["year","round","pick","overall_pick","owner_id","drafting_team","player","position","nfl_team","image_path"], [cell(r, i) for i in range(10)]))
            item["owner_id"] = o
            draft[(item["year"], item["overall_pick"])] = item
    latest_draft_year = max(int(key[0]) for key in draft)
    board = sources["Past Drafts"]
    for i, r in enumerate(board):
        m = re.search(r"(20\d{2})", cell(r, 0))
        if not m or int(m.group(1)) <= latest_draft_year:
            continue
        y = m.group(1)
        # Use the current year's canonical draft-slot mapping in Seasons.
        slot_owners = {int(number(cell(v, 6))): o for (sy,o), v in season_by_owner.items() if sy == y and cell(v, 6)}
        if not slot_owners:
            # The newest draft board has the franchise names above each slot.
            # Preserve the one spelling correction observed in the source.
            for slot in range(1,9):
                name = cell(r,slot).replace("COMMITTEE NOT ADDICTED", "Committed Not Addicted")
                o = historical_owner(y, name)
                if o:
                    slot_owners[slot] = o
        if set(slot_owners) != set(range(1,9)):
            raise ValueError(f"Draft slots are incomplete for {y}")
        round_number = 0
        for picks in board[i+1:]:
            if "Pick #1" in picks or re.search(r"20\d{2}", cell(picks, 0)):
                break
            if any(cell(picks,j) for j in range(1,9)) and not all(cell(picks,j) for j in range(1,9)):
                raise ValueError(f"Incomplete draft round in {y}")
            if not all(cell(picks, j) for j in range(1,9)):
                continue
            round_number += 1
            for slot in range(1,9):
                raw = cell(picks, slot)
                match = re.fullmatch(r"(.+?)\s+([A-Za-z]{2,3}),\s*(QB|RB|WR|TE|K|D/ST)", raw)
                if not match:
                    raise ValueError(f"Cannot parse {y} draft pick: {raw!r}")
                pick = slot if round_number % 2 else 9-slot
                overall = (round_number-1)*8+pick
                o = slot_owners[slot]
                draft[(y,str(overall))] = dict(year=y, round=round_number, pick=pick, overall_pick=overall, owner_id=o,
                                               drafting_team=team_lookup[o]["team_name"], player=match.group(1), position=match.group(3), nfl_team=match.group(2).upper(), image_path="")
        if not 14 <= round_number <= 20:
            raise ValueError(f"Expected at least 14 complete draft rounds for {y}, found {round_number}")
    emit("draft-picks.csv", sorted(draft.values(), key=lambda r:(-int(r["year"]), int(r["overall_pick"]))))

    # Record-book categories and continuation rows retain tied record holders.
    categories = {"Regular Season":"regular-season", "Mini Games":"mini-games", "PLAY-IN":"play-in", "Playoffs":"playoffs", "Championships":"championships", "KKL (Power Rating):":"power-rating", "Points & Moves":"points-moves", "Member Score Records":"points-moves", "Player Records":"player-records", "Calculated historical records":"calculated"}
    category, last, records, parent_label = None, None, [], ""
    catalog_mode = False
    for r in sources["Records"]:
        label = cell(r, 1).replace("\u200b", "").strip()
        if label == "League Record Index":
            catalog_mode = True
        if catalog_mode:
            if re.fullmatch(r"REC\d+", label):
                records.append(dict(category="calculated", record=cell(r, 3), value=cell(r, 4), holder=cell(r, 5), year=cell(r, 6), notes=cell(r, 7)))
            continue
        if label in categories:
            category, last = categories[label], None
            parent_label = ""
            continue
        if not category or label in {"Category", "Total:", "*League changed from Standard to PPR in 2017"}:
            continue
        if label and cell(r, 3) and cell(r, 4):
            display_label = label.rstrip(":")
            if category == "points-moves" and parent_label and label.startswith(("Single Week", "Season")):
                display_label = parent_label.rstrip(":*") + " · " + display_label
            last = dict(category=category, record=display_label, value=cell(r, 3), holder=cell(r, 4), year=cell(r, 6) or "Career", notes=cell(r, 5) if category == "player-records" else "")
            records.append(last)
            if parent_label == "Team Points, Most:*" and label.rstrip(":") in {"Single Week", "Season (Avg.)", "Season (Total)", "Most Points in Championship Game", "Most Points While Missing Playoffs", "Most Points in a Losing Effort", "Most Consecutive Weeks Scoring 100+", "Most 2,000-Point Seasons"}:
                title = {"Single Week:":"Most Team Points, Single Week", "Season (Avg.):":"Most Team Points, Season Average", "Season (Total):":"Most Team Points, Season Total"}.get(label,label.rstrip(":"))
                records.append(dict(last, category="league-scoring", record=title))
        elif not label and last and cell(r, 4):
            last["holder"] += " / " + cell(r, 4)
            if cell(r, 6):
                last["year"] += " / " + cell(r, 6)
        elif label:
            last = None
            if category == "points-moves" and not cell(r,3):
                parent_label = label
    emit("records.csv", records, ["category","record","value","holder","year","notes"], minimum=50)

    headers, featured = existing("home-featured-records.csv")
    for row in featured:
        title = norm(row["record_title"])
        if title == "mostchampionships":
            maximum = max(int(t["titles"]) for t in teams)
            row.update(record_value=str(maximum), record_holder=" / ".join(t["owner"] for t in teams if int(t["titles"]) == maximum), record_year="Career")
        elif title == "highestweeklyscore":
            high = max(games, key=lambda g:g["points_for"])
            row.update(record_value=fmt(high["points_for"]), record_holder=owners[high["owner_id"]], record_year=str(high["year"]))
        elif title == "biggestchampionshipwin":
            scored = [c for c in championship_rows if c["champion_owner_id"] != "na"]
            largest = max(scored, key=lambda c: number(c["final_score"].split("-")[0])-number(c["final_score"].split("-")[1]))
            pf, pa = map(number, largest["final_score"].split("-"))
            row.update(record_value=fmt(pf-pa), record_holder=largest["champion"], record_year=largest["year"], record_note=f"{largest['final_score']} over {largest['runner_up']}")
        elif title == "mostthescofinishes":
            maximum = max(int(t["sco_finishes"]) for t in teams)
            row.update(record_value=str(maximum), record_holder=" / ".join(t["owner"] for t in teams if int(t["sco_finishes"]) == maximum), record_year="Career")
    emit("home-featured-records.csv", featured, headers)

    # Per-team record lists are derived from completed games; editorial legends
    # and manually selected draft callouts remain their existing source.
    teamrecords = []
    for o in owners:
        own = [g for g in games if g["owner_id"] == o]
        c = collections.Counter(g["result"] for g in own)
        high = max(own, key=lambda g:g["points_for"])
        teamrecords.extend([
            dict(owner_id=o, record_name="Career Win Percentage", value=f"{(c['W']+c['T']*.5)/len(own):.2%}", year=f"{min(g['year'] for g in own)}–{max(g['year'] for g in own)}", notes="All official completed games; ties count as half a win"),
            dict(owner_id=o, record_name="Highest Single-Game Score", value=fmt(high["points_for"]), year=f"{high['year']} W{high['week']}", notes="Original recorded score"),
        ])
    emit("team-records.csv", teamrecords)

    # Mini-game values are counts of correct picks in the source, not ESPN's
    # ten-points-per-correct scoring. Unplayed weeks stay blank.
    pickem = []
    mini_year = next((cell(r,0) for r in sources["Mini Games Query"] if year(cell(r,0))), None)
    for r in sources["Mini Games Query"]:
        if norm(cell(r,0)) not in aliases:
            continue
        weeks = [cell(r,i) for i in range(1,19)]
        done = max((i for i,v in enumerate(weeks,1) if v != ""), default=0)
        if not done:
            continue
        row = dict(year=mini_year, owner_id=owner(cell(r,0)), through_week=done, total_correct=fmt(sum(number(v) for v in weeks if v != "")))
        row.update({f"week_{i}":v for i,v in enumerate(weeks,1)})
        pickem.append(row)
    emit("pickem-weekly.csv", pickem, ["year","owner_id",*[f"week_{i}" for i in range(1,19)],"total_correct","through_week"], minimum=8)

    return outputs, warnings, dict(year=latest, through_week=through, completed_game_rows=len(games))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=pathlib.Path, help="Use local JSON source snapshots for validation; never commit them")
    parser.add_argument("--check", action="store_true", help="Validate without writing")
    args = parser.parse_args()
    if args.source_dir:
        sources = {name:json.loads((args.source_dir / (name+".json")).read_text()) for name in SOURCES}
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            sources = dict(pool.map(fetch_source, SOURCES))
    outputs, warnings, summary = transform(sources)
    changed = [name for name,text in outputs.items() if not (ROOT/"data"/name).exists() or (ROOT/"data"/name).read_text() != text]
    print(json.dumps(dict(**summary, changed=changed, warnings=warnings), indent=2))
    if args.check:
        return
    # Every source and output validates before any data file is replaced.
    for name in changed:
        path = ROOT/"data"/name
        temporary = path.with_suffix(".tmp")
        temporary.write_text(outputs[name])
        temporary.replace(path)
    status_file = ROOT/"data"/"sync-status.json"
    previous = json.loads(status_file.read_text()) if status_file.exists() else {}
    now = dt.datetime.now(dt.timezone.utc)
    # Monthly heartbeat keeps GitHub's scheduled workflow active in offseason.
    if changed or previous.get("heartbeat_month") != now.strftime("%Y-%m") or previous.get("warnings") != warnings:
        status_file.write_text(json.dumps(dict(source=f"https://docs.google.com/spreadsheets/d/{SHEET}/edit", updated_at=now.isoformat(),
                                              heartbeat_month=now.strftime("%Y-%m"), **summary, warnings=warnings), indent=2)+"\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Sync stopped; previous published data retained: {exc}", file=sys.stderr)
        sys.exit(1)
