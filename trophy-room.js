async function buildTrophyRoomPage() {
  try {
    const trophyRoom = await loadOptionalCSV("data/trophy-room.csv");
    const miniGames = await loadOptionalCSV("data/mini-games.csv");

    const validTrophyRows = trophyRoom.filter(isValidAwardRow);
    const years = getYears(validTrophyRows);
    const latestYear = years[0];

    buildFeatureCards(validTrophyRows, latestYear);
    buildMajorAwards(validTrophyRows, latestYear);
    buildSeasonAwards(validTrophyRows, latestYear);
    buildWeeklyAwards(validTrophyRows, latestYear);
    buildMiniGames(miniGames);
    buildYearByYearAwards(validTrophyRows, miniGames, years);
    buildFunAwards(validTrophyRows, latestYear);

  } catch (error) {
    console.warn("Trophy Room issue:", error);
    hideTrophyPlaceholders();
  }
}

/* =========================================================
   DATA LOADING
   ========================================================= */

async function loadOptionalCSV(path) {
  try {
    return await loadCSV(path);
  } catch (error) {
    console.warn(`${path} did not load. Skipping.`, error);
    return [];
  }
}

/* =========================================================
   DATA HELPERS
   ========================================================= */

function getYears(rows) {
  return [...new Set(rows.map(row => cleanText(row.year)))]
    .filter(year => !isMissing(year))
    .sort((a, b) => Number(b) - Number(a));
}

function isValidAwardRow(row) {
  const year = cleanText(row.year);
  const award = cleanText(row.award);
  const display = getAwardDisplay(row);

  return !isMissing(year) && !isMissing(award) && !isMissing(display);
}

function getAward(rows, year, awardName) {
  return rows.find(row => {
    return cleanText(row.year) === cleanText(year) &&
      cleanText(row.award).toLowerCase() === awardName.toLowerCase() &&
      !isMissing(getAwardDisplay(row));
  });
}

function getAwardDisplay(row) {
  if (!row) return "";

  const team = cleanText(row.winner_team);
  const name = cleanText(row.winner_name);
  const value = cleanText(row.value);

  const displayParts = [
    !isMissing(team) ? team : "",
    !isMissing(name) ? name : "",
    !isMissing(value) ? value : ""
  ].filter(Boolean);

  return displayParts.join(" · ");
}

function getMiniGameDisplay(row) {
  const team = cleanText(row.winner_team);
  const winner = cleanText(row.winner_name);
  const result = cleanText(row.result);

  const parts = [
    !isMissing(team) ? team : "",
    !isMissing(winner) ? winner : "",
    !isMissing(result) ? result : ""
  ].filter(Boolean);

  return parts.join(" · ");
}

/* =========================================================
   FEATURE CARDS
   ========================================================= */

function buildFeatureCards(rows, latestYear) {
  const featureItems = [
    {
      id: "trophy-latest-champion",
      award: "League Champion"
    },
    {
      id: "trophy-regular-season-winner",
      award: "Regular Season Winner"
    },
    {
      id: "trophy-most-points",
      award: "Most Points"
    },
    {
      id: "trophy-the-sco",
      award: "The Sco"
    }
  ];

  featureItems.forEach(item => {
    const row = getAward(rows, latestYear, item.award);
    const element = document.getElementById(item.id);

    if (!element) return;

    if (!row) {
      hideFeatureCard(element);
      return;
    }

    element.textContent = `${latestYear} · ${getAwardDisplay(row)}`;
  });
}

function hideFeatureCard(element) {
  const card =
    element.closest(".record-feature-card") ||
    element.closest(".content-card") ||
    element.parentElement;

  if (card) {
    card.style.display = "none";
  }
}

/* =========================================================
   MAJOR AWARDS
   ========================================================= */

function buildMajorAwards(rows, latestYear) {
  const grid = document.getElementById("major-awards-grid");
  if (!grid) return;

  const awards = [
    {
      name: "League Champion",
      icon: "🏆",
      className: "gold-award",
      description: "Winner of the championship bracket."
    },
    {
      name: "Runner-Up",
      icon: "🥈",
      className: "silver-award",
      description: "Made the title game and came up one win short."
    },
    {
      name: "Regular Season Winner",
      icon: "👑",
      className: "",
      description: "Finished first in the regular season standings."
    },
    {
      name: "The Sco",
      icon: "📣",
      className: "shame-award",
      description: "Lost two straight in the consolation bracket and earned league infamy."
    }
  ];

  grid.innerHTML = "";

  awards.forEach(award => {
    const row = getAward(rows, latestYear, award.name);

    if (!row) return;

    const card = document.createElement("div");
    card.className = `award-cabinet-card ${award.className}`.trim();

    card.innerHTML = `
      <span>${award.icon}</span>
      <h3>${award.name}</h3>
      <p>${award.description}</p>
      <strong>${latestYear}: ${getAwardDisplay(row)}</strong>
    `;

    grid.appendChild(card);
  });

  hideSectionIfEmpty(grid);
}

