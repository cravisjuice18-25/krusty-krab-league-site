async function buildTeamPage() {
  try {
    const ownerId = getOwnerIdFromUrl();

    if (!ownerId) {
      showTeamError("No owner selected", "Go back to the Teams page and select a franchise.");
      return;
    }

    const teams = await loadCSV("data/teams.csv");
    const standings = await loadCSV("data/standings.csv");

    const champions = await loadOptionalCSV("data/champions.csv");
    const teamPlayers = await loadOptionalCSV("data/team-players.csv");
    const teamH2H = await loadOptionalCSV("data/team-h2h.csv");
    const teamRecords = await loadOptionalCSV("data/team-records.csv");
    const scoHistory = await loadOptionalCSV("data/the-sco.csv");

    const teamLegends = await loadOptionalCSV("data/team-legends.csv");
    const teamDraftHistory = await loadOptionalCSV("data/team-draft-history.csv");
    const teamDraftCallouts = await loadOptionalCSV("data/team-draft-callouts.csv");

    const team = teams.find(row => {
      return cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase();
    });

    if (!team) {
      showTeamError("Franchise not found", `No franchise was found for owner: ${ownerId}`);
      return;
    }

    const ownerStandings = standings
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase())
      .sort((a, b) => Number(b.year) - Number(a.year));

    const ownerPlayers = teamPlayers
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase());

    const ownerH2H = teamH2H
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase());

    const ownerRecords = teamRecords
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase());

    const ownerScoRows = scoHistory
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase());

    const ownerChampionships = champions
      .filter(row => cleanText(row.champion_owner_id).toLowerCase() === ownerId.toLowerCase())
      .sort((a, b) => Number(b.year) - Number(a.year));

    const ownerLegends = teamLegends
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase());

    const ownerDraftHistory = teamDraftHistory
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase());

    const ownerDraftCallouts = teamDraftCallouts
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase());

    buildTeamIdentity(team);
    buildTeamSnapshot(team, ownerStandings);
    buildSeasonHistory(ownerStandings);
    buildBestWorstSeasons(team, ownerStandings, ownerScoRows);
    buildPostseasonResume(team, ownerChampionships);
    buildTopPlayerSeasons(ownerPlayers);
    buildHeadToHead(ownerH2H);
    buildFranchiseLegends(ownerLegends);
    buildDraftHistory(ownerDraftHistory, ownerDraftCallouts, ownerId);
    buildTeamRecords(ownerRecords);
    buildRelatedFranchiseLinks(ownerId);

  } catch (error) {
    console.error("Team page error:", error);
    showTeamError(
      "Team page error",
      "Check data/teams.csv, data/standings.csv, data-loader.js, and team.js."
    );
  }
}

/* =========================================================
   DATA LOADING
   ========================================================= */

async function loadOptionalCSV(path) {
  try {
    return await loadCSV(path);
  } catch (error) {
    console.warn(`${path} did not load:`, error);
    return [];
  }
}

function getOwnerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return cleanText(params.get("owner"));
}

/* =========================================================
   TEAM IDENTITY / HEADER
   teams.csv
   ========================================================= */

