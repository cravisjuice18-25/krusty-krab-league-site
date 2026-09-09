async function buildHomePage() {
  let champions = [];
  let scoHistory = [];
  let teams = [];
  let standings = [];
  let allTimePlayers = [];
  let featuredEvent = [];
  let featuredRecords = [];
  let archiveFeature = [];

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

  try {
    featuredEvent = await loadCSV("data/home-featured-event.csv");
  } catch (error) {
    console.warn("home-featured-event.csv did not load:", error);
  }

  try {
    featuredRecords = await loadCSV("data/home-featured-records.csv");
  } catch (error) {
    console.warn("home-featured-records.csv did not load:", error);
  }

  try {
    archiveFeature = await loadCSV("data/home-archive-feature.csv");
  } catch (error) {
    console.warn("home-archive-feature.csv did not load:", error);
  }

  buildHomeIntro();
  buildLatestChampion(champions, teams);
  buildLatestSco(scoHistory, teams);
  buildTeamsCount(teams);
  buildLatestSeasonSnapshot(standings);
  buildFeaturedEvent(featuredEvent);
  buildFeaturedRecords(featuredRecords);
  buildHomeTeams(teams);
  buildArchiveFeature(archiveFeature);
  buildAllTimePlayerCards(allTimePlayers);
}

/* =========================================================
   HOME INTRO / HERO
   ========================================================= */

function buildHomeIntro() {
  setText("homepage-intro", "The official home for the Krusty Krab League.");
  setText("home-intro", "The official home for the Krusty Krab League.");
  setText("league-intro", "The official home for the Krusty Krab League.");
  setText("hero-description", "The official home for the Krusty Krab League.");
  setText("hero-subtitle", "The official home for the Krusty Krab League.");

  setText("home-league-name", "Krusty Krab League");
  setText("home-league-tagline", "The official home for the Krusty Krab League.");
  setText("home-established-line", "Established 2014");
}

/* =========================================================
   CURRENT CHAMPION
   champions.csv + teams.csv
   ========================================================= */

function buildLatestChampion(champions, teams) {
  if (!champions || champions.length === 0) return;

  const sorted = [...champions]
    .filter(row => cleanText(row.champion).toLowerCase() !== "no winner")
    .filter(row => cleanText(row.champion).toLowerCase() !== "na")
    .sort((a, b) => Number(b.year) - Number(a.year));

  const latest = sorted[0];

  if (!latest) return;

  const championOwnerId = cleanText(latest.champion_owner_id);
  const championTeam = findTeamByOwnerId(teams, championOwnerId);
  const championName = cleanText(latest.champion) || cleanText(championTeam.team_name) || "TBD";
  const ownerName = cleanText(championTeam.owner) || championName || "TBD";
  const titleCount = cleanText(championTeam.titles) || getChampionCount(champions, championOwnerId);

  setText("home-latest-champion-year", `${cleanText(latest.year)} Champion`);
  setText("home-latest-champion-team", championName);
  setText("home-latest-champion-owner", `Owner: ${ownerName}`);
  setText("home-latest-champion-count", `Championships: ${titleCount || "TBD"}`);
  setText("home-latest-champion-link", "View Champions");
}

/* =========================================================
   THE SCO
   the-sco.csv + teams.csv
   ========================================================= */

function buildLatestSco(scoHistory, teams) {
  if (!scoHistory || scoHistory.length === 0) return;

  const sorted = [...scoHistory].sort((a, b) => Number(b.year) - Number(a.year));
  const latest = sorted[0];

  if (!latest) return;

  const ownerId = cleanText(latest.owner_id);
  const scoTeam = findTeamByOwnerId(teams, ownerId);

  const teamName =
    cleanText(latest.team) ||
    cleanText(scoTeam.team_name) ||
    cleanText(latest.owner_id) ||
    "TBD";

  const scoCount = countScoFinishes(scoHistory, ownerId);

  setText("home-latest-sco-title", "The Sco");
  setText("home-latest-sco-team", `${cleanText(latest.year) || "TBD"}: ${teamName}`);
  setText("home-latest-sco-count", `Sco Count: ${scoCount}`);
  setText("home-latest-sco-link", "View The Sco");
}

/* =========================================================
   TEAMS COUNT
   teams.csv
   ========================================================= */

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

