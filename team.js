async function buildTeamPage() {
  try {
    const teamId = getTeamIdFromUrl();

    if (!teamId) {
      showTeamError("No team selected", "Go back to the Teams page and select a franchise.");
      return;
    }

    const teams = await loadCSV("data/teams.csv");

    const team = teams.find(row => {
      return cleanText(row.team_id).toLowerCase() === teamId.toLowerCase();
    });

    if (!team) {
      showTeamError("Team not found", `No team was found for: ${teamId}`);
      return;
    }

    buildTeamIdentity(team);
    buildTeamSnapshot(team);
    buildTemporarySections(team);

  } catch (error) {
    console.error("Team page error:", error);
    showTeamError("Team page error", "Check data/teams.csv, data-loader.js, and team.js.");
  }
}

function getTeamIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return cleanText(params.get("team"));
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

function buildTeamSnapshot(team) {
  const record = cleanText(team.record) || "TBD";
  const titles = cleanText(team.titles) || "TBD";
  const playoffAppearances = cleanText(team.playoff_appearances) || "TBD";

  setText("team-lifetime-record", record);
  setText("team-titles", titles);
  setText("team-playoffs", playoffAppearances);

  setText("team-win-pct", calculateWinPct(record));
  setText("team-sco-finishes", cleanText(team.sco_finishes) || "TBD");
  setText("team-average-finish", cleanText(team.average_finish) || "TBD");
  setText("team-all-play-record", cleanText(team.all_play_record) || "TBD");
  setText("team-top-week-count", cleanText(team.top_week_count) || "TBD");

  setText("team-trophy-championships", titles);
  setText("team-pain-sco-finishes", cleanText(team.sco_finishes) || "TBD");
}

function buildTemporarySections(team) {
  const teamName = cleanText(team.team_name) || "This franchise";

  const seasonBody = document.getElementById("team-season-history-body");

  if (seasonBody) {
    seasonBody.innerHTML = `
      <tr>
        <td colspan="8">
          Season history for ${teamName} will load here once we add the team season CSV.
        </td>
      </tr>
    `;
  }

  const h2hBody = document.getElementById("team-h2h-body");

  if (h2hBody) {
    h2hBody.innerHTML = `
      <tr>
        <td colspan="7">
          Head-to-head records for ${teamName} will load here once we add the H2H CSV.
        </td>
      </tr>
    `;
  }

  const recordsList = document.getElementById("team-records-held-list");

  if (recordsList) {
    recordsList.innerHTML = `
      <div class="record-item">
        <strong>Records Held</strong>
        <span>League records for ${teamName} will load here once we add the team records CSV.</span>
      </div>
    `;
  }
}

function buildStoryText(teamName, owner, tagline) {
  return `${teamName} is owned by ${owner}. ${tagline} This franchise profile will eventually include full season history, head-to-head results, player records, trophies, lowlights, and league records.`;
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

  const match = cleaned.match(/(\d+)\s*-\s*(\d+)/);

  if (!match) return "TBD";

  const wins = Number(match[1]);
  const losses = Number(match[2]);
  const total = wins + losses;

  if (!total) return "TBD";

  return (wins / total).toFixed(3).replace("0.", ".");
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

buildTeamPage();
