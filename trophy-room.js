async function buildTrophyRoomPage() {
  try {
    const standings = await loadOptionalCSV("data/standings.csv");
    const trophyRows = await loadOptionalCSV("data/trophy-room.csv");
    const miniGames = await loadOptionalCSV("data/mini-games.csv");
    const playInRows = await loadOptionalCSV("data/play-in.csv");

    const standingsByYear = groupByYear(standings);
    const playInByYear = buildPlayInByYear(playInRows);
    const years = Object.keys(standingsByYear).sort((a, b) => Number(b) - Number(a));
    const latestYear = years[0];

    buildCurrentHolderCards(latestYear, standingsByYear, playInByYear);
    buildLeagueTitles(standingsByYear, playInByYear);
    buildSeasonAwards(trophyRows);
    buildMiniGames(trophyRows, miniGames);
    buildFunAwards(trophyRows);
    setupTrophyTabs();

  } catch (error) {
    console.error("Trophy Room error:", error);
    showTrophyError();
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
   CURRENT HOLDER CARDS
   ========================================================= */

function buildCurrentHolderCards(latestYear, standingsByYear, playInByYear) {
  if (!latestYear) {
    setText("trophy-current-regular-season", "TBD");
    setText("trophy-current-regular-season-detail", "No standings found.");
    setText("trophy-current-points", "TBD");
    setText("trophy-current-points-detail", "No standings found.");
    setText("trophy-current-play-in", "TBD");
    setText("trophy-current-play-in-detail", "No play-in data found.");
    return;
  }

  const standings = standingsByYear[latestYear] || [];

  const regularSeasonChampion =
    standings.find(row => Number(row.rank) === 1) ||
    standings[0];

  const pointsChampion = [...standings].sort((a, b) => {
    return Number(b.points_for) - Number(a.points_for);
  })[0];

  setText("trophy-current-regular-season", cleanText(regularSeasonChampion?.team) || "TBD");
  setText(
    "trophy-current-regular-season-detail",
    `${latestYear} · ${cleanText(regularSeasonChampion?.record) || "TBD"} record`
  );

  setText("trophy-current-points", cleanText(pointsChampion?.team) || "TBD");
  setText(
    "trophy-current-points-detail",
    `${latestYear} · ${formatNumber(pointsChampion?.points_for)} points`
  );

  renderCurrentPlayIn(latestYear, playInByYear);
}

function renderCurrentPlayIn(latestYear, playInByYear) {
  const numericYear = Number(latestYear);

  if (numericYear < 2021) {
    setText("trophy-current-play-in", "Play-In Not Yet Established");
    setText("trophy-current-play-in-detail", "The play-in format began in 2021.");
    return;
  }

  const playIn = playInByYear[latestYear];

  if (!playIn) {
    setText("trophy-current-play-in", "TBD");
    setText("trophy-current-play-in-detail", `${latestYear} play-in winner will load from CSV.`);
    return;
  }

  const winner =
    cleanText(playIn.winner_team) ||
    cleanText(playIn.team) ||
    cleanText(playIn.play_in_winner) ||
    "TBD";

  const opponent =
    cleanText(playIn.opponent_team) ||
    cleanText(playIn.opponent) ||
    "";

  const score = cleanText(playIn.score);

  setText("trophy-current-play-in", winner);

  const detail = [
    latestYear,
    opponent ? `vs ${opponent}` : "",
    score
  ].filter(value => cleanText(value)).join(" · ");

  setText("trophy-current-play-in-detail", detail || `${latestYear} Play-In Winner`);
}

/* =========================================================
   LEAGUE TITLES
   Generated from standings.csv and play-in.csv
   ========================================================= */

function buildLeagueTitles(standingsByYear, playInByYear) {
  const grid = document.getElementById("league-titles-grid");

  if (!grid) return;

  const years = Object.keys(standingsByYear).sort((a, b) => Number(b) - Number(a));

  const regularSeasonRows = [];
  const pointsChampionRows = [];
  const playInWinnerRows = [];

  years.forEach(year => {
    const standings = standingsByYear[year] || [];

    const regularSeasonChampion =
      standings.find(row => Number(row.rank) === 1) ||
      standings[0];

    const pointsChampion = [...standings].sort((a, b) => {
      return Number(b.points_for) - Number(a.points_for);
    })[0];

    if (regularSeasonChampion) {
      regularSeasonRows.push({
        year,
        winner_team: cleanText(regularSeasonChampion.team),
        value: cleanText(regularSeasonChampion.record),
        notes: "Regular Season Champion"
      });
    }

    if (pointsChampion) {
      pointsChampionRows.push({
        year,
        winner_team: cleanText(pointsChampion.team),
        value: `${formatNumber(pointsChampion.points_for)} points`,
        notes: "Points Champion"
      });
    }

    if (Number(year) < 2021) {
      playInWinnerRows.push({
        year,
        winner_team: "Play-In Not Yet Established",
        value: "",
        notes: "Format began in 2021"
      });
    } else {
      const playIn = playInByYear[year];

      playInWinnerRows.push({
        year,
        winner_team:
          cleanText(playIn?.winner_team) ||
          cleanText(playIn?.team) ||
          cleanText(playIn?.play_in_winner) ||
          "TBD",
        value: cleanText(playIn?.score),
        notes: cleanText(playIn?.opponent_team) ? `vs ${cleanText(playIn.opponent_team)}` : "Play-In Winner"
      });
    }
  });

  grid.innerHTML = "";

  grid.appendChild(buildAwardHistoryCard("Regular Season Champion", regularSeasonRows));
  grid.appendChild(buildAwardHistoryCard("Points Champion", pointsChampionRows));
  grid.appendChild(buildAwardHistoryCard("Play-In Winner", playInWinnerRows));
}

/* =========================================================
   SEASON AWARDS
   trophy-room.csv
   ========================================================= */

function buildSeasonAwards(trophyRows) {
  const grid = document.getElementById("season-awards-grid");

  if (!grid) return;

  const rows = (trophyRows || []).filter(row => {
    const section = cleanText(row.section).toLowerCase();
    const award = cleanText(row.award);

    if (isExcludedTrophyAward(award)) return false;
    if (section === "season_awards" || section === "season awards") return true;
    if (isMiniGameAward(award)) return false;
    if (isFunAward(award)) return false;
    if (isLeagueTitleAward(award)) return false;

    return Boolean(award);
  });

  renderGroupedAwards(grid, rows, "Season Awards");
}

/* =========================================================
   MINI GAMES
   trophy-room.csv + mini-games.csv
   ========================================================= */

function buildMiniGames(trophyRows, miniGames) {
  const grid = document.getElementById("mini-games-grid");

  if (!grid) return;

  const trophyMiniRows = (trophyRows || []).filter(row => {
    const section = cleanText(row.section).toLowerCase();
    const award = cleanText(row.award);

    if (isExcludedTrophyAward(award)) return false;

    return (
      section === "mini_games" ||
      section === "mini games" ||
      isMiniGameAward(award)
    );
  });

  const normalizedMiniGameRows = (miniGames || []).map(row => {
    return {
      year: cleanText(row.year),
      award: cleanText(row.game) || cleanText(row.award) || "Mini Game",
      winner_team: cleanText(row.winner_team) || cleanText(row.team),
      winner_name: cleanText(row.winner_name) || cleanText(row.winner),
      value: cleanText(row.result) || cleanText(row.value),
      notes: cleanText(row.notes)
    };
  });

  const rows = [...trophyMiniRows, ...normalizedMiniGameRows];

  renderGroupedAwards(grid, rows, "Mini Games");
}

/* =========================================================
   FUN AWARDS
   trophy-room.csv
   ========================================================= */

function buildFunAwards(trophyRows) {
  const grid = document.getElementById("fun-awards-grid");

  if (!grid) return;

  const rows = (trophyRows || []).filter(row => {
    const section = cleanText(row.section).toLowerCase();
    const award = cleanText(row.award);

    if (isExcludedTrophyAward(award)) return false;

    return (
      section === "fun_awards" ||
      section === "fun awards" ||
      isFunAward(award)
    );
  });

  renderGroupedAwards(grid, rows, "Fun Awards");
}

/* =========================================================
   AWARD CARD RENDERING
   ========================================================= */

function renderGroupedAwards(grid, rows, fallbackTitle) {
  grid.innerHTML = "";

  if (!rows || rows.length === 0) {
    grid.innerHTML = `
      <div class="record-item">
        <strong>${fallbackTitle}</strong>
        <span>TBD</span>
      </div>
    `;
    return;
  }

  const grouped = groupRowsByAward(rows);
  const awardNames = Object.keys(grouped).sort();

  awardNames.forEach(awardName => {
    grid.appendChild(buildAwardHistoryCard(awardName, grouped[awardName]));
  });
}

function buildAwardHistoryCard(title, rows) {
  const card = document.createElement("article");
  card.className = "trophy-award-card";

  const sortedRows = [...(rows || [])].sort((a, b) => {
    return Number(b.year) - Number(a.year);
  });

  const historyHtml = sortedRows.map(row => {
    const winner =
      cleanText(row.winner_team) ||
      cleanText(row.team) ||
      cleanText(row.winner_name) ||
      cleanText(row.winner) ||
      "TBD";

    const value = cleanText(row.value);
    const notes = cleanText(row.notes);
    const year = cleanText(row.year) || "TBD";

    const details = [
      value,
      notes
    ].filter(item => cleanText(item)).join(" · ");

    return `
      <div class="trophy-history-row">
        <span>${year}</span>
        <strong>${winner}</strong>
        <small>${details || "TBD"}</small>
      </div>
    `;
  }).join("");

  card.innerHTML = `
    <div class="trophy-award-card-header">
      <p class="section-label">Award History</p>
      <h3>${title}</h3>
    </div>

    <div class="trophy-history-list">
      ${historyHtml}
    </div>
  `;

  return card;
}

function groupRowsByAward(rows) {
  const grouped = {};

  (rows || []).forEach(row => {
    const award = cleanText(row.award) || cleanText(row.game) || "Award";

    if (!grouped[award]) {
      grouped[award] = [];
    }

    grouped[award].push(row);
  });

  return grouped;
}

/* =========================================================
   TABS
   ========================================================= */

function setupTrophyTabs() {
  const buttons = document.querySelectorAll("[data-trophy-tab]");
  const panels = document.querySelectorAll(".trophy-tab-panel");

  if (!buttons.length || !panels.length) return;

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-trophy-tab");

      buttons.forEach(item => item.classList.remove("is-active"));
      panels.forEach(panel => panel.classList.remove("is-active"));

      button.classList.add("is-active");

      const panel = document.getElementById(`${target}-panel`);

      if (panel) {
        panel.classList.add("is-active");
      }
    });
  });
}

