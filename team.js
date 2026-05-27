async function buildTeamsPage() {
  try {
    const teams = await loadCSV("data/teams.csv");

    const activeTeams = teams
      .filter(team => team.status === "Active")
      .sort((a, b) => a.team_name.localeCompare(b.team_name));

    const inactiveTeams = teams
      .filter(team => team.status === "Inactive")
      .sort((a, b) => a.team_name.localeCompare(b.team_name));

    buildActiveTeams(activeTeams);
    buildInactiveTeams(inactiveTeams);

  } catch (error) {
    console.error("Teams page error:", error);

    const activeGrid = document.getElementById("active-teams-grid");
    const inactiveGrid = document.getElementById("inactive-teams-grid");

    if (activeGrid) {
      activeGrid.innerHTML = `
        <article class="franchise-card" style="--primary-color: #111827; --secondary-color: #f9fafb; --decal-color: #facc15;">
          <div class="franchise-card-body">
            <p class="section-label">Error</p>
            <h3>Teams CSV Not Loaded</h3>
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
    const card = document.createElement("article");
    card.className = "franchise-card";

    card.style.setProperty("--primary-color", team.primary_color || "#001f3f");
    card.style.setProperty("--secondary-color", team.secondary_color || "#ffffff");
    card.style.setProperty("--decal-color", team.decal_color || "#facc15");
    card.style.setProperty("--team-color", team.primary_color || "#001f3f");

    card.innerHTML = `
      <div class="franchise-card-top">
        <div class="franchise-logo">
          <img src="${team.primary_logo || "images/team-primary-logo-placeholder.png"}" alt="${team.team_name} logo">
        </div>

        <div class="franchise-color-dot"></div>
      </div>

      <div class="franchise-card-body">
        <p class="section-label">Owner: ${team.owner}</p>
        <h3>${team.team_name}</h3>
        <p class="franchise-location">Location: ${team.location || "TBD"}</p>
        <p class="franchise-tagline">${team.tagline || "Franchise notes coming soon."}</p>
      </div>

      <div class="franchise-mini-stats">
        <div>
          <span>Record</span>
          <strong>${team.record || "TBD"}</strong>
        </div>

        <div>
          <span>Titles</span>
          <strong>${team.titles || "TBD"}</strong>
        </div>

        <div>
          <span>Playoffs</span>
          <strong>${team.playoff_appearances || "TBD"}</strong>
        </div>
      </div>

      <a class="franchise-button" href="team-template.html">View Franchise</a>
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
      <h3>${team.team_name}</h3>
      <p>Former Owner: ${team.owner}</p>
      <span>${team.tagline || "Legacy notes coming soon."}</span>
    `;

    inactiveGrid.appendChild(card);
  });
}

buildTeamsPage();
