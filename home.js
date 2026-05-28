const UPCOMING_DRAFT_DATE = "2026-09-05T12:00:00";
const UPCOMING_DRAFT_LOCATION = "Sparrow Bush, NY";

async function buildHomePage() {
  try {
    const champions = await loadCSV("data/champions.csv");
    const scoHistory = await loadCSV("data/the-sco.csv");
    const teams = await loadCSV("data/teams.csv");
    const standings = await loadCSV("data/standings.csv");

    buildLatestChampion(champions);
    buildLatestSco(scoHistory);
    buildTeamsCount(teams);
    buildLatestSeasonSnapshot(standings);
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

buildHomePage();