/* =========================================================
   SEASON AWARDS
   ========================================================= */

function buildSeasonAwards(rows, latestYear) {
  const grid = document.getElementById("season-awards-grid");
  if (!grid) return;

  const awards = [
    {
      name: "Most Points",
      icon: "🔥",
      description: "Highest total points for the regular season."
    },
    {
      name: "Most Waiver Adds",
      icon: "🔁",
      description: "Most roster moves made during the season."
    },
    {
      name: "Most Points by a Player",
      icon: "⭐",
      description: "Highest scoring fantasy player season."
    },
    {
      name: "Point Margin Per Game",
      icon: "📈",
      description: "Best average scoring margin per matchup."
    },
    {
      name: "Best Draft Pick",
      icon: "🎯",
      description: "The pick that aged the best."
    },
    {
      name: "Worst Draft Pick",
      icon: "📉",
      description: "The pick that became instant group chat evidence."
    }
  ];

  grid.innerHTML = "";

  awards.forEach(award => {
    const row = getAward(rows, latestYear, award.name);

    if (!row) return;

    const card = document.createElement("div");
    card.className = "award-cabinet-card";

    card.innerHTML = `
      <span>${award.icon}</span>
      <h3>${award.name}</h3>
      <p>${award.description}</p>
      <strong>${latestYear}: ${getAwardDisplay(row)}</strong>
    `;

    grid.appendChild(card);
  });

  hideSectionIfEmpty(grid);
}

/* =========================================================
   WEEKLY AWARDS
   ========================================================= */

function buildWeeklyAwards(rows, latestYear) {
  const grid = document.getElementById("weekly-awards-grid");
  if (!grid) return;

  const awards = [
    {
      name: "Highest Scoring Player",
      icon: "⚡",
      description: "Best individual player score from any week that season."
    },
    {
      name: "Highest Weekly Score",
      icon: "🚀",
      description: "Highest team score in a single week."
    },
    {
      name: "Biggest Weekly Blowout",
      icon: "💥",
      description: "Largest margin of victory in a single week."
    }
  ];

  grid.innerHTML = "";

  awards.forEach(award => {
    const row = getAward(rows, latestYear, award.name);

    if (!row) return;

    const card = document.createElement("div");
    card.className = "award-cabinet-card";

    card.innerHTML = `
      <span>${award.icon}</span>
      <h3>${award.name}</h3>
      <p>${award.description}</p>
      <strong>${latestYear}: ${getAwardDisplay(row)}</strong>
    `;

    grid.appendChild(card);
  });

  hideSectionIfEmpty(grid);
}

/* =========================================================
   SIDE COMPETITIONS / MINI GAMES
   ========================================================= */

function buildMiniGames(miniGames) {
  const container =
    document.getElementById("side-competitions-grid") ||
    document.getElementById("mini-games-list");

  if (!container) return;

  const validGames = miniGames.filter(row => {
    const year = cleanText(row.year);
    const game = cleanText(row.game);
    const display = getMiniGameDisplay(row);

    return !isMissing(year) && !isMissing(game) && !isMissing(display);
  });

  if (validGames.length === 0) {
    hideSectionAround(container);
    return;
  }

  const gamesByName = {};

  validGames.forEach(row => {
    const game = cleanText(row.game);

    if (!gamesByName[game]) {
      gamesByName[game] = [];
    }

    gamesByName[game].push(row);
  });

  container.innerHTML = "";

  Object.entries(gamesByName)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([gameName, rows]) => {
      const sortedRows = [...rows].sort((a, b) => Number(b.year) - Number(a.year));

      const card = document.createElement("article");
      card.className = "content-card side-competition-card";

      card.innerHTML = `
        <p class="section-label">Side Competition</p>
        <h3>${gameName}</h3>

        <div class="records-list">
          ${sortedRows.slice(0, 8).map(row => {
            return `
              <div class="record-item">
                <strong>${cleanText(row.year)}</strong>
                <span>${getMiniGameDisplay(row)}</span>
              </div>
            `;
          }).join("")}
        </div>
      `;

      container.appendChild(card);
    });

  hideSectionIfEmpty(container);
}

