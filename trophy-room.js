async function buildTrophyRoomPage() {
  try {
    const trophyRoom = await loadCSV("data/trophy-room.csv");

    let miniGames = [];

    try {
      miniGames = await loadCSV("data/mini-games.csv");
    } catch (error) {
      console.warn("mini-games.csv did not load:", error);
      miniGames = [];
    }

    const years = getYears(trophyRoom);
    const latestYear = years[0];

    buildFeatureCards(trophyRoom, latestYear);
    buildMajorAwards(trophyRoom, latestYear);
    buildSeasonAwards(trophyRoom, latestYear);
    buildMiniGames(miniGames);
    buildYearByYearAwards(trophyRoom, miniGames, years);
    buildFunAwards(trophyRoom, latestYear);

  } catch (error) {
    console.error("Trophy Room error:", error);
    showTrophyError();
  }
}

function getYears(rows) {
  return [...new Set(rows.map(row => cleanText(row.year)))]
    .filter(year => year && year.toLowerCase() !== "tbd")
    .sort((a, b) => Number(b) - Number(a));
}

function getAward(rows, year, awardName) {
  return rows.find(row => {
    return cleanText(row.year) === cleanText(year) &&
      cleanText(row.award).toLowerCase() === awardName.toLowerCase();
  });
}

function getAwardDisplay(row) {
  if (!row) return "TBD";

  const team = cleanText(row.winner_team);
  const name = cleanText(row.winner_name);
  const value = cleanText(row.value);

  const displayParts = [
    team && team.toLowerCase() !== "tbd" ? team : "",
    name && name.toLowerCase() !== "tbd" ? name : "",
    value && value.toLowerCase() !== "tbd" ? value : ""
  ].filter(Boolean);

  return displayParts.length ? displayParts.join(" · ") : "TBD";
}

function buildFeatureCards(rows, latestYear) {
  const champion = getAward(rows, latestYear, "League Champion");
  const regularSeason = getAward(rows, latestYear, "Regular Season Winner");
  const mostPoints = getAward(rows, latestYear, "Most Points");
  const theSco = getAward(rows, latestYear, "The Sco");

  setText("trophy-latest-champion", `${latestYear || "Latest"} · ${getAwardDisplay(champion)}`);
  setText("trophy-regular-season-winner", `${latestYear || "Latest"} · ${getAwardDisplay(regularSeason)}`);
  setText("trophy-most-points", `${latestYear || "Latest"} · ${getAwardDisplay(mostPoints)}`);
  setText("trophy-the-sco", `${latestYear || "Latest"} · ${getAwardDisplay(theSco)}`);
}

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
      icon: "💀",
      className: "shame-award",
      description: "Last place. Basement resident. Permanent history."
    }
  ];

  grid.innerHTML = "";

  awards.forEach(award => {
    const row = getAward(rows, latestYear, award.name);
    const card = document.createElement("div");
    card.className = `award-cabinet-card ${award.className}`.trim();

    card.innerHTML = `
      <span>${award.icon}</span>
      <h3>${award.name}</h3>
      <p>${award.description}</p>
      <strong>${latestYear || "Latest"}: ${getAwardDisplay(row)}</strong>
    `;

    grid.appendChild(card);
  });
}

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
    const card = document.createElement("div");
    card.className = "award-cabinet-card";

    card.innerHTML = `
      <span>${award.icon}</span>
      <h3>${award.name}</h3>
      <p>${award.description}</p>
      <strong>${latestYear || "Latest"}: ${getAwardDisplay(row)}</strong>
    `;

    grid.appendChild(card);
  });
}

