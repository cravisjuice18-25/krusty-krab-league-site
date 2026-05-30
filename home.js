const UPCOMING_DRAFT_DATE = "2026-09-05T12:00:00";
const UPCOMING_DRAFT_LOCATION = "Sparrow Bush, NY";

async function buildHomePage() {
  try {
    const champions = await loadCSV("data/champions.csv");
    const scoHistory = await loadCSV("data/the-sco.csv");
    const teams = await loadCSV("data/teams.csv");
    const standings = await loadCSV("data/standings.csv");

    let allTimePlayers = [];

    try {
      allTimePlayers = await loadCSV("data/all-time-players.csv");
    } catch (error) {
      console.warn("all-time-players.csv did not load:", error);
      allTimePlayers = [];
    }

    buildLatestChampion(champions);
    buildLatestSco(scoHistory);
    buildTeamsCount(teams);
    buildLatestSeasonSnapshot(standings);
    buildAllTimePlayerCards(allTimePlayers);
    buildDraftCountdown();

  } catch (error) {
    console.error("Home page error:", error);
    buildDraftCountdown();
  }
}

function buildLatestChampion(champions) {
  const sorted = [...champions].sort((a, b) => Number(b.year) - Number(a.year));
  const latest = sorted[0];

  if (!latest) return;

  setText("home-latest-champion-year", `${latest.year} Champion`);
  setText("home-latest-champion-team", latest.champion || "TBD");
  setText("home-latest-champion-link", "View championship history");
}

function buildLatestSco(scoHistory) {
  const sorted = [...scoHistory].sort((a, b) => Number(b.year) - Number(a.year));
  const latest = sorted[0];

  if (!latest) return;

  setText("home-latest-sco-title", "The Sco");
  setText("home-latest-sco-team", `${latest.year}: ${latest.team || "TBD"}`);
  setText("home-latest-sco-link", "View last-place history");
}

function buildTeamsCount(teams) {
  const activeTeams = teams.filter(team => {
    return cleanText(team.status).toLowerCase() === "active";
  });

  setText("home-active-team-count", `${activeTeams.length} active franchises, owners, defunct teams, and future franchise pages.`);
}

function buildLatestSeasonSnapshot(standings) {
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
    setText("home-season-details", `Latest season: ${firstPlace.team || "TBD"} finished 1st`);
    setText("home-season-details-expanded", `${firstPlace.team || "TBD"} · ${firstPlace.record || "TBD"} · 1st Place`);
  }

  if (topScoringTeam) {
    setText("home-record-book-summary", `Latest points leader: ${topScoringTeam.team || "TBD"}`);
    setText("home-season-points-leader", `${topScoringTeam.team || "TBD"} · ${formatNumber(topScoringTeam.points_for)} points`);
  }
}

function buildAllTimePlayerCards(allTimePlayers) {
  const grid = document.getElementById("all-time-player-grid");

  if (!grid) return;

  const positionOrder = ["QB", "RB", "WR", "TE"];

  const featuredPlayers = positionOrder.map(position => {
    return allTimePlayers.find(row => {
      return cleanText(row.position).toUpperCase() === position &&
        cleanText(row.record_type).toLowerCase().includes("season");
    });
  }).filter(Boolean);

  if (featuredPlayers.length === 0) {
    grid.innerHTML = `
      <article class="player-card player-card-qb">
        <div class="player-card-top">
          <span>QB</span>
        </div>

        <div class="player-card-body">
          <div class="player-card-position">Quarterback</div>
          <h3>Coming Soon</h3>
          <p>All-time player cards will appear once real data is added.</p>
          <div class="player-card-medal">TBD</div>
        </div>

        <div class="player-card-footer">
          <strong>League Legends</strong>
        </div>
      </article>
    `;
    return;
  }

  grid.innerHTML = "";

  featuredPlayers.forEach(row => {
    const card = document.createElement("article");

    const position = cleanText(row.position).toUpperCase();
    const player = cleanText(row.player) || "TBD";
    const nflTeam = cleanText(row.nfl_team) || "TBD";
    const points = cleanText(row.points) || "TBD";
    const year = cleanText(row.year) || "TBD";
    const fantasyTeam = cleanText(row.fantasy_team) || "TBD";
    const recordType = cleanText(row.record_type) || `Best ${position} Season`;

    card.className = `player-card player-card-${position.toLowerCase()}`;

    card.innerHTML = `
      <div class="player-card-top">
        <span>${getPositionLabel(position)}</span>
      </div>

      <div class="player-card-body">
        <div class="player-card-position">${recordType}</div>
        <h3>${player}</h3>
        <p>${nflTeam} · ${formatNumber(points)} points · ${year}</p>
        <div class="player-card-medal">${position}</div>
      </div>

      <div class="player-card-footer">
        <strong>${fantasyTeam}</strong>
      </div>
    `;

    grid.appendChild(card);
  });
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
  const number = Number(value);

  if (Number.isNaN(number)) {
    return cleanText(value) || "TBD";
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

buildHomePage();
