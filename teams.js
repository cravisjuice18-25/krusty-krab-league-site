async function buildTeamPage() {
  try {
    const ownerId = getOwnerIdFromUrl();

    const teams = await loadCSV("data/teams.csv");
    const standings = await loadCSV("data/standings.csv");

    const teamPlayers = await loadOptionalCSV("data/team-players.csv");
    const teamH2H = await loadOptionalCSV("data/team-h2h.csv");
    const teamRecords = await loadOptionalCSV("data/team-records.csv");

    const team = teams.find(row => {
      return cleanText(row.owner_id).toLowerCase() === ownerId;
    });

    if (!team) {
      renderTeamNotFound(ownerId);
      return;
    }

    const teamStandings = standings
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId)
      .sort((a, b) => Number(b.year) - Number(a.year));

    const filteredPlayers = teamPlayers
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId);

    const filteredH2H = teamH2H
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId);

    const filteredRecords = teamRecords
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId);

    renderTeamHero(team, teamStandings);
    renderTeamStats(team, teamStandings);
    renderFranchiseStory(team);
    renderSeasonHistory(teamStandings);
    renderBestWorstSeasons(teamStandings);
    renderTopPlayers(filteredPlayers);
    renderHeadToHead(filteredH2H);
    renderTeamRecords(filteredRecords);
    renderTeamBrand(team);

  } catch (error) {
    console.error("Team page error:", error);
    renderPageError();
  }
}

/* =========================================================
   DATA LOADING
   ========================================================= */

async function loadOptionalCSV(path) {
  try {
    return await loadCSV(path);
  } catch (error) {
    console.warn(`${path} did not load. Skipping optional section.`, error);
    return [];
  }
}

function getOwnerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return cleanText(params.get("owner")).toLowerCase();
}

/* =========================================================
   HERO + TOPLINE STATS
   ========================================================= */

function renderTeamHero(team, teamStandings) {
  const teamName = cleanText(team.team_name) || "Franchise";
  const ownerName = cleanText(team.owner) || formatOwnerName(cleanText(team.owner_id));
  const location = cleanText(team.location);
  const tagline = cleanText(team.tagline);

  document.title = `${teamName} | Krusty Krab League`;

  setTextAny(
    ["team-name", "franchise-name", "team-page-title", "dynamic-team-name"],
    teamName
  );

  setTextAny(
    ["team-owner", "franchise-owner", "team-page-owner"],
    ownerName ? `Owner: ${ownerName}` : "Owner coming soon"
  );

  setTextAny(
    ["team-location", "franchise-location"],
    location || "Location coming soon"
  );

  setTextAny(
    ["team-tagline", "franchise-tagline"],
    tagline || "Franchise profile under construction."
  );

  setTextAny(
    ["team-status", "franchise-status"],
    cleanText(team.status) || "Active"
  );

  applyTeamColors(team);
}

function renderTeamStats(team, teamStandings) {
  const computedRecord = calculateLifetimeRecord(teamStandings);
  const record = computedRecord || cleanText(team.record) || "Coming soon";

  const titles = cleanText(team.titles) || countTitlesFromTeam(team);
  const playoffAppearances = cleanText(team.playoff_appearances) || "Coming soon";
  const seasonsPlayed = teamStandings.length || "Coming soon";
  const avgFinish = calculateAverageFinish(teamStandings);

  setTextAny(["team-lifetime-record", "franchise-record", "team-record"], record);
  setTextAny(["team-titles", "franchise-titles"], titles);
  setTextAny(["team-playoff-appearances", "franchise-playoffs"], playoffAppearances);
  setTextAny(["team-seasons-played", "franchise-seasons"], seasonsPlayed);
  setTextAny(["team-average-finish", "franchise-average-finish"], avgFinish || "Coming soon");

  renderStatCard("team-record-card", "Lifetime Record", record);
  renderStatCard("team-titles-card", "Titles", titles);
  renderStatCard("team-playoffs-card", "Playoff Apps", playoffAppearances);
  renderStatCard("team-seasons-card", "Seasons", seasonsPlayed);
}

function renderStatCard(id, label, value) {
  const card = document.getElementById(id);

  if (!card) return;

  card.innerHTML = `
    <span>${label}</span>
    <strong>${value}</strong>
  `;
}

/* =========================================================
   FRANCHISE STORY
   ========================================================= */

function renderFranchiseStory(team) {
  const storyElement = getElement([
    "franchise-story",
    "team-franchise-story",
    "team-story",
    "franchise-story-text"
  ]);

  if (!storyElement) return;

  const story = cleanText(team.franchise_story);

  if (isMissing(story)) {
    storyElement.innerHTML = emptyState(
      "Franchise story coming soon.",
      "This team profile is built. The write-up still needs to be added."
    );
    return;
  }

  storyElement.textContent = story;
}