function buildTeamIdentity(team) {
  const primaryColor = cleanColor(team.primary_color, "#001f3f");
  const secondaryColor = cleanColor(team.secondary_color, "#111827");
  const decalColor = cleanColor(team.decal_color, "#facc15");

  const teamName = cleanText(team.team_name) || "Franchise Profile";
  const owner = cleanText(team.owner) || "TBD";
  const location = cleanText(team.location) || "TBD";
  const status = cleanText(team.status) || "Active";
  const abbreviation = cleanText(team.team_abbreviation) || "TBD";
  const establishedYear = cleanText(team.established_year) || "TBD";
  const titles = cleanText(team.titles) || "TBD";
  const tagline = cleanText(team.tagline) || "TBD";
  const franchiseStory = cleanText(team.franchise_story) || "TBD";

  const primaryLogo = getImagePath(team.primary_logo, "images/team-primary-logo-placeholder.png");
  const secondaryLogo = getImagePath(team.secondary_logo, "images/team-secondary-logo-placeholder.png");
  const uniformImage = getImagePath(team.uniform_image, "images/team-uniform-placeholder.png");
  const aboutImage = getImagePath(team.about_image, "images/franchise-about/franchise-about-placeholder.png");

  document.title = `${teamName} | Krusty Krab League`;

  const hero = document.getElementById("team-hero");

  if (hero) {
    hero.style.setProperty("--team-color", primaryColor);
    hero.style.setProperty("--primary-color", primaryColor);
    hero.style.setProperty("--secondary-color", secondaryColor);
    hero.style.setProperty("--decal-color", decalColor);
  }

  document.documentElement.style.setProperty("--team-color", primaryColor);
  document.documentElement.style.setProperty("--primary-color", primaryColor);
  document.documentElement.style.setProperty("--secondary-color", secondaryColor);
  document.documentElement.style.setProperty("--decal-color", decalColor);

  setText("team-name", teamName);
  setText("team-tagline", tagline);
  setText("team-owner", `Owner: ${owner}`);
  setText("team-location", `Location: ${location}`);
  setText("team-abbreviation", `Abbreviation: ${abbreviation}`);
  setText("team-established", `Established: ${establishedYear}`);
  setText("team-header-titles", `Championships: ${titles}`);
  setText("team-status", `${status} Franchise`);

  setText("team-story-title", `About ${teamName}`);
  setText("team-story", franchiseStory);

  setText("team-primary-color-label", primaryColor);
  setText("team-secondary-color-label", secondaryColor);
  setText("team-decal-color-label", decalColor);

  setImage("team-primary-logo", primaryLogo, `${teamName} logo`);
  setImage("team-brand-primary-logo", primaryLogo, `${teamName} primary logo`);
  setImage("team-brand-secondary-logo", secondaryLogo, `${teamName} secondary logo`);
  setImage("team-uniform-image", uniformImage, `${teamName} uniform`);
  setImage("team-about-image", aboutImage, `${teamName} franchise image`);

  setText("team-uniform-title", `${teamName} Uniform`);
  setText("team-footer", `Krusty Krab League · ${teamName}`);
}

/* =========================================================
   FRANCHISE AT-A-GLANCE
   Keep only non-repetitive top stats
   ========================================================= */

function buildTeamSnapshot(team, ownerStandings) {
  const lifetimeRecordFromCsv = cleanText(team.record);
  const lifetimeRecord = lifetimeRecordFromCsv || calculateLifetimeRecord(ownerStandings);

  const titles = cleanText(team.titles) || "TBD";
  const playoffAppearances = cleanText(team.playoff_appearances) || calculatePlayoffAppearances(ownerStandings);
  const averageFinish = cleanText(team.average_finish) || calculateAverageFinish(ownerStandings);

  setText("team-lifetime-record", lifetimeRecord);
  setText("team-win-pct", calculateWinPct(lifetimeRecord));
  setText("team-titles", titles);
  setText("team-playoffs", playoffAppearances);
  setText("team-average-finish", averageFinish);
  setText("team-all-play-record", cleanText(team.all_play_record) || "TBD");
  setText("team-top-week-count", cleanText(team.top_week_count) || "TBD");
}

/* =========================================================
   SEASON HISTORY
   standings.csv
   ========================================================= */

function buildSeasonHistory(ownerStandings) {
  const seasonBody = document.getElementById("team-season-history-body");

  if (!seasonBody) return;

  if (!ownerStandings || ownerStandings.length === 0) {
    seasonBody.innerHTML = `
      <tr>
        <td colspan="8">TBD</td>
      </tr>
    `;
    return;
  }

  seasonBody.innerHTML = "";

  ownerStandings.forEach(row => {
    const tableRow = document.createElement("tr");

    const rank = cleanText(row.rank);
    const record = cleanText(row.record);
    const pointsFor = cleanText(row.points_for);
    const teamRating = cleanText(row.team_rating);

    tableRow.innerHTML = `
      <td>${cleanText(row.year) || "TBD"}</td>
      <td><strong>${cleanText(row.team) || "TBD"}</strong></td>
      <td>${rank ? ordinal(rank) : "TBD"}</td>
      <td>${record || "TBD"}</td>
      <td>${pointsFor ? formatNumber(pointsFor) : "TBD"}</td>
      <td>${teamRating ? formatNumber(teamRating) : "TBD"}</td>
      <td>${getPlayoffText(rank)}</td>
      <td>${getSeasonResult(rank)}</td>
    `;

    seasonBody.appendChild(tableRow);
  });
}

/* =========================================================
   FRANCHISE HIGHS AND LOWS
   standings.csv + teams.csv fallbacks
   ========================================================= */