/* =========================================================
   CURRENT SEASON SNAPSHOT
   standings.csv
   ========================================================= */

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

  const standingsLeader = latestStandings.find(row => Number(row.rank) === 1) || latestStandings[0];

  const topScoringTeam = [...latestStandings].sort((a, b) => {
    return Number(b.points_for) - Number(a.points_for);
  })[0];

  const powerRatingLeader = [...latestStandings].sort((a, b) => {
    return Number(b.team_rating) - Number(a.team_rating);
  })[0];

  const currentSco = latestStandings.find(row => Number(row.rank) === 8) || latestStandings[latestStandings.length - 1];

  if (standingsLeader) {
    setText("home-season-title", `${latestYear} Season Snapshot`);
    setText("home-season-details", `Latest season: ${cleanText(standingsLeader.team) || "TBD"} finished 1st`);
    setText(
      "home-season-details-expanded",
      `${cleanText(standingsLeader.team) || "TBD"} · ${cleanText(standingsLeader.record) || "TBD"} · 1st Place`
    );
  }

  if (topScoringTeam) {
    setText("home-record-book-summary", `Latest points leader: ${cleanText(topScoringTeam.team) || "TBD"}`);
    setText(
      "home-season-points-leader",
      `${cleanText(topScoringTeam.team) || "TBD"} · ${formatNumber(topScoringTeam.points_for)} points`
    );
  }

  if (powerRatingLeader) {
    setText(
      "home-power-rating-leader",
      `${cleanText(powerRatingLeader.team) || "TBD"} · ${formatNumber(powerRatingLeader.team_rating)} rating`
    );
  }

  if (currentSco) {
    setText(
      "home-current-sco",
      `${cleanText(currentSco.team) || "TBD"} · ${ordinal(currentSco.rank)} Place`
    );
  }
}

/* =========================================================
   FEATURED EVENT
   home-featured-event.csv
   ========================================================= */

function buildFeaturedEvent(featuredEvent) {
  const event = featuredEvent && featuredEvent.length > 0 ? featuredEvent[0] : null;

  const eventLabel = event ? cleanText(event.event_label) || "Featured League Event" : "Featured League Event";
  const eventTitle = event ? cleanText(event.event_title) || "Opening Night" : "Opening Night";
  const eventSubtitle = event ? cleanText(event.event_subtitle) || "TBD" : "TBD";
  const eventDate = event ? cleanText(event.event_date) : "";
  const eventLink = event ? cleanText(event.event_link) || "seasons.html" : "seasons.html";
  const buttonText = event ? cleanText(event.button_text) || "View Event" : "View Event";

  setText("home-featured-event-label", eventLabel);
  setText("home-featured-event-title", eventTitle);
  setText("home-featured-event-subtitle", eventSubtitle);
  setText("home-featured-event-button", buttonText);

  setText("home-next-draft-title", eventTitle);
  setText("home-next-draft-location", eventSubtitle);

  setText("next-draft-label", eventLabel);
  setText("next-draft-title", eventTitle);
  setText("next-draft-location", eventSubtitle);

  setText("featured-event-label", eventLabel);
  setText("featured-event-title", eventTitle);
  setText("featured-event-location", eventSubtitle);

  const eventAnchor = document.getElementById("home-featured-event-link");

  if (eventAnchor) {
    eventAnchor.href = eventLink;
  }

  buildEventCountdown(eventDate);
}

function buildEventCountdown(eventDate) {
  updateEventCountdown(eventDate);

  setInterval(() => {
    updateEventCountdown(eventDate);
  }, 60000);
}

