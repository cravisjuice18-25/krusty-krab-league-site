async function buildTeamsPage() {
  try {
    const teams = await loadCSV("data/teams.csv");

    const activeTeams = teams.filter(team => {
      const status = cleanText(team.status).toLowerCase();
      return status === "active";
    });

    const inactiveTeams = teams.filter(team => {
      const status = cleanText(team.status).toLowerCase();
      return status !== "active";
    });

    renderTeamsGrid(activeTeams, [
      "active-teams-grid",
      "teams-grid",
      "current-teams-grid",
      "active-franchises-grid"
    ]);

    renderTeamsGrid(inactiveTeams, [
      "inactive-teams-grid",
      "former-teams-grid",
      "retired-teams-grid",
      "inactive-franchises-grid"
    ]);

  } catch (error) {
    console.error("Teams page error:", error);

    const activeGrid = getElement([
      "active-teams-grid",
      "teams-grid",
      "current-teams-grid",
      "active-franchises-grid"
    ]);

    if (activeGrid) {
      activeGrid.innerHTML = `
        <article class="content-card">
          <p class="section-label">Teams Error</p>
          <h3>Teams could not load</h3>
          <p>Check <code>data/teams.csv</code>, <code>data-loader.js</code>, and <code>teams.js</code>.</p>
        </article>
      `;
    }
  }
}

function renderTeamsGrid(teams, possibleIds) {
  const grid = getElement(possibleIds);

  if (!grid) return;

  if (!teams || teams.length === 0) {
    grid.innerHTML = `
      <article class="content-card">
        <p class="section-label">No Teams Found</p>
        <h3>No teams loaded yet</h3>
        <p>This section is ready, but no matching teams were found in <code>data/teams.csv</code>.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("article");
    card.className = "team-card";

    const ownerId = cleanText(team.owner_id);
    const teamName = cleanText(team.team_name) || "Team Name Coming Soon";
    const owner = cleanText(team.owner) || formatOwnerName(ownerId) || "Owner Coming Soon";
    const location = cleanText(team.location) || "Location Coming Soon";
    const record = cleanText(team.record) || "Record Coming Soon";
    const titles = cleanText(team.titles) || "0";
    const playoffApps = cleanText(team.playoff_appearances) || "Coming Soon";
    const tagline = cleanText(team.tagline) || "Franchise profile under construction.";
    const primaryColor = cleanText(team.primary_color) || "#0f172a";
    const secondaryColor = cleanText(team.secondary_color) || "#1e293b";
    const decalColor = cleanText(team.decal_color) || "#facc15";
    const logo = cleanText(team.primary_logo);
    const teamPage = cleanText(team.team_page) || `team.html?owner=${ownerId}`;

    card.style.setProperty("--team-primary", primaryColor);
    card.style.setProperty("--team-secondary", secondaryColor);
    card.style.setProperty("--team-decal", decalColor);

    card.innerHTML = `
      <div class="team-card-top" style="border-color: ${decalColor};">
        <div class="team-logo-wrap">
          ${isMissing(logo)
            ? `<div class="team-logo-placeholder">${initials(teamName)}</div>`
            : `<img src="${logo}" alt="${teamName} logo">`
          }
        </div>

        <div>
          <p class="section-label">${owner}</p>
          <h3>${teamName}</h3>
          <p>${location}</p>
        </div>
      </div>

      <p class="team-tagline">${tagline}</p>

      <div class="team-card-stats">
        <div>
          <span>Record</span>
          <strong>${record}</strong>
        </div>

        <div>
          <span>Titles</span>
          <strong>${titles}</strong>
        </div>

        <div>
          <span>Playoffs</span>
          <strong>${playoffApps}</strong>
        </div>
      </div>

      <a class="button-link" href="${teamPage}">
        View Franchise
      </a>
    `;

    grid.appendChild(card);
  });
}

function getElement(ids) {
  for (const id of ids) {
    const element = document.getElementById(id);

    if (element) return element;
  }

  return null;
}

function cleanText(value) {
  return String(value || "").trim();
}

function isMissing(value) {
  const text = cleanText(value).toLowerCase();

  return (
    !text ||
    text === "tbd" ||
    text === "na" ||
    text === "n/a" ||
    text === "coming soon" ||
    text === "undefined" ||
    text === "null" ||
    text === "-"
  );
}

function initials(value) {
  const words = cleanText(value)
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return "KK";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatOwnerName(ownerId) {
  const ownerMap = {
    bard: "Bard",
    sco: "Sco",
    jake: "Jake",
    muffin: "Muffin",
    miner: "Miner",
    hunter: "Hunter",
    kyle: "Kyle",
    gary: "Gary",
    eric: "Eric",
    sabella: "Sabella",
    charlie: "Charlie",
    miller: "Miller"
  };

  return ownerMap[cleanText(ownerId).toLowerCase()] || cleanText(ownerId);
}

buildTeamsPage();
