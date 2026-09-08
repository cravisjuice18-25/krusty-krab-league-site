const UPCOMING_DRAFT_DATE = "2026-09-09T20:20:00";
const UPCOMING_DRAFT_LOCATION = "Opening Night";

const HOME_INTRO_TEXT = "The official home for the Krusty Krab League.";
const UPCOMING_EVENT_LABEL = "Opening Night";

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

  buildHomeIntro();
  buildLatestChampion(champions);
  buildLatestSco(scoHistory);
  buildTeamsCount(teams);
  buildLatestSeasonSnapshot(standings);
  buildAllTimePlayerCards(allTimePlayers);
  buildDraftCountdown();
}

function buildHomeIntro() {
  setText("homepage-intro", HOME_INTRO_TEXT);
  setText("home-intro", HOME_INTRO_TEXT);
  setText("league-intro", HOME_INTRO_TEXT);
  setText("hero-description", HOME_INTRO_TEXT);
  setText("hero-subtitle", HOME_INTRO_TEXT);
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

    const imagePath = getAllTimePlayerCardImage(position);
    const cardColors = getAllTimePlayerCardColors(position);

    const card = document.createElement("article");
    card.className = `player-card player-card-${position.toLowerCase()}`;

    card.style.setProperty("--player-card-bg", cardColors.background);
    card.style.setProperty("--player-card-accent", cardColors.accent);
    card.style.setProperty("--player-card-footer", cardColors.footer);
    card.style.setProperty("--player-card-footer-text", cardColors.footerText);
    card.style.setProperty("--player-card-header-bg", cardColors.headerBg);
    card.style.setProperty("--player-card-header-text", cardColors.headerText);

    card.innerHTML = `
      <div class="player-card-header">
        ${recordType && recordType.toLowerCase() !== "tbd" ? recordType : `Best ${position} Season`}
      </div>

      <div class="player-card-image-wrap">
        <div class="player-card-image-placeholder player-card-image-filled">
          <img src="${imagePath}" alt="${position} all-time player card image" onerror="this.parentElement.textContent='${position}'">
        </div>
      </div>

      <div class="player-card-body">
        <h3>${player && player.toLowerCase() !== "tbd" ? player : "Coming Soon"}</h3>
        <p>
          ${nflTeam && nflTeam.toLowerCase() !== "tbd" ? nflTeam : "NFL Team TBD"}
          · ${formatNumber(points)} points
          · ${year && year.toLowerCase() !== "tbd" ? year : "Year TBD"}
        </p>
      </div>

      <div class="player-card-footer">
        <strong>${fantasyTeam && fantasyTeam.toLowerCase() !== "tbd" ? fantasyTeam : "League Member Team TBD"}</strong>
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

function getAllTimePlayerCardImage(position) {
  const imageMap = {
    QB: "images/all-time-player-cards-qb.png",
    RB: "images/all-time-player-cards-rb.png",
    WR: "images/all-time-player-cards-wr.png",
    TE: "images/all-time-player-cards-te.png"
  };

  return imageMap[position] || "";
}

function getAllTimePlayerCardColors(position) {
  const colorMap = {
    QB: {
      background: "rgb(227, 24, 55)",
      accent: "rgb(255, 255, 255)",
      footer: "rgb(255, 240, 243)",
      footerText: "rgb(17, 24, 39)",
      headerBg: "rgb(180, 16, 43)",
      headerText: "rgb(255, 255, 255)"
    },
    RB: {
      background: "rgb(0, 133, 202)",
      accent: "rgb(255, 255, 255)",
      footer: "rgb(235, 248, 255)",
      footerText: "rgb(17, 24, 39)",
      headerBg: "rgb(0, 103, 158)",
      headerText: "rgb(255, 255, 255)"
    },
    WR: {
      background: "rgb(0, 53, 148)",
      accent: "rgb(255, 255, 255)",
      footer: "rgb(235, 241, 255)",
      footerText: "rgb(17, 24, 39)",
      headerBg: "rgb(0, 39, 110)",
      headerText: "rgb(255, 255, 255)"
    },
    TE: {
      background: "rgb(227, 24, 55)",
      accent: "rgb(255, 255, 255)",
      footer: "rgb(255, 240, 243)",
      footerText: "rgb(17, 24, 39)",
      headerBg: "rgb(180, 16, 43)",
      headerText: "rgb(255, 255, 255)"
    }
  };

  return colorMap[position] || colorMap.QB;
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
  setText("home-next-draft-title", UPCOMING_EVENT_LABEL);
  setText("home-next-draft-location", UPCOMING_DRAFT_LOCATION);

  setText("next-draft-label", UPCOMING_EVENT_LABEL);
  setText("next-draft-title", UPCOMING_EVENT_LABEL);
  setText("next-draft-location", UPCOMING_DRAFT_LOCATION);

  setText("featured-event-label", UPCOMING_EVENT_LABEL);
  setText("featured-event-title", UPCOMING_EVENT_LABEL);
  setText("featured-event-location", UPCOMING_DRAFT_LOCATION);

  updateDraftCountdown();
  setInterval(updateDraftCountdown, 60000);
}

function updateDraftCountdown() {
  const draftDate = new Date(UPCOMING_DRAFT_DATE);
  const now = new Date();
  const difference = draftDate - now;

  if (Number.isNaN(draftDate.getTime())) {
    setText("countdown-days", "TBD");
    setText("countdown-hours", "TBD");
    setText("countdown-minutes", "TBD");
    return;
  }

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