/* =========================================================
   SEASON HISTORY
   ========================================================= */

function renderSeasonHistory(teamStandings) {
  const tableBody = getElement([
    "team-season-history-body",
    "season-history-body",
    "franchise-season-history-body",
    "team-history-body"
  ]);

  const container = getElement([
    "team-season-history",
    "season-history-list",
    "franchise-season-history"
  ]);

  if (teamStandings.length === 0) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            ${emptyState(
              "Season history coming soon.",
              "This franchise does not have season rows loaded yet."
            )}
          </td>
        </tr>
      `;
    }

    if (container && !tableBody) {
      container.innerHTML = emptyState(
        "Season history coming soon.",
        "This franchise does not have season rows loaded yet."
      );
    }

    return;
  }

  if (tableBody) {
    tableBody.innerHTML = "";

    teamStandings.forEach(row => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${cleanText(row.year)}</td>
        <td><strong>${cleanText(row.team) || "Team Name TBD"}</strong></td>
        <td>${cleanText(row.rank) || "TBD"}</td>
        <td>${cleanText(row.team_rating) || "TBD"}</td>
        <td>${cleanText(row.record) || "TBD"}</td>
        <td>${cleanText(row.points_for) || "TBD"}</td>
        <td>${cleanText(row.avg_for) || "TBD"}</td>
        <td>${cleanText(row.moves) || "TBD"}</td>
      `;

      tableBody.appendChild(tr);
    });

    return;
  }

  if (container) {
    container.innerHTML = "";

    teamStandings.forEach(row => {
      const card = document.createElement("article");
      card.className = "mini-card";

      card.innerHTML = `
        <p class="section-label">${cleanText(row.year)}</p>
        <h3>${cleanText(row.team) || "Team Name TBD"}</h3>
        <p>${cleanText(row.record) || "Record TBD"} · Finish: ${cleanText(row.rank) || "TBD"}</p>
      `;

      container.appendChild(card);
    });
  }
}

/* =========================================================
   BEST / WORST SEASONS
   ========================================================= */

function renderBestWorstSeasons(teamStandings) {
  const bestContainer = getElement([
    "team-best-season",
    "best-season-card",
    "franchise-best-season"
  ]);

  const worstContainer = getElement([
    "team-worst-season",
    "worst-season-card",
    "franchise-worst-season"
  ]);

  if (teamStandings.length === 0) {
    if (bestContainer) {
      bestContainer.innerHTML = emptyState(
        "Best season coming soon.",
        "Season history data needs to be added first."
      );
    }

    if (worstContainer) {
      worstContainer.innerHTML = emptyState(
        "Worst season coming soon.",
        "Season history data needs to be added first."
      );
    }

    return;
  }

  const rankedRows = teamStandings.filter(row => !Number.isNaN(Number(row.rank)));

  if (rankedRows.length === 0) return;

  const bestSeason = [...rankedRows].sort((a, b) => Number(a.rank) - Number(b.rank))[0];
  const worstSeason = [...rankedRows].sort((a, b) => Number(b.rank) - Number(a.rank))[0];

  if (bestContainer && bestSeason) {
    bestContainer.innerHTML = seasonSummaryCard(
      "Best Season",
      bestSeason
    );
  }

  if (worstContainer && worstSeason) {
    worstContainer.innerHTML = seasonSummaryCard(
      "Worst Season",
      worstSeason
    );
  }
}

function seasonSummaryCard(label, row) {
  return `
    <p class="section-label">${label}</p>
    <h3>${cleanText(row.year)} · ${cleanText(row.team) || "Team Name TBD"}</h3>
    <p>${cleanText(row.record) || "Record TBD"} · Finished ${ordinal(cleanText(row.rank))}</p>
    <strong>${cleanText(row.avg_for) || "TBD"} Avg Points For</strong>
  `;
}

/* =========================================================
   TOP PLAYER SEASONS
   ========================================================= */