/* =========================================================
   YEAR BY YEAR AWARDS
   ========================================================= */

function buildYearByYearAwards(rows, miniGames, years) {
  const body = document.getElementById("yearly-awards-body");
  if (!body) return;

  if (!years || years.length === 0) {
    hideSectionAround(body);
    return;
  }

  body.innerHTML = "";

  years.forEach(year => {
    const champion = getAward(rows, year, "League Champion");
    const runnerUp = getAward(rows, year, "Runner-Up");
    const regularSeason = getAward(rows, year, "Regular Season Winner");
    const mostPoints = getAward(rows, year, "Most Points");
    const theSco = getAward(rows, year, "The Sco");

    const yearMiniGames = miniGames.filter(row => {
      return cleanText(row.year) === cleanText(year) &&
        !isMissing(cleanText(row.game)) &&
        !isMissing(getMiniGameDisplay(row));
    });

    const miniGameSummary = yearMiniGames.length
      ? yearMiniGames.map(row => `${cleanText(row.game)}: ${getMiniGameDisplay(row)}`).join(" / ")
      : "";

    const rowValues = [
      getAwardDisplay(champion),
      getAwardDisplay(runnerUp),
      getAwardDisplay(regularSeason),
      getAwardDisplay(mostPoints),
      getAwardDisplay(theSco),
      miniGameSummary
    ];

    const hasAnyData = rowValues.some(value => !isMissing(value));

    if (!hasAnyData) return;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${year}</td>
      <td>${getAwardDisplay(champion) || "—"}</td>
      <td>${getAwardDisplay(runnerUp) || "—"}</td>
      <td>${getAwardDisplay(regularSeason) || "—"}</td>
      <td>${getAwardDisplay(mostPoints) || "—"}</td>
      <td>${getAwardDisplay(theSco) || "—"}</td>
      <td>${miniGameSummary || "—"}</td>
    `;

    body.appendChild(tr);
  });

  hideSectionIfEmpty(body);
}

/* =========================================================
   FUN AWARDS
   ========================================================= */

function buildFunAwards(rows, latestYear) {
  const grid = document.getElementById("fun-awards-grid");
  if (!grid) return;

  const awards = [
    {
      name: "Luckiest Team",
      icon: "🍀",
      description: "For the team that kept winning games they had no business winning."
    },
    {
      name: "Biggest Fraud",
      icon: "🎭",
      description: "For the team that looked dangerous until everyone realized they were not."
    },
    {
      name: "Biggest Collapse",
      icon: "📉",
      description: "Started hot. Ended dead."
    },
    {
      name: "Best Trash Talk",
      icon: "🗣️",
      description: "For excellence in group chat warfare."
    }
  ];

  grid.innerHTML = "";

  awards.forEach(award => {
    const row = getAward(rows, latestYear, award.name);

    if (!row) return;

    const card = document.createElement("div");
    card.className = "award-cabinet-card";

    card.innerHTML = `
      <span>${award.icon}</span>
      <h3>${award.name}</h3>
      <p>${award.description}</p>
      <strong>${latestYear}: ${getAwardDisplay(row)}</strong>
    `;

    grid.appendChild(card);
  });

  hideSectionIfEmpty(grid);
}

/* =========================================================
   HIDE HELPERS
   ========================================================= */

function hideSectionIfEmpty(element) {
  if (!element) return;

  const hasChildren = element.children && element.children.length > 0;
  const hasTableRows = element.querySelectorAll && element.querySelectorAll("tr").length > 0;

  if (!hasChildren && !hasTableRows) {
    hideSectionAround(element);
  }
}

function hideSectionAround(element) {
  const section =
    element.closest("section") ||
    element.closest(".content-card") ||
    element.parentElement;

  if (section) {
    section.style.display = "none";
  }
}

function hideTrophyPlaceholders() {
  [
    "major-awards-grid",
    "season-awards-grid",
    "weekly-awards-grid",
    "fun-awards-grid",
    "mini-games-list",
    "side-competitions-grid",
    "yearly-awards-body"
  ].forEach(id => {
    const element = document.getElementById(id);

    if (element) {
      hideSectionAround(element);
    }
  });
}

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function setText(id, value) {
  const element = document.getElementById(id);

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

buildTrophyRoomPage();
