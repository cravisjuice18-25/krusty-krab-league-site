async function buildTeamsPage() {
  try {
    const teams = await loadCSV("data/teams.csv");

    const activeTeams = teams
      .filter(team => cleanText(team.status).toLowerCase() === "active")
      .sort((a, b) => cleanText(a.team_name).localeCompare(cleanText(b.team_name)));

    const inactiveTeams = teams
      .filter(team => cleanText(team.status).toLowerCase() === "inactive")
      .sort((a, b) => cleanText(a.team_name).localeCompare(cleanText(b.team_name)));

    buildActiveTeams(activeTeams);
    buildInactiveTeams(inactiveTeams);

  } catch (error) {
    console.error("Teams page error:", error);

    const activeGrid = document.getElementById("active-teams-grid");
    const inactiveGrid = document.getElementById("inactive-teams-grid");

    if (activeGrid) {
      activeGrid.innerHTML = `
        <article class="franchise-card" style="--team-color: #111827; --primary-color: #111827; --secondary-color: #f9fafb; --decal-color: #facc15;">
          <div class="franchise-card-body">
            <p class="section-label">Error</p>
            <h3>Teams Not Loaded</h3>
            <p class="franchise-tagline">Check data/teams.csv, data-loader.js, and teams.js.</p>
          </div>
        </article>
      `;
    }

    if (inactiveGrid) {
      inactiveGrid.innerHTML = "";
    }
  }
}

function buildActiveTeams(activeTeams) {
  const activeGrid = document.getElementById("active-teams-grid");
  activeGrid.innerHTML = "";

  activeTeams.forEach(team => {
    const primaryColor = cleanColor(team.primary_color, "#001f3f");
    const secondaryColor = cleanColor(team.secondary_color, "#ffffff");
    const decalColor = cleanColor(team.decal_color, "#facc15");
    const teamPage = cleanText(team.team_page) || `team.html?team=${cleanText(team.team_id)}`;

    const card = document.createElement("article");
    card.className = "franchise-card";

    card.style.setProperty("--team-color", primaryColor);
    card.style.setProperty("--primary-color", primaryColor);
    card.style.setProperty("--secondary-color", secondaryColor);
    card.style.setProperty("--decal-color", decalColor);

    card.innerHTML = `
      <div class="franchise-card-top">
        <div class="franchise-logo">
          <img src="${cleanText(team.primary_logo) || "images/team-primary-logo-placeholder.png"}" alt="${cleanText(team.team_name)} logo">
        </div>

        <div class="franchise-color-stack">
          <div class="franchise-color-dot primary-dot"></div>
          <div class="franchise-color-dot secondary-dot"></div>
          <div class="franchise-color-dot decal-dot"></div>
        </div>
      </div>

      <div class="franchise-card-body">
        <p class="section-label">Owner: ${cleanText(team.owner)}</p>
        <h3>${cleanText(team.team_name)}</h3>
        <p class="franchise-location">Location: ${cleanText(team.location) || "TBD"}</p>
        <p class="franchise-tagline">${cleanText(team.tagline) || "Franchise notes coming soon."}</p>
      </div>

      <div class="franchise-mini-stats">
        <div>
          <span>Record</span>
          <strong>${cleanText(team.record) || "TBD"}</strong>
        </div>

        <div>
          <span>Titles</span>
          <strong>${cleanText(team.titles) || "TBD"}</strong>
        </div>

        <div>
          <span>Playoffs</span>
          <strong>${cleanText(team.playoff_appearances) || "TBD"}</strong>
        </div>
      </div>

      <a class="franchise-button" href="${teamPage}">View Franchise</a>
    `;

    activeGrid.appendChild(card);
  });
}

function buildInactiveTeams(inactiveTeams) {
  const inactiveGrid = document.getElementById("inactive-teams-grid");
  inactiveGrid.innerHTML = "";

  inactiveTeams.forEach(team => {
    const card = document.createElement("article");
    card.className = "inactive-franchise-card";

    card.innerHTML = `
      <div class="inactive-badge">Inactive</div>
      <h3>${cleanText(team.team_name)}</h3>
      <p>Former Owner: ${cleanText(team.owner)}</p>
      <span>${cleanText(team.tagline) || "Legacy notes coming soon."}</span>
    `;

    inactiveGrid.appendChild(card);
  });
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

buildTeamsPage();