function buildBestWorstSeasons(team, ownerStandings, ownerScoRows) {
  const bestRegularSeasonFromCsv =
    cleanText(team.best_regular_season) ||
    calculateBestRegularSeason(ownerStandings);

  const scoFinishesFromCsv =
    cleanText(team.sco_finishes) ||
    calculateScoFinishes(ownerScoRows, ownerStandings);

  setText("team-best-regular-season-extreme", bestRegularSeasonFromCsv);
  setText("team-sco-finishes-extreme", scoFinishesFromCsv);

  if (!ownerStandings || ownerStandings.length === 0) {
    setText("team-best-season", cleanText(team.best_regular_season) || "TBD");
    setText("team-best-scoring-season", "TBD");
    setText("team-best-finish-extreme", cleanText(team.best_finish) || "TBD");
    setText("team-worst-season", "TBD");
    setText("team-worst-scoring-season", "TBD");
    setText("team-worst-finish", "TBD");
    return;
  }

  const recordRows = ownerStandings.filter(row => parseRecord(cleanText(row.record)));
  const rankedRows = ownerStandings.filter(row => !Number.isNaN(Number(row.rank)));
  const scoringRows = ownerStandings.filter(row => !Number.isNaN(Number(row.points_for)));

  const bestRecord = recordRows.length
    ? [...recordRows].sort((a, b) => compareRecords(b, a))[0]
    : null;

  const worstRecord = recordRows.length
    ? [...recordRows].sort((a, b) => compareRecords(a, b))[0]
    : null;

  const bestFinish = rankedRows.length
    ? [...rankedRows].sort((a, b) => Number(a.rank) - Number(b.rank))[0]
    : null;

  const worstFinish = rankedRows.length
    ? [...rankedRows].sort((a, b) => Number(b.rank) - Number(a.rank))[0]
    : null;

  const bestScoring = scoringRows.length
    ? [...scoringRows].sort((a, b) => Number(b.points_for) - Number(a.points_for))[0]
    : null;

  const worstScoring = scoringRows.length
    ? [...scoringRows].sort((a, b) => Number(a.points_for) - Number(b.points_for))[0]
    : null;

  setText(
    "team-best-season",
    bestRecord
      ? `${cleanText(bestRecord.year)} · ${cleanText(bestRecord.team) || "TBD"} · ${cleanText(bestRecord.record) || "TBD"} · Finished ${ordinal(bestRecord.rank)}`
      : cleanText(team.best_regular_season) || "TBD"
  );

  setText(
    "team-best-scoring-season",
    bestScoring
      ? `${cleanText(bestScoring.year)} · ${formatNumber(bestScoring.points_for)} points · ${formatNumber(bestScoring.avg_for)} average`
      : "TBD"
  );

  setText(
    "team-best-finish-extreme",
    bestFinish
      ? `${cleanText(bestFinish.year)} · ${cleanText(bestFinish.team) || "TBD"} · ${ordinal(bestFinish.rank)} place · ${cleanText(bestFinish.record) || "TBD"}`
      : cleanText(team.best_finish) || "TBD"
  );

  setText(
    "team-worst-season",
    worstRecord
      ? `${cleanText(worstRecord.year)} · ${cleanText(worstRecord.team) || "TBD"} · ${cleanText(worstRecord.record) || "TBD"} · Finished ${ordinal(worstRecord.rank)}`
      : "TBD"
  );

  setText(
    "team-worst-scoring-season",
    worstScoring
      ? `${cleanText(worstScoring.year)} · ${formatNumber(worstScoring.points_for)} points · ${formatNumber(worstScoring.avg_for)} average`
      : "TBD"
  );

  setText(
    "team-worst-finish",
    worstFinish
      ? `${cleanText(worstFinish.year)} · ${cleanText(worstFinish.team) || "TBD"} · ${ordinal(worstFinish.rank)} place · ${cleanText(worstFinish.record) || "TBD"}`
      : "TBD"
  );
}

/* =========================================================
   POSTSEASON RESUME
   teams.csv + champions.csv
   ========================================================= */

