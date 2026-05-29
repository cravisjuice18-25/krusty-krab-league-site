async function buildTeamPage() {
  try {
    const ownerId = getOwnerIdFromUrl();

    if (!ownerId) {
      showTeamError("No owner selected", "Go back to the Teams page and select a franchise.");
      return;
    }

    const teams = await loadCSV("data/teams.csv");
    const standings = await loadCSV("data/standings.csv");
    const teamPlayers = await loadCSV("data/team-players.csv");
    const teamH2H = await loadCSV("data/team-h2h.csv");

    const team = teams.find(row => {
      return cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase();
    });

    if (!team) {
      showTeamError("Franchise not found", `No franchise was found for owner: ${ownerId}`);
      return;
    }

    const ownerStandings = standings
      .filter(row => cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase())
      .sort((a, b) => Number(b.year) - Number(a.year));

    const ownerPlayers = teamPlayers.filter(row => {
      return cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase();
    });

    const ownerH2H = teamH2H.filter(row => {
      return cleanText(row.owner_id).toLowerCase() === ownerId.toLowerCase();
    });

    buildTeamIdentity(team);
    buildTeamSnapshot(team, ownerStandings);
    buildSeasonHistory(ownerStandings);
    buildBestWorstSeasons(ownerStandings);
    buildTopPlayerSeasons(ownerPlayers);
    buildHeadToHead(ownerH2H);
    buildTemporarySections(team);

  } catch (error) {
    console.error("Team page error:", error);
    showTeamError(
      "Team page error",
      "Check data/teams.csv, data/standings.csv, data/team-players.csv, data/team-h2h.csv, data-loader.js, and team.js."
    );
  }
}

function getOwnerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return cleanText(params.get("owner"));
}

function buildTeamIdentity(team) {
  const primaryColor = cleanColor(team.primary_color, "#001f3f");
  const secondaryColor = cleanColor(team.secondary_color, "#ffffff");
  const decalColor = cleanColor(team.decal_color, "#facc15");

  const teamName = cleanText(team.team_name) || "Franchise Profile";
  const owner = cleanText(team.owner) || "TBD";
  const location = cleanText(team.location) || "TBD";
  const status = cleanText(team.status) || "Active";
  const tagline = cleanText(team.tagline) || "Franchise details coming soon.";

  const primaryLogo = cleanText(team.primary_logo) || "images/team-primary-logo-placeholder.png";
  const secondaryLogo = cleanText(team.secondary_logo) || "images/team-secondary-logo-placeholder.png";
  const uniformImage = cleanText(team.uniform_image) || "images/team-uniform-placeholder.png";

  document.title = `${teamName} | Krusty Krab League`;

  const hero = document.getElementById("team-hero");

  if (hero) {
    hero.style.setProperty("--team-color", primaryColor);
    hero.style.setProperty("--primary-color", primaryColor);
    hero.style.setProperty("--secondary-color", secondaryColor);
    hero.style.setProperty("--decal-color", decalColor);
  }

  setText("team-name", teamName);
  setText("team-tagline", tagline);
  setText("team-owner", `Owner: ${owner}`);
  setText("team-location", `Location: ${location}`);
  setText("team-status", `${status} Franchise`);

  setText("team-story-title", `About ${teamName}`);
  setText("team-story", buildStoryText(teamName, owner, tagline));

  setImage("team-primary-logo", primaryLogo, `${teamName} logo`);
  setImage("team-brand-primary-logo", primaryLogo, `${teamName} primary logo`);
  setImage("team-brand-secondary-logo", secondaryLogo, `${teamName} secondary logo`);
  setImage("team-uniform-image", uniformImage, `${teamName} uniform`);

  setText("team-uniform-title", `${teamName} Uniform`);
  setText("team-footer", `Krusty Krab League · ${teamName}`);
}

function buildTeamSnapshot(team, ownerStandings) {
  const record = calculateLifetimeRecord(ownerStandings);
  const titles = cleanText(team.titles) || "TBD";
  const playoffAppearances = cleanText(team.playoff_appearances) || "TBD";

  setText("team-lifetime-record", record);
  setText("team-win-pct", calculateWinPct(record));
  setText("team-titles", titles);
  setText("team-playoffs", playoffAppearances);

  setText("team-sco-finishes", cleanText(team.sco_finishes) || calculateScoFinishes(ownerStandings));
  setText("team-average-finish", cleanText(team.average_finish) || calculateAverageFinish(ownerStandings));
  setText("team-all-play-record", cleanText(team.all_play_record) || "TBD");
  setText("team-top-week-count", cleanText(team.top_week_count) || "TBD");

  setText("team-trophy-championships", titles);
  setText("team-pain-sco-finishes", cleanText(team.sco_finishes) || calculateScoFinishes(ownerStandings));
}

