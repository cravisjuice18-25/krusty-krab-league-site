async function buildTeamPage() {
  try {
    const ownerId = getOwnerIdFromUrl();

    if (!ownerId) {
      showTeamError("No owner selected", "Go back to the Teams page and select a franchise.");
      return;
    }

    const teams = await loadCSV("data/teams.csv");
    const standings = await loadCSV("data/standings.csv");

    const teamPlayers = await loadOptionalCSV("data/team-players.csv");
    const teamH2H = await loadOptionalCSV("data/team-h2h.csv");
    const teamRecords = await loadOptionalCSV("data/team-records.csv");
    const scoHistory = await loadOptionalCSV("data/the-sco.csv");

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

    buildTeamIdentity(team);
    buildTeamSnapshot(team, ownerStandings, ownerScoRows);
    buildSeasonHistory(ownerStandings);
    buildBestWorstSeasons(ownerStandings);
    buildTopPlayerSeasons(ownerPlayers);
    buildHeadToHead(ownerH2H);
    buildTeamRecords(ownerRecords);

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
   TEAM IDENTITY
   ========================================================= */

function buildTeamIdentity(team) {
  const primaryColor = cleanColor(team.primary_color, "#001f3f");
  const secondaryColor = cleanColor(team.secondary_color, "#ffffff");
  const decalColor = cleanColor(team.decal_color, "#facc15");

  const teamName = cleanText(team.team_name) || "Franchise Profile";
  const owner = cleanText(team.owner) || "TBD";
  const location = cleanText(team.location) || "TBD";
  const status = cleanText(team.status) || "Active";
  const tagline = cleanText(team.tagline) || "TBD";
  const franchiseStory = cleanText(team.franchise_story) || "TBD";

  const primaryLogo = getImagePath(team.primary_logo, "images/team-primary-logo-placeholder.png");
  const secondaryLogo = getImagePath(team.secondary_logo, "images/team-secondary-logo-placeholder.png");
  const uniformImage = getImagePath(team.uniform_image, "images/team-uniform-placeholder.png");

  document.title = `${teamName} | Krusty Krab League`;

  const hero = document.getElementById("team-hero");

  if (hero) {
    hero.style.setProperty("--team-color", primaryColor);
    hero.style.setProperty("--primary-color", primaryColor);
    hero.style.setProperty("--secondary-color", secondaryColor);
    hero.style.setProperty("--decal-color", decalColor);
  }

  setText("team-name", teamName);
  setText("team-tagline", tagline);
  setText("team-owner", `Owner: ${owner}`);
  setText("team-location", `Location: ${location}`);
  setText("team-status", `${status} Franchise`);

  setText("team-story-title", `About ${teamName}`);
  setText("team-story", franchiseStory);

  setImage("team-primary-logo", primaryLogo, `${teamName} logo`);
  setImage("team-brand-primary-logo", primaryLogo, `${teamName} primary logo`);
  setImage("team-brand-secondary-logo", secondaryLogo, `${teamName} secondary logo`);
  setImage("team-uniform-image", uniformImage, `${teamName} uniform`);

  setText("team-uniform-title", `${teamName} Uniform`);
  setText("team-footer", `Krusty Krab League · ${teamName}`);
}

/* =========================================================
   SNAPSHOT STATS
   ========================================================= */

function buildTeamSnapshot(team, ownerStandings, ownerScoRows) {
  const lifetimeRecord = calculateLifetimeRecord(ownerStandings);

  const titles = cleanText(team.titles) || "TBD";
  const playoffAppearances = cleanText(team.playoff_appearances) || calculatePlayoffAppearances(ownerStandings);
  const scoFinishes = cleanText(team.sco_finishes) || calculateScoFinishes(ownerScoRows, ownerStandings);
  const averageFinish = cleanText(team.average_finish) || calculateAverageFinish(ownerStandings);

  setText("team-lifetime-record", lifetimeRecord);
  setText("team-win-pct", calculateWinPct(lifetimeRecord));
  setText("team-titles", titles);
  setText("team-playoffs", playoffAppearances);
  setText("team-sco-finishes", scoFinishes);
  setText("team-average-finish", averageFinish);
  setText("team-all-play-record", cleanText(team.all_play_record) || "TBD");
  setText("team-top-week-count", cleanText(team.top_week_count) || "TBD");
}

/* =========================================================
   SEASON HISTORY
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
   BEST / WORST SEASONS
   ========================================================= */

function buildBestWorstSeasons(ownerStandings) {
  if (!ownerStandings || ownerStandings.length === 0) {
    setText("team-best-season", "TBD");
    setText("team-best-scoring-season", "TBD");
    setText("team-most-painful-finish", "TBD");
    setText("team-worst-season", "TBD");
    return;
  }

  const rankedRows = ownerStandings.filter(row => !Number.isNaN(Number(row.rank)));
  const scoringRows = ownerStandings.filter(row => !Number.isNaN(Number(row.points_for)));
  const ratingRows = ownerStandings.filter(row => !Number.isNaN(Number(row.team_rating)));

  const bestFinish = rankedRows.length
    ? [...rankedRows].sort((a, b) => Number(a.rank) - Number(b.rank))[0]
    : null;

  const worstFinish = rankedRows.length
    ? [...rankedRows].sort((a, b) => Number(b.rank) - Number(a.rank))[0]
    : null;

  const bestScoring = scoringRows.length
    ? [...scoringRows].sort((a, b) => Number(b.points_for) - Number(a.points_for))[0]
    : null;

  const bestRating = ratingRows.length
    ? [...ratingRows].sort((a, b) => Number(b.team_rating) - Number(a.team_rating))[0]
    : null;

  setText(
    "team-best-season",
    bestFinish
      ? `${cleanText(bestFinish.year)} · ${cleanText(bestFinish.team) || "TBD"} · ${ordinal(bestFinish.rank)} place · ${cleanText(bestFinish.record) || "TBD"}`
      : "TBD"
  );

  setText(
    "team-best-scoring-season",
    bestScoring
      ? `${cleanText(bestScoring.year)} · ${formatNumber(bestScoring.points_for)} points · ${formatNumber(bestScoring.avg_for)} average`
      : "TBD"
  );

  setText(
    "team-most-painful-finish",
    bestRating
      ? `${cleanText(bestRating.year)} · ${cleanText(bestRating.team) || "TBD"} · Rating ${formatNumber(bestRating.team_rating)} · Finished ${ordinal(bestRating.rank)}`
      : "TBD"
  );

  setText(
    "team-worst-season",
    worstFinish
      ? `${cleanText(worstFinish.year)} · ${cleanText(worstFinish.team) || "TBD"} · ${ordinal(worstFinish.rank)} place · ${cleanText(worstFinish.record) || "TBD"}`
      : "TBD"
  );
}

/* =========================================================
   TOP PLAYER SEASONS
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
    const aIndex = positionOrder.indexOf(cleanText(a.position));
    const bIndex = positionOrder.indexOf(cleanText(b.position));

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
   CSV:
   owner_id,opponent_id,opponent_name,total_games,record,win_pct,points_for,points_against,margin
   ========================================================= */

function buildHeadToHead(rows) {
  const tableBody = document.getElementById("team-h2h-body");

  if (!tableBody) return;

  if (!rows || rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7">TBD</td>
      </tr>
    `;
    return;
  }

  const sortedRows = [...rows].sort((a, b) => {
    return cleanText(a.opponent_name).localeCompare(cleanText(b.opponent_name));
  });

  tableBody.innerHTML = "";

  sortedRows.forEach(row => {
    const opponent =
      cleanText(row.opponent_name) ||
      cleanText(row.opponent) ||
      cleanText(row.opponent_owner) ||
      cleanText(row.opponent_team) ||
      "TBD";

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

/* =========================================================
   RECORDS HELD
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

  if (!text || text.toLowerCase() === "tbd" || text.toLowerCase() === "na" || text.toLowerCase() === "n/a") {
    return fallback;
  }

  return text;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanColor(value, fallback) {
  let color = cleanText(value);

  if (!color || color.toLowerCase() === "tbd" || color.toLowerCase() === "na" || color.toLowerCase() === "n/a") {
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
