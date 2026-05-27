async function loadCSV(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  const text = await response.text();
  return parseCSV(text);
}

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue.trim());
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
      }

      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentValue += char;
    }
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }

  const headers = rows[0].map(header => header.trim());

  return rows.slice(1)
    .filter(row => row.some(value => value !== ""))
    .map(row => {
      const item = {};

      headers.forEach((header, index) => {
        item[header] = row[index] || "";
      });

      return item;
    });
}

function getNumber(value) {
  return Number(value || 0);
}

function winPercentage(team) {
  const wins = getNumber(team.wins);
  const losses = getNumber(team.losses);
  const ties = getNumber(team.ties);
  const games = wins + losses + ties;

  if (games === 0) return 0;

  return (wins + ties * 0.5) / games;
}

function formatWinPct(value) {
  return value.toFixed(3).replace("0.", ".");
}

function formatRecord(team) {
  const wins = getNumber(team.wins);
  const losses = getNumber(team.losses);
  const ties = getNumber(team.ties);

  if (ties > 0) {
    return `${wins}-${losses}-${ties}`;
  }

  return `${wins}-${losses}`;
}

function getInitials(name) {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function buildHomepage() {
  try {
    const teams = await loadCSV("data/teams.csv");
    const champions = await loadCSV("data/champions.csv");
    const updates = await loadCSV("data/updates.csv");
    const records = await loadCSV("data/records.csv");

    buildChampionSection(champions);
    buildLeagueSnapshot(teams, champions);
    buildStandingsTable(teams);
    buildUpdates(updates);
    buildTeamCards(teams);
    buildRecords(records);

  } catch (error) {
    console.error(error);
  }
}

function buildChampionSection(champions) {
  const sortedChampions = [...champions].sort((a, b) => {
    return getNumber(b.year) - getNumber(a.year);
  });

  const latestChampion = sortedChampions[0];

  if (!latestChampion) return;

  document.getElementById("current-champion").textContent =
    `${latestChampion.champion}`;

  document.getElementById("current-champion-details").textContent =
    `${latestChampion.year} Champion · Defeated ${latestChampion.runner_up} ${latestChampion.score}. ${latestChampion.note}`;
}

function buildLeagueSnapshot(teams, champions) {
  const sortedByTitles = [...teams].sort((a, b) => {
    return getNumber(b.championships) - getNumber(a.championships);
  });

  const sortedByWinPct = [...teams].sort((a, b) => {
    return winPercentage(b) - winPercentage(a);
  });

  const seasons = new Set(champions.map(row => row.year).filter(Boolean));

  const mostTitlesTeam = sortedByTitles[0];
  const bestWinPctTeam = sortedByWinPct[0];

  document.getElementById("total-teams").textContent = teams.length;
  document.getElementById("total-seasons").textContent = seasons.size;

  document.getElementById("most-titles").textContent =
    `${mostTitlesTeam.team_name} (${mostTitlesTeam.championships})`;

  document.getElementById("best-win-pct").textContent =
    `${bestWinPctTeam.team_name} ${formatWinPct(winPercentage(bestWinPctTeam))}`;
}

function buildStandingsTable(teams) {
  const sortedTeams = [...teams].sort((a, b) => {
    return winPercentage(b) - winPercentage(a);
  });

  const table = document.getElementById("standings-table");
  table.innerHTML = "";

  sortedTeams.forEach((team, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${team.team_name}</strong></td>
      <td>${team.owner}</td>
      <td>${formatRecord(team)}</td>
      <td>${formatWinPct(winPercentage(team))}</td>
      <td>${team.championships}</td>
    `;

    table.appendChild(row);
  });
}

function buildUpdates(updates) {
  const sortedUpdates = [...updates].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  const list = document.getElementById("updates-list");
  list.innerHTML = "";

  sortedUpdates.slice(0, 5).forEach(update => {
    const item = document.createElement("div");
    item.className = "update-item";

    item.innerHTML = `
      <strong>${update.title}</strong>
      <span>${update.date} · ${update.description}</span>
    `;

    list.appendChild(item);
  });
}

function buildTeamCards(teams) {
  const sortedTeams = [...teams].sort((a, b) => {
    return getNumber(b.championships) - getNumber(a.championships);
  });

  const grid = document.getElementById("team-grid");
  grid.innerHTML = "";

  sortedTeams.forEach(team => {
    const card = document.createElement("div");
    card.className = "team-card";

    const logoHtml = team.logo
      ? `<img src="${team.logo}" alt="${team.team_name} logo">`
      : `<span>${getInitials(team.team_name)}</span>`;

    card.innerHTML = `
      <div class="team-card-logo">
        ${logoHtml}
      </div>

      <h3>${team.team_name}</h3>
      <p>Owner: ${team.owner}</p>
      <p>Record: ${formatRecord(team)}</p>
      <p>Win %: ${formatWinPct(winPercentage(team))}</p>
      <p>Titles: ${team.championships}</p>
    `;

    grid.appendChild(card);
  });
}

function buildRecords(records) {
  const list = document.getElementById("records-list");
  list.innerHTML = "";

  records.slice(0, 6).forEach(record => {
    const item = document.createElement("div");
    item.className = "record-item";

    item.innerHTML = `
      <strong>${record.record_name}</strong>
      <span>${record.holder} · ${record.value} · ${record.year}</span>
    `;

    list.appendChild(item);
  });
}

buildHomepage();