function renderTopPlayers(players) {
  const container = getElement([
    "team-top-players",
    "team-top-players-grid",
    "team-player-seasons",
    "top-player-seasons-grid"
  ]);

  if (!container) return;

  if (players.length === 0) {
    container.innerHTML = emptyState(
      "Top player seasons coming soon.",
      "This archive section is ready, but the player data has not been added yet."
    );
    return;
  }

  const sortedPlayers = [...players].sort((a, b) => {
    return Number(b.points || b.fantasy_points || 0) - Number(a.points || a.fantasy_points || 0);
  });

  container.innerHTML = "";

  sortedPlayers.forEach(player => {
    const name = cleanText(player.player) || cleanText(player.player_name) || "Player TBD";
    const position = cleanText(player.position) || "TBD";
    const nflTeam = cleanText(player.nfl_team) || cleanText(player.team) || "NFL Team TBD";
    const year = cleanText(player.year) || "Year TBD";
    const points = cleanText(player.points) || cleanText(player.fantasy_points) || "Points TBD";
    const imagePath = cleanText(player.image_path) || cleanText(player.image);

    const card = document.createElement("article");
    card.className = "player-season-card";

    card.innerHTML = `
      <div class="player-card-image">
        ${isMissing(imagePath)
          ? `<div class="logo-placeholder">${position}</div>`
          : `<img src="${imagePath}" alt="${name}">`
        }
      </div>

      <div>
        <p class="section-label">${position} · ${year}</p>
        <h3>${name}</h3>
        <p>${nflTeam} · ${points} points</p>
      </div>
    `;

    container.appendChild(card);
  });
}

/* =========================================================
   HEAD TO HEAD
   ========================================================= */

function renderHeadToHead(rows) {
  const tableBody = getElement([
    "team-h2h-body",
    "h2h-body",
    "franchise-h2h-body"
  ]);

  const container = getElement([
    "team-h2h",
    "team-h2h-list",
    "franchise-h2h"
  ]);

  if (rows.length === 0) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            ${emptyState(
              "Head-to-head archive coming soon.",
              "League matchup history will be added here once the data is finished."
            )}
          </td>
        </tr>
      `;
    }

    if (container && !tableBody) {
      container.innerHTML = emptyState(
        "Head-to-head archive coming soon.",
        "League matchup history will be added here once the data is finished."
      );
    }

    return;
  }

  if (tableBody) {
    tableBody.innerHTML = "";

    rows.forEach(row => {
      const opponent =
        cleanText(row.opponent) ||
        cleanText(row.opponent_owner) ||
        cleanText(row.opponent_team) ||
        "Opponent TBD";

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><strong>${opponent}</strong></td>
        <td>${cleanText(row.record) || "TBD"}</td>
        <td>${cleanText(row.wins) || "TBD"}</td>
        <td>${cleanText(row.losses) || "TBD"}</td>
        <td>${cleanText(row.points_for) || cleanText(row.point_margin) || "TBD"}</td>
      `;

      tableBody.appendChild(tr);
    });

    return;
  }

  if (container) {
    container.innerHTML = "";

    rows.forEach(row => {
      const opponent =
        cleanText(row.opponent) ||
        cleanText(row.opponent_owner) ||
        cleanText(row.opponent_team) ||
        "Opponent TBD";

      const item = document.createElement("div");
      item.className = "count-row";

      item.innerHTML = `
        <span>${opponent}</span>
        <strong>${cleanText(row.record) || "TBD"}</strong>
      `;

      container.appendChild(item);
    });
  }
}

/* =========================================================
   TEAM RECORDS HELD
   ========================================================= */

function renderTeamRecords(records) {
  const container = getElement([
    "team-records-held",
    "team-records-list",
    "franchise-records-held",
    "records-held-list"
  ]);

  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = emptyState(
      "League records coming soon.",
      "Any records owned by this franchise will appear here."
    );
    return;
  }

  container.innerHTML = "";

  records.forEach(record => {
    const title =
      cleanText(record.record_name) ||
      cleanText(record.title) ||
      cleanText(record.record) ||
      "Record TBD";

    const value =
      cleanText(record.value) ||
      cleanText(record.amount) ||
      cleanText(record.stat) ||
      "Value TBD";

    const year = cleanText(record.year);

    const item = document.createElement("div");
    item.className = "record-item";

    item.innerHTML = `
      <strong>${title}</strong>
      <span>${value}${year ? ` · ${year}` : ""}</span>
    `;

    container.appendChild(item);
  });
}

/* =========================================================
   BRAND / LOGOS / UNIFORMS
   ========================================================= */

function renderTeamBrand(team) {
  renderImageOrPlaceholder(
    ["team-primary-logo", "primary-logo", "franchise-primary-logo"],
    team.primary_logo,
    `${cleanText(team.team_name)} primary logo`,
    "Primary Logo Coming Soon",
    "logo-placeholder"
  );

  renderImageOrPlaceholder(
    ["team-secondary-logo", "secondary-logo", "franchise-secondary-logo"],
    team.secondary_logo,
    `${cleanText(team.team_name)} secondary logo`,
    "Secondary Logo Coming Soon",
    "logo-placeholder"
  );

  renderImageOrPlaceholder(
    ["team-uniform-image", "team-uniform", "uniform-image", "franchise-uniform"],
    team.uniform_image,
    `${cleanText(team.team_name)} uniform`,
    "Uniform Coming Soon",
    "uniform-placeholder"
  );

  setTextAny(
    ["team-primary-color", "primary-color-value"],
    cleanText(team.primary_color) || "Coming soon"
  );

  setTextAny(
    ["team-secondary-color", "secondary-color-value"],
    cleanText(team.secondary_color) || "Coming soon"
  );

  setTextAny(
    ["team-decal-color", "decal-color-value"],
    cleanText(team.decal_color) || "Coming soon"
  );
}