/* =========================================================
   CLASSIFICATION HELPERS
   ========================================================= */

function isExcludedTrophyAward(award) {
  const cleaned = cleanText(award).toLowerCase();

  return [
    "league champion",
    "champion",
    "championship winner",
    "runner-up",
    "runner up",
    "the sco",
    "sco"
  ].includes(cleaned);
}

function isLeagueTitleAward(award) {
  const cleaned = cleanText(award).toLowerCase();

  return [
    "regular season champion",
    "points champion",
    "play-in winner",
    "play in winner"
  ].includes(cleaned);
}

function isMiniGameAward(award) {
  const cleaned = cleanText(award).toLowerCase();

  return (
    cleaned.includes("pick'em") ||
    cleaned.includes("pickem") ||
    cleaned.includes("pick em") ||
    cleaned.includes("survivor") ||
    cleaned.includes("eliminator")
  );
}

function isFunAward(award) {
  const cleaned = cleanText(award).toLowerCase();

  return [
    "luckiest team",
    "biggest collapse",
    "biggest fraud",
    "best trash talk",
    "worst beat",
    "most chaotic team",
    "comeback team",
    "most cursed team"
  ].includes(cleaned);
}

/* =========================================================
   GROUPING HELPERS
   ========================================================= */

function groupByYear(rows) {
  const grouped = {};

  (rows || []).forEach(row => {
    const year = cleanText(row.year);

    if (!year) return;

    if (!grouped[year]) {
      grouped[year] = [];
    }

    grouped[year].push(row);
  });

  Object.keys(grouped).forEach(year => {
    grouped[year].sort((a, b) => Number(a.rank) - Number(b.rank));
  });

  return grouped;
}

function buildPlayInByYear(playInRows) {
  const lookup = {};

  (playInRows || []).forEach(row => {
    const year = cleanText(row.year);

    if (!year) return;

    lookup[year] = row;
  });

  return lookup;
}

/* =========================================================
   ERROR STATE
   ========================================================= */

function showTrophyError() {
  ["league-titles-grid", "season-awards-grid", "mini-games-grid", "fun-awards-grid"].forEach(id => {
    const grid = document.getElementById(id);

    if (!grid) return;

    grid.innerHTML = `
      <div class="record-item">
        <strong>Error</strong>
        <span>Check trophy-room.js, data-loader.js, and your CSV files.</span>
      </div>
    `;
  });
}

/* =========================================================
   HELPERS
   ========================================================= */

function setText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function cleanText(value) {
  return String(value || "").trim();
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

buildTrophyRoomPage();
