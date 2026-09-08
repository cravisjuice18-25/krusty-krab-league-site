async function buildHomePage() {
  try {
    const champions = await loadOptionalCSV("data/champions.csv");
    const scoHistory = await loadOptionalCSV("data/the-sco.csv");
    const teams = await loadOptionalCSV("data/teams.csv");
    const standings = await loadOptionalCSV("data/standings.csv");
    const allTimePlayers = await loadOptionalCSV("data/all-time-players.csv");

    buildHomepageIntro();
    buildFeaturedEvent();
    buildChampionSnapshot(champions);
    buildScoSnapshot(scoHistory);
    buildLeagueSnapshot(teams, standings);
    buildBestPlayers(allTimePlayers);

  } catch (error) {
    console.error("Home page error:", error);
  }
}

/* =========================================================
   EASY EDIT HOMEPAGE CONTENT
   ========================================================= */

const homepageSettings = {
  introText: "The official home for the Krusty Krab League.",

  featuredEvent: {
    label: "Opening Night",
    title: "Opening Night",
    date: "2026-09-10T20:20:00",
    description: "The Krusty Krab League season begins."
  }
};

/* =========================================================
   HOMEPAGE INTRO
   ========================================================= */

function buildHomepageIntro() {
  setTextIfExists("homepage-intro", homepageSettings.introText);
  setTextIfExists("home-intro", homepageSettings.introText);
  setTextIfExists("league-intro", homepageSettings.introText);
  setTextIfExists("hero-description", homepageSettings.introText);
  setTextIfExists("hero-subtitle", homepageSettings.introText);
}

/* =========================================================
   FEATURED EVENT / COUNTDOWN
   ========================================================= */

function buildFeaturedEvent() {
  const event = homepageSettings.featuredEvent;

  setTextIfExists("next-draft-label", event.label);
  setTextIfExists("next-draft-title", event.title);
  setTextIfExists("next-draft-description", event.description);

  setTextIfExists("featured-event-label", event.label);
  setTextIfExists("featured-event-title", event.title);
  setTextIfExists("featured-event-description", event.description);

  setTextIfExists("countdown-label", event.label);
  setTextIfExists("countdown-title", event.title);
  setTextIfExists("countdown-description", event.description);

  updateFeaturedEventCountdown(event.date);

  setInterval(() => {
    updateFeaturedEventCountdown(event.date);
  }, 1000);
}