function renderImageOrPlaceholder(ids, imagePath, altText, placeholderText, placeholderClass) {
  const container = getElement(ids);

  if (!container) return;

  if (isMissing(imagePath)) {
    container.innerHTML = `
      <div class="${placeholderClass || "logo-placeholder"}">
        ${placeholderText}
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <img src="${cleanText(imagePath)}" alt="${cleanText(altText)}">
  `;
}

/* =========================================================
   ERROR STATES
   ========================================================= */

function renderTeamNotFound(ownerId) {
  const main = document.querySelector("main") || document.body;

  main.innerHTML = `
    <section class="content-card">
      <p class="section-label">Franchise Not Found</p>
      <h1>Team page not found</h1>
      <p>
        No team was found for owner ID: <strong>${ownerId || "missing"}</strong>.
        Check the URL and make sure this owner exists in <code>data/teams.csv</code>.
      </p>
      <a class="button-link" href="teams.html">Back to Teams</a>
    </section>
  `;
}

function renderPageError() {
  const main = document.querySelector("main") || document.body;

  main.innerHTML = `
    <section class="content-card">
      <p class="section-label">Page Error</p>
      <h1>Team page could not load</h1>
      <p>
        Something went wrong loading this franchise page. Check
        <code>team.js</code>, <code>data/teams.csv</code>, and <code>data/standings.csv</code>.
      </p>
      <a class="button-link" href="teams.html">Back to Teams</a>
    </section>
  `;
}

/* =========================================================
   CALCULATIONS
   ========================================================= */

function calculateLifetimeRecord(rows) {
  if (!rows || rows.length === 0) return "";

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let foundRecord = false;

  rows.forEach(row => {
    const record = cleanText(row.record);

    if (!record.includes("-")) return;

    const parts = record.split("-").map(Number);

    wins += Number(parts[0]) || 0;
    losses += Number(parts[1]) || 0;
    ties += Number(parts[2]) || 0;

    foundRecord = true;
  });

  if (!foundRecord) return "";

  if (ties > 0) {
    return `${wins}-${losses}-${ties}`;
  }

  return `${wins}-${losses}`;
}

function calculateAverageFinish(rows) {
  const ranks = rows
    .map(row => Number(row.rank))
    .filter(rank => !Number.isNaN(rank));

  if (ranks.length === 0) return "";

  const average = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;

  return average.toFixed(1);
}

function countTitlesFromTeam(team) {
  const titles = cleanText(team.titles);

  if (!isMissing(titles)) return titles;

  return "0";
}

/* =========================================================
   STYLE HELPERS
   ========================================================= */

function applyTeamColors(team) {
  const root = document.documentElement;

  const primary = cleanText(team.primary_color);
  const secondary = cleanText(team.secondary_color);
  const decal = cleanText(team.decal_color);

  if (!isMissing(primary)) {
    root.style.setProperty("--team-primary", primary);
  }

  if (!isMissing(secondary)) {
    root.style.setProperty("--team-secondary", secondary);
  }

  if (!isMissing(decal)) {
    root.style.setProperty("--team-decal", decal);
  }
}

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function getElement(ids) {
  for (const id of ids) {
    const element = document.getElementById(id);

    if (element) return element;
  }

  return null;
}

function setTextAny(ids, value) {
  const element = getElement(ids);

  if (element) {
    element.textContent = value;
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

function isMissing(value) {
  const text = cleanText(value).toLowerCase();

  return (
    !text ||
    text === "tbd" ||
    text === "na" ||
    text === "n/a" ||
    text === "coming soon" ||
    text === "undefined" ||
    text === "null" ||
    text === "-"
  );
}

function emptyState(title, message) {
  return `
    <div class="empty-state-card">
      <strong>${title}</strong>
      <span>${message}</span>
    </div>
  `;
}

function ordinal(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return cleanText(value) || "TBD";

  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = number % 100;

  return number + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
}

function formatOwnerName(ownerId) {
  const ownerMap = {
    bard: "Bard",
    sco: "Sco",
    jake: "Jake",
    muffin: "Muffin",
    miner: "Miner",
    hunter: "Hunter",
    kyle: "Kyle",
    gary: "Gary",
    eric: "Eric",
    sabella: "Sabella",
    charlie: "Charlie",
    miller: "Miller"
  };

  return ownerMap[cleanText(ownerId).toLowerCase()] || cleanText(ownerId);
}

buildTeamPage();