function buildMiniGames(miniGames) {
  const list = document.getElementById("mini-games-list");
  if (!list) return;

  if (!miniGames || miniGames.length === 0) {
    list.innerHTML = `
      <div class="record-item">
        <strong>Mini Games</strong>
        <span>No mini game data entered yet.</span>
      </div>
    `;
    return;
  }

  const sortedGames = [...miniGames].sort((a, b) => {
    return Number(b.year) - Number(a.year) || cleanText(a.game).localeCompare(cleanText(b.game));
  });

  list.innerHTML = "";

  sortedGames.slice(0, 8).forEach(row => {
    const item = document.createElement("div");
    item.className = "record-item";

    const year = cleanText(row.year) || "TBD";
    const game = cleanText(row.game) || "Mini Game";
    const team = cleanText(row.winner_team);
    const winner = cleanText(row.winner_name);
    const result = cleanText(row.result);

    const details = [
      team && team.toLowerCase() !== "tbd" ? team : "",
      winner && winner.toLowerCase() !== "tbd" ? winner : "",
      result && result.toLowerCase() !== "tbd" ? result : ""
    ].filter(Boolean).join(" · ");

    item.innerHTML = `
      <strong>${year} · ${game}</strong>
      <span>${details || "TBD"}</span>
    `;

    list.appendChild(item);
  });
}

function buildYearByYearAwards(rows, miniGames, years) {
  const body = document.getElementById("yearly-awards-body");
  if (!body) return;

  if (!years || years.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7">No award history entered yet.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = "";

  years.forEach(year => {
    const champion = getAward(rows, year, "League Champion");
    const runnerUp = getAward(rows, year, "Runner-Up");
    const regularSeason = getAward(rows, year, "Regular Season Winner");
    const mostPoints = getAward(rows, year, "Most Points");
    const theSco = getAward(rows, year, "The Sco");

    const yearMiniGames = miniGames.filter(row => cleanText(row.year) === cleanText(year));
    const miniGameSummary = yearMiniGames.length
      ? yearMiniGames.map(row => `${cleanText(row.game)}: ${getMiniGameDisplay(row)}`).join(" / ")
      : "TBD";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${year}</td>
      <td>${getAwardDisplay(champion)}</td>
      <td>${getAwardDisplay(runnerUp)}</td>
      <td>${getAwardDisplay(regularSeason)}</td>
      <td>${getAwardDisplay(mostPoints)}</td>
      <td>${getAwardDisplay(theSco)}</td>
      <td>${miniGameSummary}</td>
    `;

    body.appendChild(tr);
  });
}

function getMiniGameDisplay(row) {
  const team = cleanText(row.winner_team);
  const winner = cleanText(row.winner_name);
  const result = cleanText(row.result);

  const parts = [
    team && team.toLowerCase() !== "tbd" ? team : "",
    winner && winner.toLowerCase() !== "tbd" ? winner : "",
    result && result.toLowerCase() !== "tbd" ? result : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "TBD";
}

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
    const card = document.createElement("div");
    card.className = "award-cabinet-card";

    card.innerHTML = `
      <span>${award.icon}</span>
      <h3>${award.name}</h3>
      <p>${award.description}</p>
      <strong>${latestYear || "Latest"}: ${getAwardDisplay(row)}</strong>
    `;

    grid.appendChild(card);
  });
}

function showTrophyError() {
  const grids = [
    "major-awards-grid",
    "season-awards-grid",
    "fun-awards-grid"
  ];

  grids.forEach(id => {
    const grid = document.getElementById(id);

    if (grid) {
      grid.innerHTML = `
        <div class="award-cabinet-card">
          <span>⚠️</span>
          <h3>Data Not Loaded</h3>
          <p>Check data/trophy-room.csv, data-loader.js, and trophy-room.js.</p>
          <strong>Error</strong>
        </div>
      `;
    }
  });

  const list = document.getElementById("mini-games-list");

  if (list) {
    list.innerHTML = `
      <div class="record-item">
        <strong>Mini Games Not Loaded</strong>
        <span>Check data/mini-games.csv.</span>
      </div>
    `;
  }

  const body = document.getElementById("yearly-awards-body");

  if (body) {
    body.innerHTML = `
      <tr>
        <td colspan="7">Award history failed to load.</td>
      </tr>
    `;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

buildTrophyRoomPage();