function buildPostseasonResume(team, ownerChampionships) {
  const titles = cleanText(team.titles) || "TBD";
  const championshipAppearances = cleanText(team.championship_appearances) || "TBD";
  const championshipRecord = cleanText(team.championship_record) || "TBD";
  const playoffAppearances = cleanText(team.playoff_appearances) || "TBD";
  const playoffRecord = cleanText(team.playoff_record) || "TBD";
  const numberOneSeeds = cleanText(team.number_one_seeds) || "TBD";
  const bestPlayoffRun = cleanText(team.best_playoff_run) || "TBD";
  const mostRecentPlayoffAppearance = cleanText(team.most_recent_playoff_appearance) || "TBD";

  setText("team-postseason-titles", titles);
  setText("team-postseason-appearances", championshipAppearances);
  setText("team-championship-record", championshipRecord);
  setText("team-postseason-playoffs", playoffAppearances);
  setText("team-playoff-record", playoffRecord);
  setText("team-number-one-seeds", numberOneSeeds);
  setText("team-best-playoff-run", bestPlayoffRun);
  setText("team-most-recent-playoff-appearance", mostRecentPlayoffAppearance);

  buildChampionshipYearBadges(ownerChampionships);
}

function buildChampionshipYearBadges(ownerChampionships) {
  const badgeWrap = document.getElementById("team-championship-year-badges");

  if (!badgeWrap) return;

  if (!ownerChampionships || ownerChampionships.length === 0) {
    badgeWrap.innerHTML = `<span>No championship banners yet.</span>`;
    return;
  }

  badgeWrap.innerHTML = "";

  ownerChampionships
    .sort((a, b) => Number(a.year) - Number(b.year))
    .forEach(row => {
      const badge = document.createElement("span");
      badge.className = "championship-year-badge";
      badge.textContent = cleanText(row.year) || "TBD";
      badgeWrap.appendChild(badge);
    });
}

/* =========================================================
   TOP PLAYER SEASONS
   team-players.csv
   ========================================================= */