function updateFeaturedEventCountdown(dateString) {
  const eventDate = new Date(dateString);
  const now = new Date();

  if (Number.isNaN(eventDate.getTime())) {
    setTextIfExists("next-draft-countdown", "TBD");
    setTextIfExists("featured-event-countdown", "TBD");
    setTextIfExists("countdown-timer", "TBD");
    return;
  }

  const difference = eventDate - now;

  if (difference <= 0) {
    setTextIfExists("next-draft-countdown", "It’s time.");
    setTextIfExists("featured-event-countdown", "It’s time.");
    setTextIfExists("countdown-timer", "It’s time.");
    return;
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  const countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  setTextIfExists("next-draft-countdown", countdownText);
  setTextIfExists("featured-event-countdown", countdownText);
  setTextIfExists("countdown-timer", countdownText);

  setTextIfExists("next-draft-date", formatEventDate(eventDate));
  setTextIfExists("featured-event-date", formatEventDate(eventDate));
  setTextIfExists("countdown-date", formatEventDate(eventDate));
}

function formatEventDate(date) {
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

/* =========================================================
   CHAMPION SNAPSHOT
   ========================================================= */

function buildChampionSnapshot(champions) {
  if (!champions || champions.length === 0) return;

  const validChampions = champions
    .filter(row => cleanText(row.champion).toLowerCase() !== "no winner")
    .filter(row => cleanText(row.champion).toLowerCase() !== "na")
    .sort((a, b) => Number(b.year) - Number(a.year));

  const latestChampion = validChampions[0];

  if (!latestChampion) return;

  setTextIfExists("latest-champion-year", cleanText(latestChampion.year) || "TBD");
  setTextIfExists("latest-champion-name", cleanText(latestChampion.champion) || "TBD");
  setTextIfExists("latest-champion-runner-up", cleanText(latestChampion.runner_up) || "TBD");
  setTextIfExists("latest-champion-score", cleanText(latestChampion.final_score) || "TBD");
  setTextIfExists("latest-champion-record", cleanText(latestChampion.champion_record) || "TBD");

  setTextIfExists("home-champion-year", cleanText(latestChampion.year) || "TBD");
  setTextIfExists("home-champion-name", cleanText(latestChampion.champion) || "TBD");
  setTextIfExists("home-champion-score", cleanText(latestChampion.final_score) || "TBD");
}

/* =========================================================
   THE SCO SNAPSHOT
   ========================================================= */

function buildScoSnapshot(scoHistory) {
  if (!scoHistory || scoHistory.length === 0) return;

  const sortedSco = [...scoHistory].sort((a, b) => Number(b.year) - Number(a.year));
  const latestSco = sortedSco[0];

  if (!latestSco) return;

  const scoWinner =
    cleanText(latestSco.team) ||
    cleanText(latestSco.owner_id) ||
    cleanText(latestSco.sco_loser) ||
    "TBD";

  setTextIfExists("latest-sco-year", cleanText(latestSco.year) || "TBD");
  setTextIfExists("latest-sco-name", scoWinner);
  setTextIfExists("latest-sco-record", cleanText(latestSco.regular_season_record) || "TBD");
  setTextIfExists("latest-sco-notes", cleanText(latestSco.notes) || "TBD");

  setTextIfExists("home-sco-year", cleanText(latestSco.year) || "TBD");
  setTextIfExists("home-sco-name", scoWinner);
}

/* =========================================================
   LEAGUE SNAPSHOT
   ========================================================= */

function buildLeagueSnapshot(teams, standings) {
  const activeTeams = teams
    ? teams.filter(row => cleanText(row.status).toLowerCase() === "active")
    : [];

  const totalTeams = activeTeams.length || teams.length || "TBD";

  const seasons = standings
    ? [...new Set(standings.map(row => cleanText(row.year)).filter(Boolean))]
    : [];

  const totalSeasons = seasons.length || "TBD";

  setTextIfExists("league-total-teams", totalTeams);
  setTextIfExists("league-total-seasons", totalSeasons);
  setTextIfExists("league-active-teams", totalTeams);

  const totalChampionships = getChampionshipCountFromTeams(teams);

  setTextIfExists("league-total-championships", totalChampionships);
}

function getChampionshipCountFromTeams(teams) {
  if (!teams || teams.length === 0) return "TBD";

  let count = 0;

  teams.forEach(team => {
    const titles = Number(cleanText(team.titles));

    if (!Number.isNaN(titles)) {
      count += titles;
    }
  });

  return count || "TBD";
}

/* =========================================================
   BEST PLAYER CARDS
   ========================================================= */

function buildBestPlayers(allTimePlayers) {
  if (!allTimePlayers || allTimePlayers.length === 0) return;

  buildBestPlayerByPosition(allTimePlayers, "QB", "best-qb");
  buildBestPlayerByPosition(allTimePlayers, "RB", "best-rb");
  buildBestPlayerByPosition(allTimePlayers, "WR", "best-wr");
  buildBestPlayerByPosition(allTimePlayers, "TE", "best-te");
}

function buildBestPlayerByPosition(players, position, idPrefix) {
  const positionPlayers = players.filter(row => {
    return cleanText(row.position).toUpperCase() === position;
  });

  if (positionPlayers.length === 0) return;

  const bestPlayer = [...positionPlayers].sort((a, b) => {
    return Number(b.points || b.fantasy_points || 0) - Number(a.points || a.fantasy_points || 0);
  })[0];

  if (!bestPlayer) return;

  const playerName =
    cleanText(bestPlayer.player) ||
    cleanText(bestPlayer.player_name) ||
    "TBD";

  const points =
    cleanText(bestPlayer.points) ||
    cleanText(bestPlayer.fantasy_points) ||
    "TBD";

  const year = cleanText(bestPlayer.year) || "TBD";
  const team = cleanText(bestPlayer.owner) || cleanText(bestPlayer.team) || "TBD";

  setTextIfExists(`${idPrefix}-name`, playerName);
  setTextIfExists(`${idPrefix}-points`, points === "TBD" ? "TBD" : `${formatNumber(points)} points`);
  setTextIfExists(`${idPrefix}-year`, year);
  setTextIfExists(`${idPrefix}-team`, team);
}

/* =========================================================
   HELPERS
   ========================================================= */

async function loadOptionalCSV(path) {
  try {
    return await loadCSV(path);
  } catch (error) {
    console.warn(`${path} did not load:`, error);
    return [];
  }
}

function setTextIfExists(id, value) {
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