function buildSeasonHistory(ownerStandings) {
  const seasonBody = document.getElementById("team-season-history-body");

  if (!seasonBody) return;

  if (ownerStandings.length === 0) {
    seasonBody.innerHTML = `
      <tr>
        <td colspan="8">No season history found for this franchise.</td>
      </tr>
    `;
    return;
  }

  seasonBody.innerHTML = "";

  ownerStandings.forEach(row => {
    const tableRow = document.createElement("tr");

    tableRow.innerHTML = `
      <td>${cleanText(row.year)}</td>
      <td><strong>${cleanText(row.team)}</strong></td>
      <td>${ordinal(cleanText(row.rank))}</td>
      <td>${cleanText(row.record)}</td>
      <td>${formatNumber(row.points_for)}</td>
      <td>${formatNumber(row.team_rating)}</td>
      <td>${getPlayoffText(row.rank)}</td>
      <td>${getSeasonResult(row.rank)}</td>
    `;

    seasonBody.appendChild(tableRow);
  });
}

function buildBestWorstSeasons(ownerStandings) {
  if (!ownerStandings || ownerStandings.length === 0) return;

  const bestFinish = [...ownerStandings].sort((a, b) => Number(a.rank) - Number(b.rank))[0];

  const bestScoring = [...ownerStandings].sort((a, b) => {
    return Number(b.points_for) - Number(a.points_for);
  })[0];

  const bestRating = [...ownerStandings].sort((a, b) => {
    return Number(b.team_rating) - Number(a.team_rating);
  })[0];

  const worstFinish = [...ownerStandings].sort((a, b) => Number(b.rank) - Number(a.rank))[0];

  if (bestFinish) {
    setText(
      "team-best-season",
      `${bestFinish.year} · ${cleanText(bestFinish.team)} · ${ordinal(bestFinish.rank)} place · ${cleanText(bestFinish.record)}`
    );
  }

  if (bestScoring) {
    setText(
      "team-best-scoring-season",
      `${bestScoring.year} · ${formatNumber(bestScoring.points_for)} points · ${formatNumber(bestScoring.avg_for)} average`
    );
  }

  if (bestRating) {
    setText(
      "team-most-painful-finish",
      `${bestRating.year} · Best rating season: ${formatNumber(bestRating.team_rating)} · Finished ${ordinal(bestRating.rank)}`
    );
  }

  if (worstFinish) {
    setText(
      "team-worst-season",
      `${worstFinish.year} · ${cleanText(worstFinish.team)} · ${ordinal(worstFinish.rank)} place · ${cleanText(worstFinish.record)}`
    );
  }
}