function buildTopPlayerSeasons(ownerPlayers) {
  const list = document.getElementById("team-top-player-list");

  if (!list) return;

  if (!ownerPlayers || ownerPlayers.length === 0) {
    list.innerHTML = `
      <div class="record-item">
        <strong>Top Player Seasons</strong>
        <span>TBD</span>
      </div>
    `;
    return;
  }

  const positionOrder = ["QB", "RB", "WR", "TE", "K", "D/ST", "DEF"];

  const sortedPlayers = [...ownerPlayers].sort((a, b) => {
    const aPosition = cleanText(a.position).toUpperCase();
    const bPosition = cleanText(b.position).toUpperCase();

    const aIndex = positionOrder.indexOf(aPosition);
    const bIndex = positionOrder.indexOf(bPosition);

    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  list.innerHTML = "";

  sortedPlayers.forEach(row => {
    const item = document.createElement("div");
    item.className = "record-item";

    const position = cleanText(row.position) || "Position";
    const player = cleanText(row.player) || cleanText(row.player_name) || "TBD";
    const nflTeam = cleanText(row.nfl_team);
    const points = cleanText(row.points) || cleanText(row.fantasy_points) || "TBD";
    const year = cleanText(row.year) || "TBD";
    const notes = cleanText(row.notes);

    item.innerHTML = `
      <strong>Best ${position} Season</strong>
      <span>${player}${nflTeam ? ` · ${nflTeam}` : ""} · ${formatNumber(points)} points · ${year}${notes ? ` · ${notes}` : ""}</span>
    `;

    list.appendChild(item);
  });
}

/* =========================================================
   HEAD TO HEAD
   team-h2h.csv
   ========================================================= */

function buildHeadToHead(rows) {
  const tableBody = document.getElementById("team-h2h-body");

  if (!tableBody) return;

  const cleanRows = rows || [];

  buildHeadToHeadCallouts(cleanRows);

  if (cleanRows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7">TBD</td>
      </tr>
    `;

    setupHeadToHeadSorting([]);
    return;
  }

  const defaultSortedRows = [...cleanRows].sort((a, b) => {
    return getOpponentName(a).localeCompare(getOpponentName(b));
  });

  renderHeadToHeadRows(defaultSortedRows);
  setupHeadToHeadSorting(cleanRows);
}

function buildHeadToHeadCallouts(rows) {
  const minimumGames = 3;

  const qualifiedRows = (rows || []).filter(row => {
    const games = Number(cleanText(row.total_games) || cleanText(row.totalGames)) || 0;
    return games >= minimumGames;
  });

  if (qualifiedRows.length === 0) {
    setText("team-h2h-nemesis", "TBD");
    setText("team-h2h-nemesis-detail", "Needs at least 3 games against an opponent.");
    setText("team-h2h-victim", "TBD");
    setText("team-h2h-victim-detail", "Needs at least 3 games against an opponent.");
    return;
  }

  const nemesis = [...qualifiedRows].sort((a, b) => {
    return parsePercentOrDecimal(cleanText(a.win_pct)) - parsePercentOrDecimal(cleanText(b.win_pct));
  })[0];

  const favoriteVictim = [...qualifiedRows].sort((a, b) => {
    return parsePercentOrDecimal(cleanText(b.win_pct)) - parsePercentOrDecimal(cleanText(a.win_pct));
  })[0];

  if (nemesis) {
    setText("team-h2h-nemesis", getOpponentName(nemesis));
    setText(
      "team-h2h-nemesis-detail",
      `${cleanText(nemesis.record) || "TBD"} · ${cleanText(nemesis.win_pct) || "TBD"} win rate · ${cleanText(nemesis.total_games) || "TBD"} games`
    );
  }

  if (favoriteVictim) {
    setText("team-h2h-victim", getOpponentName(favoriteVictim));
    setText(
      "team-h2h-victim-detail",
      `${cleanText(favoriteVictim.record) || "TBD"} · ${cleanText(favoriteVictim.win_pct) || "TBD"} win rate · ${cleanText(favoriteVictim.total_games) || "TBD"} games`
    );
  }
}

function renderHeadToHeadRows(rows) {
  const tableBody = document.getElementById("team-h2h-body");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  rows.forEach(row => {
    const opponent = getOpponentName(row);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${opponent}</strong></td>
      <td>${cleanText(row.total_games) || cleanText(row.totalGames) || "TBD"}</td>
      <td>${cleanText(row.record) || "TBD"}</td>
      <td>${cleanText(row.win_pct) || "TBD"}</td>
      <td>${cleanText(row.points_for) || "TBD"}</td>
      <td>${cleanText(row.points_against) || "TBD"}</td>
      <td>${cleanText(row.margin) || "TBD"}</td>
    `;

    tableBody.appendChild(tr);
  });
}

function setupHeadToHeadSorting(rows) {
  const buttons = document.querySelectorAll("[data-h2h-sort]");

  if (!buttons.length) return;

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const sortKey = button.getAttribute("data-h2h-sort");
      const currentDirection = button.getAttribute("data-sort-direction") || "desc";
      const nextDirection = currentDirection === "desc" ? "asc" : "desc";

      buttons.forEach(otherButton => {
        otherButton.setAttribute("data-sort-direction", "");

        const caret = otherButton.querySelector(".sort-caret");

        if (caret) {
          caret.textContent = "↕";
        }
      });

      button.setAttribute("data-sort-direction", nextDirection);

      const caret = button.querySelector(".sort-caret");

      if (caret) {
        caret.textContent = nextDirection === "desc" ? "↓" : "↑";
      }

      const sortedRows = [...rows].sort((a, b) => {
        const aValue = getHeadToHeadSortValue(a, sortKey);
        const bValue = getHeadToHeadSortValue(b, sortKey);

        if (nextDirection === "desc") {
          return bValue - aValue;
        }

        return aValue - bValue;
      });

      renderHeadToHeadRows(sortedRows);
    });
  });
}

function getHeadToHeadSortValue(row, key) {
  if (key === "total_games") {
    return Number(cleanText(row.total_games) || cleanText(row.totalGames)) || 0;
  }

  if (key === "win_pct") {
    return parsePercentOrDecimal(cleanText(row.win_pct));
  }

  if (key === "margin") {
    return Number(cleanText(row.margin).replace("+", "")) || 0;
  }

  return 0;
}

function getOpponentName(row) {
  return (
    cleanText(row.opponent_name) ||
    cleanText(row.opponent) ||
    cleanText(row.opponent_owner) ||
    cleanText(row.opponent_team) ||
    "TBD"
  );
}

function parsePercentOrDecimal(value) {
  const cleaned = cleanText(value).replace("%", "");

  if (!cleaned) return 0;

  const number = Number(cleaned);

  if (Number.isNaN(number)) return 0;

  if (cleanText(value).includes("%")) {
    return number / 100;
  }

  return number;
}

/* =========================================================
   FRANCHISE LEGENDS
   team-legends.csv
   ========================================================= */

