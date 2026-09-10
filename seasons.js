async function buildSeasonsPage() {
  try {
    const standings = await loadCSV("data/standings.csv");
    const teams = await loadOptionalCSV("data/teams.csv");
    const playInResults = await loadOptionalCSV("data/play-in.csv");

    const standingsByYear = groupStandingsByYear(standings);
    const years = Object.keys(standingsByYear).sort((a, b) => Number(b) - Number(a));

    const teamsByOwner = buildTeamsByOwner(teams);
    const playInByYear = buildPlayInByYear(playInResults);

    buildSeasonSelector(years, standingsByYear, teamsByOwner, playInByYear);

    if (years.length > 0) {
      renderSelectedSeason(years[0], standingsByYear, teamsByOwner, playInByYear);
    }

  } catch (error) {
    console.error("Seasons page error:", error);

    const tableBody = document.getElementById("season-standings-body");

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10">Standings could not load. Check data/standings.csv, data-loader.js, and seasons.js.</td>
        </tr>
      `;
    }
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

/* =========================================================
   GROUPING
   ========================================================= */

function groupStandingsByYear(standings) {
  const grouped = {};

  standings.forEach(row => {
    const year = cleanText(row.year);

    if (!year) return;

    if (!grouped[year]) {
      grouped[year] = [];
    }

    grouped[year].push(row);
  });

  Object.keys(grouped).forEach(year => {
    grouped[year].sort((a, b) => {
      return Number(a.rank) - Number(b.rank);
    });
  });

  return grouped;
}

function buildTeamsByOwner(teams) {
  const lookup = {};

  (teams || []).forEach(team => {
    const ownerId = cleanText(team.owner_id).toLowerCase();

    if (!ownerId) return;

    lookup[ownerId] = team;
  });

  return lookup;
}

function buildPlayInByYear(playInResults) {
  const lookup = {};

  (playInResults || []).forEach(row => {
    const year = cleanText(row.year);

    if (!year) return;

    lookup[year] = row;
  });

  return lookup;
}

/* =========================================================
   SEASON SELECTOR
   ========================================================= */

function buildSeasonSelector(years, standingsByYear, teamsByOwner, playInByYear) {
  const selector = document.getElementById("season-selector");

  if (!selector) return;

  selector.innerHTML = "";

  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `${year} Season`;
    selector.appendChild(option);
  });

  selector.addEventListener("change", event => {
    renderSelectedSeason(event.target.value, standingsByYear, teamsByOwner, playInByYear);
  });
}

/* =========================================================
   SELECTED SEASON RENDER
   ========================================================= */

function renderSelectedSeason(year, standingsByYear, teamsByOwner, playInByYear) {
  const standings = standingsByYear[year] || [];

  if (standings.length === 0) {
    renderEmptySeason(year);
    return;
  }

  const regularSeasonChampion = standings.find(row => Number(row.rank) === 1) || standings[0];

  const pointsLeader = [...standings].sort((a, b) => {
    return Number(b.points_for) - Number(a.points_for);
  })[0];

  const powerRatingLeader = [...standings].sort((a, b) => {
    return Number(b.team_rating) - Number(a.team_rating);
  })[0];

  const playInResult = playInByYear[year];

  renderFeatureCards(year, regularSeasonChampion, pointsLeader, powerRatingLeader, playInResult, teamsByOwner);
  renderStandingsTable(year, standings);
}

function renderEmptySeason(year) {
  setText("season-feature-year", `${year} Season`);
  setText("season-feature-winner", "TBD");
  setText("season-feature-winner-details", "No standings found.");

  setText("season-feature-points-team", "TBD");
  setText("season-feature-points-details", "No scoring data found.");

  setText("season-feature-rating-team", "TBD");
  setText("season-feature-rating-details", "No rating data found.");

  setText("play-in-card-title", "Play-In");
  setText("season-feature-play-in-team", "TBD");
  setText("season-feature-play-in-details", "No play-in data found.");

  const tableBody = document.getElementById("season-standings-body");

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10">No standings found for ${year}.</td>
      </tr>
    `;
  }
}

/* =========================================================
   FEATURE CARDS
   ========================================================= */