function updateEventCountdown(eventDate) {
  const date = new Date(eventDate);
  const now = new Date();

  if (!eventDate || Number.isNaN(date.getTime())) {
    setText("countdown-days", "TBD");
    setText("countdown-hours", "TBD");
    setText("countdown-minutes", "TBD");
    return;
  }

  const difference = date - now;

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

/* =========================================================
   FEATURED RECORDS
   home-featured-records.csv
   ========================================================= */

function buildFeaturedRecords(featuredRecords) {
  const grid = document.getElementById("home-featured-records-grid");

  if (!grid) return;

  if (!featuredRecords || featuredRecords.length === 0) {
    grid.innerHTML = `
      <div class="record-item">
        <strong>Featured Records</strong>
        <span>TBD</span>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";

  featuredRecords.slice(0, 4).forEach(record => {
    const link = cleanText(record.record_link) || "records.html";

    const card = document.createElement("a");
    card.className = "home-featured-record-card";
    card.href = link;

    card.innerHTML = `
      <span>${cleanText(record.record_title) || "Record"}</span>
      <strong>${cleanText(record.record_value) || "TBD"}</strong>
      <p>${cleanText(record.record_holder) || "TBD"}${cleanText(record.record_year) ? ` · ${cleanText(record.record_year)}` : ""}</p>
      <small>${cleanText(record.record_note) || "View record"}</small>
    `;

    grid.appendChild(card);
  });

  const firstRecord = featuredRecords[0];

  if (firstRecord) {
    setText(
      "home-record-book-summary",
      `${cleanText(firstRecord.record_title) || "Featured Record"}: ${cleanText(firstRecord.record_value) || "TBD"}`
    );
  }
}

/* =========================================================
   KKL TEAMS
   teams.csv
   ========================================================= */

function buildHomeTeams(teams) {
  const grid = document.getElementById("home-kkl-team-grid");

  if (!grid) return;

  if (!teams || teams.length === 0) {
    grid.innerHTML = `
      <div class="record-item">
        <strong>KKL Teams</strong>
        <span>TBD</span>
      </div>
    `;
    return;
  }

  const activeTeams = teams
    .filter(team => cleanText(team.status).toLowerCase() === "active")
    .sort((a, b) => cleanText(a.team_name).localeCompare(cleanText(b.team_name)));

  grid.innerHTML = "";

  activeTeams.forEach(team => {
    const ownerId = cleanText(team.owner_id);
    const primaryColor = cleanColor(team.primary_color, "#001f3f");
    const secondaryColor = cleanColor(team.secondary_color, "#111827");
    const decalColor = cleanColor(team.decal_color, "#facc15");
    const teamPage = cleanText(team.team_page) || `team.html?owner=${ownerId}`;
    const primaryLogo = getImagePath(team.primary_logo, "images/team-primary-logo-placeholder.png");

    const card = document.createElement("a");
    card.className = "home-kkl-team-card";
    card.href = teamPage;

    card.style.setProperty("--primary-color", primaryColor);
    card.style.setProperty("--secondary-color", secondaryColor);
    card.style.setProperty("--decal-color", decalColor);

    card.innerHTML = `
      <div class="home-kkl-team-logo">
        <img src="${primaryLogo}" alt="${cleanText(team.team_name) || "Team"} logo" onerror="this.src='images/team-primary-logo-placeholder.png'">
      </div>

      <div>
        <strong>${cleanText(team.team_name) || "TBD"}</strong>
        <span>${cleanText(team.owner) || "TBD"}</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* =========================================================
   FROM THE ARCHIVES
   home-archive-feature.csv
   ========================================================= */

function buildArchiveFeature(archiveFeature) {
  const feature = archiveFeature && archiveFeature.length > 0 ? archiveFeature[0] : null;

  if (!feature) return;

  const label = cleanText(feature.feature_label) || "From the Archives";
  const title = cleanText(feature.feature_title) || "Featured Memory";
  const year = cleanText(feature.feature_year);
  const description = cleanText(feature.feature_description) || "Archive feature coming soon.";
  const imagePath = getImagePath(feature.image_path, "images/archive/archive-placeholder.png");
  const link = cleanText(feature.feature_link) || "recaps.html";
  const buttonText = cleanText(feature.button_text) || "View Archive";

  setText("home-archive-label", label);
  setText("home-archive-title", year ? `${title} · ${year}` : title);
  setText("home-archive-description", description);
  setText("home-archive-link", buttonText);

  const image = document.getElementById("home-archive-image");

  if (image) {
    image.src = imagePath;
    image.alt = title;
    image.onerror = function () {
      this.src = "images/archive/archive-placeholder.png";
    };
  }

  const archiveLink = document.getElementById("home-archive-link");

  if (archiveLink) {
    archiveLink.href = link;
  }
}

/* =========================================================
   ALL-TIME PLAYER CARDS
   all-time-players.csv
   ========================================================= */

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

/* =========================================================
   HELPERS
   ========================================================= */

function findTeamByOwnerId(teams, ownerId) {
  if (!teams || teams.length === 0 || !ownerId) return {};

  return teams.find(team => {
    return cleanText(team.owner_id).toLowerCase() === ownerId.toLowerCase();
  }) || {};
}

function getChampionCount(champions, ownerId) {
  if (!champions || champions.length === 0 || !ownerId) return "TBD";

  const count = champions.filter(row => {
    return cleanText(row.champion_owner_id).toLowerCase() === ownerId.toLowerCase();
  }).length;

  return count || "TBD";
}

function countScoFinishes(scoHistory, ownerId) {
  if (!scoHistory || scoHistory.length === 0 || !ownerId) return "TBD";

  const count = scoHistory.filter(row => {
    return cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase();
  }).length;

  return count || "TBD";
}

function getImagePath(value, fallback) {
  const text = cleanText(value);

  if (!text || text.toLowerCase() === "tbd" || text.toLowerCase() === "na" || text.toLowerCase() === "n/a") {
    return fallback;
  }

  return text;
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

function cleanColor(value, fallback) {
  let color = cleanText(value);

  if (!color || color.toLowerCase() === "tbd" || color.toLowerCase() === "na" || color.toLowerCase() === "n/a") {
    return fallback;
  }

  color = color.replace(/\s/g, "");

  if (!color.startsWith("#")) {
    color = `#${color}`;
  }

  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);

  return isValidHex ? color : fallback;
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

function ordinal(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return cleanText(value) || "TBD";

  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = number % 100;

  return number + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
}

buildHomePage();