function buildFranchiseLegends(ownerLegends) {
  const grid = document.getElementById("franchise-legends-grid");

  if (!grid) return;

  if (!ownerLegends || ownerLegends.length === 0) {
    grid.innerHTML = `
      <article class="franchise-legend-card">
        <div class="franchise-legend-image">
          <img src="images/franchise-legends/player-placeholder.png" alt="Player">
        </div>
        <div class="franchise-legend-body">
          <span>Franchise Legend</span>
          <h3>TBD</h3>
          <p>Legend data will load here.</p>
        </div>
      </article>
    `;
    return;
  }

  const sortedLegends = [...ownerLegends]
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .slice(0, 3);

  grid.innerHTML = "";

  sortedLegends.forEach(row => {
    const player = cleanText(row.player) || "TBD";
    const position = cleanText(row.position) || "TBD";
    const distinction = cleanText(row.distinction) || "Franchise Legend";
    const description = cleanText(row.description) || "TBD";
    const imagePath = getImagePath(row.image_path, "images/franchise-legends/player-placeholder.png");

    const card = document.createElement("article");
    card.className = "franchise-legend-card";

    card.innerHTML = `
      <div class="franchise-legend-image">
        <img src="${imagePath}" alt="${player}" onerror="this.src='images/franchise-legends/player-placeholder.png'">
      </div>

      <div class="franchise-legend-body">
        <span>${distinction}</span>
        <h3>${player}</h3>
        <p>${position} · ${description}</p>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* =========================================================
   DRAFT HISTORY SUMMARY
   team-draft-history.csv + team-draft-callouts.csv
   ========================================================= */

function buildDraftHistory(ownerDraftHistory, ownerDraftCallouts, ownerId) {
  buildFirstRoundPicks(ownerDraftHistory);
  buildDraftCallouts(ownerDraftCallouts);
  buildDraftHistoryLink(ownerId);
}

function buildFirstRoundPicks(ownerDraftHistory) {
  const list = document.getElementById("team-first-round-list");

  if (!list) return;

  const firstRoundPicks = (ownerDraftHistory || [])
    .filter(row => cleanText(row.round) === "1" || cleanText(row.pick_number).startsWith("1."))
    .sort((a, b) => Number(b.year) - Number(a.year))
    .slice(0, 5);

  if (firstRoundPicks.length === 0) {
    list.innerHTML = `
      <div class="record-item">
        <strong>Last 5 First-Round Picks</strong>
        <span>TBD</span>
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  firstRoundPicks.forEach(row => {
    const player = cleanText(row.player) || "TBD";
    const year = cleanText(row.year) || "TBD";
    const pickNumber = cleanText(row.pick_number) || "TBD";
    const position = cleanText(row.position) || "TBD";
    const nflTeam = cleanText(row.nfl_team);
    const imagePath = getImagePath(row.image_path, "images/draft-headshots/player-placeholder.png");

    const item = document.createElement("div");
    item.className = "first-round-pick-item";

    item.innerHTML = `
      <div class="first-round-pick-image">
        <img src="${imagePath}" alt="${player}" onerror="this.src='images/draft-headshots/player-placeholder.png'">
      </div>

      <div class="first-round-pick-details">
        <span>${year} · Pick ${pickNumber}</span>
        <strong>${player}</strong>
        <small>${position}${nflTeam ? ` · ${nflTeam}` : ""}</small>
      </div>
    `;

    list.appendChild(item);
  });
}

function buildDraftCallouts(ownerDraftCallouts) {
  const grid = document.getElementById("team-draft-callout-grid");

  if (!grid) return;

  if (!ownerDraftCallouts || ownerDraftCallouts.length === 0) {
    grid.innerHTML = `
      <div class="draft-callout-card">
        <span>Best Draft Pick</span>
        <strong>TBD</strong>
        <p>Draft callouts will load here.</p>
      </div>
    `;
    return;
  }

  const order = ["best_pick", "worst_pick", "most_position"];

  const sortedCallouts = [...ownerDraftCallouts].sort((a, b) => {
    const aIndex = order.indexOf(cleanText(a.callout_type));
    const bIndex = order.indexOf(cleanText(b.callout_type));

    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  grid.innerHTML = "";

  sortedCallouts.slice(0, 3).forEach(row => {
    const card = document.createElement("div");
    card.className = "draft-callout-card";

    card.innerHTML = `
      <span>${cleanText(row.title) || "Draft Callout"}</span>
      <strong>${cleanText(row.value) || "TBD"}</strong>
      <p>${cleanText(row.description) || "TBD"}</p>
    `;

    grid.appendChild(card);
  });
}

function buildDraftHistoryLink(ownerId) {
  const link = document.getElementById("team-draft-history-link");

  if (!link) return;

  link.href = `draft.html?owner=${ownerId}`;
}

/* =========================================================
   RECORDS HELD
   team-records.csv
   ========================================================= */

function buildTeamRecords(ownerRecords) {
  const list = document.getElementById("team-records-held-list");

  if (!list) return;

  if (!ownerRecords || ownerRecords.length === 0) {
    list.innerHTML = `
      <div class="record-item">
        <strong>Records Held</strong>
        <span>TBD</span>
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  ownerRecords.forEach(row => {
    const item = document.createElement("div");
    item.className = "record-item";

    const record =
      cleanText(row.record_name) ||
      cleanText(row.record) ||
      cleanText(row.title) ||
      "Record";

    const value =
      cleanText(row.value) ||
      cleanText(row.amount) ||
      cleanText(row.stat) ||
      "TBD";

    const year = cleanText(row.year);
    const notes = cleanText(row.notes);
    const teamName = cleanText(row.team_name);

    const details = [
      value,
      year,
      teamName,
      notes
    ].filter(value => cleanText(value)).join(" · ");

    item.innerHTML = `
      <strong>${record}</strong>
      <span>${details || "TBD"}</span>
    `;

    list.appendChild(item);
  });
}

/* =========================================================
   RELATED FRANCHISE LINKS
   ========================================================= */

function buildRelatedFranchiseLinks(ownerId) {
  const links = document.getElementById("related-franchise-links");

  if (!links) return;

  links.innerHTML = `
    <a href="draft.html?owner=${ownerId}">Full Draft History</a>
    <a href="champions.html">Championship History</a>
    <a href="records.html">Records</a>
    <a href="seasons.html?owner=${ownerId}">Seasons</a>
    <a href="uniforms.html">Uniform Gallery</a>
    <a href="head-to-head.html?owner=${ownerId}">Head-to-Head</a>
  `;
}

/* =========================================================
   CALCULATIONS
   ========================================================= */

function calculateLifetimeRecord(ownerStandings) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let found = false;

  ownerStandings.forEach(row => {
    const record = cleanText(row.record);

    if (!record.includes("-")) return;

    const parts = record.split("-").map(Number);

    wins += Number(parts[0]) || 0;
    losses += Number(parts[1]) || 0;
    ties += Number(parts[2]) || 0;

    found = true;
  });

  if (!found) return "TBD";

  if (ties > 0) {
    return `${wins}-${losses}-${ties}`;
  }

  return `${wins}-${losses}`;
}

function calculateWinPct(record) {
  const cleaned = cleanText(record);

  if (!cleaned || cleaned === "TBD" || !cleaned.includes("-")) return "TBD";

  const parts = cleaned.split("-").map(Number);

  const wins = Number(parts[0]) || 0;
  const losses = Number(parts[1]) || 0;
  const ties = Number(parts[2]) || 0;

  const total = wins + losses + ties;

  if (!total) return "TBD";

  return ((wins + ties * 0.5) / total).toFixed(3).replace("0.", ".");
}

function calculatePlayoffAppearances(ownerStandings) {
  const count = ownerStandings.filter(row => {
    const rank = Number(row.rank);
    return !Number.isNaN(rank) && rank <= 4;
  }).length;

  return count || "TBD";
}

function calculateScoFinishes(ownerScoRows, ownerStandings) {
  if (ownerScoRows && ownerScoRows.length > 0) {
    return String(ownerScoRows.length);
  }

  const rankBasedScoCount = ownerStandings.filter(row => Number(row.rank) === 8).length;

  return String(rankBasedScoCount || 0);
}

function calculateAverageFinish(ownerStandings) {
  const finishes = ownerStandings
    .map(row => Number(row.rank))
    .filter(value => !Number.isNaN(value));

  if (finishes.length === 0) return "TBD";

  const average = finishes.reduce((sum, value) => sum + value, 0) / finishes.length;

  return average.toFixed(2);
}

function calculateBestFinish(ownerStandings) {
  const rows = ownerStandings.filter(row => !Number.isNaN(Number(row.rank)));

  if (rows.length === 0) return "TBD";

  const best = [...rows].sort((a, b) => Number(a.rank) - Number(b.rank))[0];

  return `${ordinal(best.rank)} Place · ${cleanText(best.year) || "TBD"}`;
}

function calculateBestRegularSeason(ownerStandings) {
  const rows = ownerStandings.filter(row => parseRecord(cleanText(row.record)));

  if (rows.length === 0) return "TBD";

  const best = [...rows].sort((a, b) => compareRecords(b, a))[0];

  return `${cleanText(best.record) || "TBD"} · ${cleanText(best.year) || "TBD"}`;
}

function compareRecords(a, b) {
  const recordA = parseRecord(cleanText(a.record));
  const recordB = parseRecord(cleanText(b.record));

  if (!recordA && !recordB) return 0;
  if (!recordA) return -1;
  if (!recordB) return 1;

  if (recordA.winPct !== recordB.winPct) {
    return recordA.winPct - recordB.winPct;
  }

  if (recordA.wins !== recordB.wins) {
    return recordA.wins - recordB.wins;
  }

  return recordB.losses - recordA.losses;
}

function parseRecord(record) {
  const cleaned = cleanText(record);

  if (!cleaned || !cleaned.includes("-")) return null;

  const parts = cleaned.split("-").map(value => Number(value));

  const wins = Number(parts[0]) || 0;
  const losses = Number(parts[1]) || 0;
  const ties = Number(parts[2]) || 0;
  const total = wins + losses + ties;

  if (!total) return null;

  return {
    wins,
    losses,
    ties,
    total,
    winPct: (wins + ties * 0.5) / total
  };
}

function getPlayoffText(rank) {
  const numericRank = Number(rank);

  if (Number.isNaN(numericRank)) return "TBD";

  return numericRank <= 4 ? "Yes" : "No";
}

function getSeasonResult(rank) {
  const numericRank = Number(rank);

  if (Number.isNaN(numericRank)) return "TBD";

  if (numericRank === 1) return "Won Championship";
  if (numericRank === 2) return "Lost Championship";
  if (numericRank === 3 || numericRank === 4) return "Lost in Semi-Finals";
  if (numericRank === 5 || numericRank === 6 || numericRank === 7) return "Missed Playoffs";
  if (numericRank === 8) return "Won The Sco";

  return "TBD";
}

/* =========================================================
   ERROR STATE
   ========================================================= */

function showTeamError(title, message) {
  setText("team-name", title);
  setText("team-tagline", message);
  setText("team-story-title", title);
  setText("team-story", message);

  const seasonBody = document.getElementById("team-season-history-body");

  if (seasonBody) {
    seasonBody.innerHTML = `
      <tr>
        <td colspan="8">${message}</td>
      </tr>
    `;
  }

  const h2hBody = document.getElementById("team-h2h-body");

  if (h2hBody) {
    h2hBody.innerHTML = `
      <tr>
        <td colspan="7">${message}</td>
      </tr>
    `;
  }

  setText("team-h2h-nemesis", "TBD");
  setText("team-h2h-nemesis-detail", message);
  setText("team-h2h-victim", "TBD");
  setText("team-h2h-victim-detail", message);
}

/* =========================================================
   HELPERS
   ========================================================= */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function setImage(id, src, altText) {
  const image = document.getElementById(id);

  if (!image) return;

  image.src = src;
  image.alt = altText;

  image.onerror = function () {
    this.src = getPlaceholderForImage(id);
  };
}

function getPlaceholderForImage(id) {
  if (id.includes("about")) {
    return "images/franchise-about/franchise-about-placeholder.png";
  }

  if (id.includes("uniform")) {
    return "images/team-uniform-placeholder.png";
  }

  if (id.includes("secondary")) {
    return "images/team-secondary-logo-placeholder.png";
  }

  return "images/team-primary-logo-placeholder.png";
}

function getImagePath(value, fallback) {
  const text = cleanText(value);

  if (
    !text ||
    text.toLowerCase() === "tbd" ||
    text.toLowerCase() === "na" ||
    text.toLowerCase() === "n/a"
  ) {
    return fallback;
  }

  return text;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanColor(value, fallback) {
  let color = cleanText(value);

  if (
    !color ||
    color.toLowerCase() === "tbd" ||
    color.toLowerCase() === "na" ||
    color.toLowerCase() === "n/a"
  ) {
    return fallback;
  }

  color = color.replace(/\s/g, "");

  if (!color.startsWith("#")) {
    color = `#${color}`;
  }

  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);

  return isValidHex ? color : fallback;
}

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return cleanText(value) || "TBD";
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function ordinal(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return cleanText(value) || "TBD";

  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = number % 100;

  return number + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
}

buildTeamPage();