function renderFeatureCards(year, champion, pointsLeader, ratingLeader, playInResult, teamsByOwner) {
  setText("season-feature-year", `${year} Season`);
  setText("season-feature-winner", cleanText(champion.team) || "TBD");
  setText(
    "season-feature-winner-details",
    `Regular Season Champion · ${cleanText(champion.record) || "TBD"} · ${formatWinPct(champion.win_pct)} Win %`
  );

  setText("season-feature-points-team", cleanText(pointsLeader.team) || "TBD");
  setText(
    "season-feature-points-details",
    `${formatNumber(pointsLeader.points_for)} points · ${formatNumber(pointsLeader.avg_for)} average`
  );

  setText("season-feature-rating-team", cleanText(ratingLeader.team) || "TBD");
  setText(
    "season-feature-rating-details",
    `${formatNumber(ratingLeader.team_rating)} rating · ${cleanText(ratingLeader.record) || "TBD"} record`
  );

  renderPlayInCard(year, playInResult);

  applyTeamCardColor("regular-season-champion-card", champion, teamsByOwner, "champion");
  applyTeamCardColor("points-leader-card", pointsLeader, teamsByOwner, "points");
  applyTeamCardColor("power-rating-leader-card", ratingLeader, teamsByOwner, "rating");
}

function renderPlayInCard(year, playInResult) {
  const numericYear = Number(year);

  if (numericYear < 2021) {
    setText("play-in-card-title", "Not Established");
    setText("season-feature-play-in-team", "Play-In Not Yet Established");
    setText("season-feature-play-in-details", "The play-in format began in 2021.");
    return;
  }

  setText("play-in-card-title", "Play-In");

  if (!playInResult) {
    setText("season-feature-play-in-team", "TBD");
    setText("season-feature-play-in-details", "Play-in winner will load from data/play-in.csv.");
    return;
  }

  const winner =
    cleanText(playInResult.winner_team) ||
    cleanText(playInResult.team) ||
    cleanText(playInResult.play_in_winner) ||
    "TBD";

  const opponent =
    cleanText(playInResult.opponent_team) ||
    cleanText(playInResult.opponent) ||
    "";

  const score = cleanText(playInResult.score);
  const notes = cleanText(playInResult.notes);

  setText("season-feature-play-in-team", winner);

  const detailParts = [
    opponent ? `vs ${opponent}` : "",
    score,
    notes
  ].filter(value => cleanText(value));

  setText("season-feature-play-in-details", detailParts.join(" · ") || "Play-in winner");
}

function applyTeamCardColor(cardId, row, teamsByOwner, cardType) {
  const card = document.getElementById(cardId);

  if (!card || !row) return;

  const ownerId = cleanText(row.owner_id).toLowerCase();
  const team = teamsByOwner[ownerId];

  const primaryColor = cleanColor(team?.primary_color, getFallbackCardColor(cardType));
  const secondaryColor = cleanColor(team?.secondary_color, "#111827");
  const decalColor = cleanColor(team?.decal_color, "#facc15");

  card.style.setProperty("--card-primary-color", primaryColor);
  card.style.setProperty("--card-secondary-color", secondaryColor);
  card.style.setProperty("--card-decal-color", decalColor);

  card.style.background = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  card.style.borderBottomColor = decalColor;
}

function getFallbackCardColor(cardType) {
  if (cardType === "champion") return "#92400e";
  if (cardType === "points") return "#001f3f";
  if (cardType === "rating") return "#334155";

  return "#111827";
}

/* =========================================================
   STANDINGS TABLE
   ========================================================= */

function renderStandingsTable(year, standings) {
  setText("selected-season-label", `${year} Season`);
  setText("selected-season-title", `${year} Final Standings`);

  const tableBody = document.getElementById("season-standings-body");

  if (!tableBody) return;

  if (!standings || standings.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10">Standings will load here.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = standings.map(row => buildStandingRow(row)).join("");
}

function buildStandingRow(row) {
  return `
    <tr>
      <td>${cleanText(row.rank) || "TBD"}</td>
      <td><strong>${cleanText(row.team) || "TBD"}</strong></td>
      <td>${cleanText(row.record) || "TBD"}</td>
      <td>${formatWinPct(row.win_pct)}</td>
      <td>${formatNumber(row.points_for)}</td>
      <td>${formatNumber(row.avg_for)}</td>
      <td>${formatNumber(row.points_against)}</td>
      <td>${formatNumber(row.avg_against)}</td>
      <td>${formatNumber(row.point_margin)}</td>
      <td>${cleanText(row.moves) || "TBD"}</td>
    </tr>
  `;
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatWinPct(value) {
  const cleaned = cleanText(value);

  if (!cleaned) return "TBD";

  const number = Number(cleaned.replace("%", ""));

  if (Number.isNaN(number)) {
    return cleaned;
  }

  let decimal = number;

  if (cleaned.includes("%")) {
    decimal = number / 100;
  }

  if (decimal > 1) {
    decimal = decimal / 100;
  }

  return decimal.toFixed(3).replace("0.", ".");
}

function setText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
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

function ordinal(number) {
  const value = Number(number);

  if (Number.isNaN(value)) return `${number}`;

  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = value % 100;

  return value + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
}

buildSeasonsPage();
