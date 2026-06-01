const UPCOMING_DRAFT_DATE = "2026-09-05T12:00:00";
const UPCOMING_DRAFT_LOCATION = "Sparrow Bush, NY";

async function buildHomePage() {
  let champions = [];
  let scoHistory = [];
  let teams = [];
  let standings = [];
  let allTimePlayers = [];

  try {
    champions = await loadCSV("data/champions.csv");
  } catch (error) {
    console.warn("champions.csv did not load:", error);
  }

  try {
    scoHistory = await loadCSV("data/the-sco.csv");
  } catch (error) {
    console.warn("the-sco.csv did not load:", error);
  }

  try {
    teams = await loadCSV("data/teams.csv");
  } catch (error) {
    console.warn("teams.csv did not load:", error);
  }

  try {
    standings = await loadCSV("data/standings.csv");
  } catch (error) {
    console.warn("standings.csv did not load:", error);
  }

  try {
    allTimePlayers = await loadCSV("data/all-time-players.csv");
  } catch (error) {
    console.warn("all-time-players.csv did not load:", error);
  }

  buildLatestChampion(champions);
  buildLatestSco(scoHistory);
  buildTeamsCount(teams);
  buildLatestSeasonSnapshot(standings);
  buildAllTimePlayerCards(allTimePlayers);
  buildDraftCountdown();
}

function buildLatestChampion(champions) {
  if (!champions || champions.length === 0) return;

  const sorted = [...champions].sort((a, b) => Number(b.year) - Number(a.year));
  const latest = sorted[0];

  if (!latest) return;

  setText("home-latest-champion-year", `${cleanText(latest.year)} Champion`);
  setText("home-latest-champion-team", cleanText(latest.champion) || "TBD");
  setText("home-latest-champion-link", "View championship history");
}

function buildLatestSco(scoHistory) {
  if (!scoHistory || scoHistory.length === 0) return;

  const sorted = [...scoHistory].sort((a, b) => Number(b.year) - Number(a.year));
  const latest = sorted[0];

  if (!latest) return;

  setText("home-latest-sco-title", "The Sco");
  setText("home-latest-sco-team", `${cleanText(latest.year)}: ${cleanText(latest.team) || "TBD"}`);
  setText("home-latest-sco-link", "View last-place history");
}

function buildTeamsCount(teams) {
  if (!teams || teams.length === 0) return;

  const activeTeams = teams.filter(team => {
    return cleanText(team.status).toLowerCase() === "active";
  });

  setText(
    "home-active-team-count",
    `${activeTeams.length} active franchises, owners, defunct teams, and future franchise pages.`
  );
}

function buildLatestSeasonSnapshot(standings) {
  if (!standings || standings.length === 0) return;

  const years = [...new Set(standings.map(row => cleanText(row.year)))]
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));

  const latestYear = years[0];

  if (!latestYear) return;

  const latestStandings = standings
    .filter(row => cleanText(row.year) === latestYear)
    .sort((a, b) => Number(a.rank) - Number(b.rank));

  const firstPlace = latestStandings[0];

  const topScoringTeam = [...latestStandings].sort((a, b) => {
    return Number(b.points_for) - Number(a.points_for);
  })[0];

  if (firstPlace) {
    setText("home-season-title", `${latestYear} Season Snapshot`);
    setText("home-season-details", `Latest season: ${cleanText(firstPlace.team) || "TBD"} finished 1st`);
    setText(
      "home-season-details-expanded",
      `${cleanText(firstPlace.team) || "TBD"} · ${cleanText(firstPlace.record) || "TBD"} · 1st Place`
    );
  }

  if (topScoringTeam) {
    setText("home-record-book-summary", `Latest points leader: ${cleanText(topScoringTeam.team) || "TBD"}`);
    setText(
      "home-season-points-leader",
      `${cleanText(topScoringTeam.team) || "TBD"} · ${formatNumber(topScoringTeam.points_for)} points`
    );
  }
}

function buildAllTimePlayerCards(allTimePlayers) {
  const grid = document.getElementById("all-time-player-grid");

  if (!grid) return;

  const positionOrder = ["QB", "RB", "WR", "TE"];

  grid.innerHTML = "";

  positionOrder.forEach(position => {
    const row = findPlayerRowByPosition(allTimePlayers, position);

    const player = row ? cleanText(row.player) : "TBD";
    const nflTeam = row ? cleanText(row.nfl_team) : "TBD";
    const points = row ? cleanText(row.points) : "TBD";
    const year = row ? cleanText(row.year) : "TBD";
    const fantasyTeam = row ? cleanText(row.fantasy_team) : "TBD";
    const recordType = row ? cleanText(row.record_type) : `Best ${position} Season`;

    const card = document.createElement("article");
    card.className = `player-card player-card-${position.toLowerCase()}`;

    card.innerHTML = `
      <div class="player-card-top">
        <span>${getPositionLabel(position)}</span>
      </div>

      <div class="player-card-body">
        <div class="player-card-position">${recordType && recordType.toLowerCase() !== "tbd" ? recordType : `Best ${position} Season`}</div>
        <h3>${player && player.toLowerCase() !== "tbd" ? player : "Coming Soon"}</h3>
        <p>${nflTeam && nflTeam.toLowerCase() !== "tbd" ? nflTeam : "NFL Team TBD"} · ${formatNumber(points)} points · ${year && year.toLowerCase() !== "tbd" ? year : "Year TBD"}</p>
        <div class="player-card-medal">${position}</div>
      </div>

      <div class="player-card-footer">
        <strong>${fantasyTeam && fantasyTeam.toLowerCase() !== "tbd" ? fantasyTeam : "League Legends"}</strong>
      </div>
    `;

    grid.appendChild(card);
  });
}

function findPlayerRowByPosition(allTimePlayers, position) {
  if (!allTimePlayers || allTimePlayers.length === 0) return null;

  return allTimePlayers.find(row => {
    const rowPosition = cleanText(row.position).toUpperCase();
    const recordType = cleanText(row.record_type).toLowerCase();

    return rowPosition === position && recordType.includes("season");
  }) || null;
}

function getPositionLabel(position) {
  const labels = {
    QB: "Quarterback",
    RB: "Running Back",
    WR: "Wide Receiver",
    TE: "Tight End",
    DST: "Defense",
    K: "Kicker"
  };

  return labels[position] || position;
}

function buildDraftCountdown() {
  updateDraftCountdown();
  setInterval(updateDraftCountdown, 60000);
}

function updateDraftCountdown() {
  const draftDate = new Date(UPCOMING_DRAFT_DATE);
  const now = new Date();
  const difference = draftDate - now;

  if (difference <= 0) {
    setText("countdown-days", "0");
    setText("countdown-hours", "0");
    setText("countdown-minutes", "0");
    return;
  }

  const totalMinutes = Math.floor(difference / 1000 / 60);
  const days = Math.floor(totalMinutes / 60 / 24);
  const hours = Math.floor((totalMinutes / 60) % 24);
  const minutes = Math.floor(totalMinutes % 60);

  setText("countdown-days", days);
  setText("countdown-hours", hours);
  setText("countdown-minutes", minutes);
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

function formatNumber(value) {
  const text = cleanText(value);

  if (!text || text.toLowerCase() === "tbd") {
    return "TBD";
  }

  const number = Number(text);

  if (Number.isNaN(number)) {
    return text;
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

buildHomePage();