function buildTopPlayerSeasons(ownerPlayers) {
  const list = document.getElementById("team-top-player-list");

  if (!list) return;

  if (!ownerPlayers || ownerPlayers.length === 0) {
    list.innerHTML = `
      <div class="record-item">
        <strong>Top Player Seasons</strong>
        <span>No player season data found yet.</span>
      </div>
    `;
    return;
  }

  const positionOrder = ["QB", "RB", "WR", "TE"];

  const sortedPlayers = [...ownerPlayers].sort((a, b) => {
    const aIndex = positionOrder.indexOf(cleanText(a.position));
    const bIndex = positionOrder.indexOf(cleanText(b.position));

    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  list.innerHTML = "";

  sortedPlayers.forEach(row => {
    const item = document.createElement("div");
    item.className = "record-item";

    const position = cleanText(row.position) || "Position";
    const player = cleanText(row.player) || "TBD";
    const nflTeam = cleanText(row.nfl_team);
    const points = cleanText(row.points) || "TBD";
    const year = cleanText(row.year) || "TBD";
    const notes = cleanText(row.notes);

    item.innerHTML = `
      <strong>Best ${position} Season</strong>
      <span>${player}${nflTeam ? ` · ${nflTeam}` : ""} · ${formatNumber(points)} points · ${year}${notes ? ` · ${notes}` : ""}</span>
    `;

    list.appendChild(item);
  });
}

function buildHeadToHead(ownerH2H) {
  const h2hBody = document.getElementById("team-h2h-body");

  if (!h2hBody) return;

  if (!ownerH2H || ownerH2H.length === 0) {
    h2hBody.innerHTML = `
      <tr>
        <td colspan="7">No head-to-head records found for this franchise yet.</td>
      </tr>
    `;
    return;
  }

  const sortedH2H = [...ownerH2H].sort((a, b) => {
    return cleanText(a.opponent_name).localeCompare(cleanText(b.opponent_name));
  });

  h2hBody.innerHTML = "";

  sortedH2H.forEach(row => {
    const tableRow = document.createElement("tr");

    tableRow.innerHTML = `
      <td><strong>${cleanText(row.opponent_name) || "TBD"}</strong></td>
      <td>${cleanText(row.record) || "TBD"}</td>
      <td>${formatWinPct(row.win_pct)}</td>
      <td>${formatNumber(row.points_for)}</td>
      <td>${formatNumber(row.points_against)}</td>
      <td>${cleanText(row.best_win) || "TBD"}</td>
      <td>${cleanText(row.worst_loss) || "TBD"}</td>
    `;

    h2hBody.appendChild(tableRow);
  });
}

function buildTemporarySections(team) {
  const teamName = cleanText(team.team_name) || "This franchise";
  const recordsList = document.getElementById("team-records-held-list");

  if (recordsList) {
    recordsList.innerHTML = `
      <div class="record-item">
        <strong>Records Held</strong>
        <span>League records for ${teamName} will load here once we add team records data.</span>
      </div>
    `;
  }
}

function calculateLifetimeRecord(ownerStandings) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  ownerStandings.forEach(row => {
    const record = cleanText(row.record);
    const parts = record.split("-").map(Number);

    if (parts.length >= 2) {
      wins += Number(parts[0]) || 0;
      losses += Number(parts[1]) || 0;
      ties += Number(parts[2]) || 0;
    }
  });

  if (wins === 0 && losses === 0 && ties === 0) return "TBD";

  if (ties > 0) {
    return `${wins}-${losses}-${ties}`;
  }

  return `${wins}-${losses}`;
}

function calculateScoFinishes(ownerStandings) {
  const scoCount = ownerStandings.filter(row => Number(row.rank) === 8).length;
  return scoCount || "0";
}

function calculateAverageFinish(ownerStandings) {
  const finishes = ownerStandings
    .map(row => Number(row.rank))
    .filter(value => !Number.isNaN(value));

  if (finishes.length === 0) return "TBD";

  const average = finishes.reduce((sum, value) => sum + value, 0) / finishes.length;

  return average.toFixed(2);
}

function getPlayoffText(rank) {
  const numericRank = Number(rank);

  if (Number.isNaN(numericRank)) return "TBD";

  return numericRank <= 4 ? "Yes" : "No";
}

function getSeasonResult(rank) {
  const numericRank = Number(rank);

  if (Number.isNaN(numericRank)) return "TBD";

  if (numericRank === 1) return "Regular Season Winner";
  if (numericRank === 8) return "The Sco";
  if (numericRank <= 4) return "Playoff Team";

  return "Missed Playoffs";
}

function buildStoryText(teamName, owner, tagline) {
  return `${teamName} is owned by ${owner}. ${tagline}`;
}

function showTeamError(title, message) {
  setText("team-name", title);
  setText("team-tagline", message);
  setText("team-story-title", title);
  setText("team-story", message);

  const seasonBody = document.getElementById("team-season-history-body");

  if (seasonBody) {
    seasonBody.innerHTML = `
      <tr>
        <td colspan="8">${message}</td>
      </tr>
    `;
  }
}

function calculateWinPct(record) {
  const cleaned = cleanText(record);

  if (!cleaned || cleaned === "TBD") return "TBD";

  const parts = cleaned.split("-").map(Number);

  const wins = Number(parts[0]) || 0;
  const losses = Number(parts[1]) || 0;
  const ties = Number(parts[2]) || 0;

  const total = wins + losses + ties;

  if (!total) return "TBD";

  return ((wins + ties * 0.5) / total).toFixed(3).replace("0.", ".");
}

function formatWinPct(value) {
  const cleaned = cleanText(value);

  if (!cleaned || cleaned === "TBD") return "TBD";

  const number = Number(cleaned);

  if (Number.isNaN(number)) {
    return cleaned;
  }

  return number.toFixed(2);
}

function ordinal(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return cleanText(value) || "TBD";

  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = number % 100;

  return number + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function setImage(id, src, altText) {
  const image = document.getElementById(id);

  if (image) {
    image.src = src;
    image.alt = altText;
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanColor(value, fallback) {
  let color = cleanText(value);

  if (!color) return fallback;

  color = color.replace(/\s/g, "");

  if (!color.startsWith("#")) {
    color = `#${color}`;
  }

  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);

  return isValidHex ? color : fallback;
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

buildTeamPage();
