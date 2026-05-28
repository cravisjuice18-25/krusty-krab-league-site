async function buildUniformsPage() {
  try {
    const teams = await loadCSV("data/teams.csv");

    const activeTeams = teams
      .filter(team => cleanText(team.status).toLowerCase() === "active")
      .sort((a, b) => cleanText(a.team_name).localeCompare(cleanText(b.team_name)));

    buildUniformGallery(activeTeams);

  } catch (error) {
    console.error("Uniforms page error:", error);

    const grid = document.getElementById("uniform-locker-grid");

    if (grid) {
      grid.innerHTML = `
        <article class="uniform-locker-card" style="--team-color: #111827; --primary-color: #111827; --secondary-color: #f9fafb; --decal-color: #facc15;">
          <div class="uniform-locker-header">
            <div>
              <p class="section-label">Error</p>
              <h3>Uniforms CSV Not Loaded</h3>
            </div>
          </div>

          <div class="uniform-image-panel">
            <p>Check data/teams.csv, data-loader.js, and uniforms.js.</p>
          </div>
        </article>
      `;
    }
  }
}

function buildUniformGallery(teams) {
  const grid = document.getElementById("uniform-locker-grid");
  grid.innerHTML = "";

  teams.forEach(team => {
    const primaryColor = cleanColor(team.primary_color, "#001f3f");
    const secondaryColor = cleanColor(team.secondary_color, "#ffffff");
    const decalColor = cleanColor(team.decal_color, "#facc15");

    const card = document.createElement("article");
    card.className = "uniform-locker-card";

    card.style.setProperty("--team-color", primaryColor);
    card.style.setProperty("--primary-color", primaryColor);
    card.style.setProperty("--secondary-color", secondaryColor);
    card.style.setProperty("--decal-color", decalColor);

    card.innerHTML = `
      <div class="uniform-locker-header">
        <div>
          <p class="section-label">Owner: ${cleanText(team.owner)}</p>
          <h3>${cleanText(team.team_name)}</h3>
        </div>

        <div class="uniform-color-stack">
          <div class="uniform-color-chip primary-chip"></div>
          <div class="uniform-color-chip secondary-chip"></div>
          <div class="uniform-color-chip decal-chip"></div>
        </div>
      </div>

      <div class="uniform-image-panel">
        <img src="${cleanText(team.uniform_image) || "images/team-uniform-placeholder.png"}" alt="${cleanText(team.team_name)} uniform">
      </div>

      <div class="uniform-logo-row">
        <div>
          <span>Primary</span>
          <img src="${cleanText(team.primary_logo) || "images/team-primary-logo-placeholder.png"}" alt="${cleanText(team.team_name)} primary logo">
        </div>

        <div>
          <span>Secondary</span>
          <img src="${cleanText(team.secondary_logo) || "images/team-secondary-logo-placeholder.png"}" alt="${cleanText(team.team_name)} secondary logo">
        </div>
      </div>
    `;

    grid.appendChild(card);
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

buildUniformsPage();
