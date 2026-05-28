async function buildHomePage() {
  try {
    const champions = await loadCSV("data/champions.csv");
    const scoHistory = await loadCSV("data/the-sco.csv");
    const teams = await loadCSV("data/teams.csv");
    const drafts = await loadCSV("data/drafts.csv");
    const standings = await loadCSV("data/standings.csv");

    buildLatestChampion(champions);
    buildLatestSco(scoHistory);
    buildDraftCard(drafts);
    buildTeamsCount(teams);
    buildLatestSeasonSnapshot(standings);

  } catch (error) {
    console.error("Home page error:", error);
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

function buildDraftCard(drafts) {
  const sorted = [...drafts].sort((a, b) => Number(b.year) - Number(a.year));
  const latest = sorted[0];

  if (!latest) return;

  setText("home-draft-title", `${latest.year} Draft`);
  setText("home-draft-details", `${latest.location || "TBD"} · 1.01 ${latest.first_pick || "TBD"}`);
  setText("home-draft-link", "View draft history");
}

function buildTeamsCount(teams) {
  const activeTeams = teams.filter(team => {
    return cleanText(team.status).toLowerCase() === "active";
  });

  setText("home-active-team-count", `${activeTeams.length} Active Franchises`);
}

function buildLatestSeasonSnapshot(standings) {
  const years = [...new Set(standings.map(row => row.year))]
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));

  const latestYear = years[0];

  if (!latestYear) return;

  const latestStandings = standings
    .filter(row => row.year === latestYear)
    .sort((a, b) => Number(a.rank) - Number(b.rank));

  const firstPlace = latestStandings[0];
  const topScoringTeam = [...latestStandings].sort((a, b) => {
    return Number(b.points_for) - Number(a.points_for);
  })[0];

  if (firstPlace) {
    setText("home-season-title", `${latestYear} Season`);
    setText("home-season-details", `1st Place: ${firstPlace.team || "TBD"}`);
  }

  if (topScoringTeam) {
    setText("home-record-book-summary", `Latest points leader: ${topScoringTeam.team || "TBD"}`);
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

buildHomePage();
