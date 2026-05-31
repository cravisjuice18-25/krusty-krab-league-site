async function buildUniformsPage() {
  try {
    const teams = await loadCSV("data/teams.csv");

    const activeTeams = teams
      .filter(team => cleanText(team.status).toLowerCase() === "active")
      .sort((a, b) => cleanText(a.team_name).localeCompare(cleanText(b.team_name)));

    buildUniformFeatureCards(activeTeams);
    buildUniformLocker(activeTeams);

  } catch (error) {
    console.error("Uniforms page error:", error);

    const grid = document.getElementById("uniform-locker-grid");

    if (grid) {
      grid.innerHTML = `
        <article class="uniform-locker-card" style="--team-color: #111827; --primary-color: #111827; --secondary-color: #ffffff; --decal-color: #facc15;">
          <div class="uniform-locker-header">
            <div>
              <p class="section-label">Error</p>
              <h3>Uniforms Not Loaded</h3>
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

function buildUniformFeatureCards(activeTeams) {
  setText("uniform-active-count", `${activeTeams.length || 8} Active Franchises`);
}

function buildUniformLocker(activeTeams) {
  const grid = document.getElementById("uniform-locker-grid");

  if (!grid) return;

  if (!activeTeams || activeTeams.length === 0) {
    grid.innerHTML = `
      <article class="uniform-locker-card" style="--team-color: #111827; --primary-color: #111827; --secondary-color: #ffffff; --decal-color: #facc15;">
        <div class="uniform-locker-header">
          <div>
            <p class="section-label">Uniform Locker</p>
            <h3>No Teams Found</h3>
          </div>
        </div>

        <div class="uniform-image-panel">
          <p>No active teams were found in teams.csv.</p>
        </div>
      </article>
    `;
    return;
  }

  grid.innerHTML = "";

  activeTeams.forEach(team => {
    const primaryColor = cleanColor(team.primary_color, "#001f3f");
    const secondaryColor = cleanColor(team.secondary_color, "#ffffff");
    const decalColor = cleanColor(team.decal_color, "#facc15");

    const teamName = cleanText(team.team_name) || "Team Name";
    const owner = cleanText(team.owner) || "TBD";
    const primaryLogo = cleanText(team.primary_logo);
    const secondaryLogo = cleanText(team.secondary_logo);
    const uniformImage = cleanText(team.uniform_image);

    const card = document.createElement("article");
    card.className = "uniform-locker-card";

    card.style.setProperty("--team-color", primaryColor);
    card.style.setProperty("--primary-color", primaryColor);
    card.style.setProperty("--secondary-color", secondaryColor);
    card.style.setProperty("--decal-color", decalColor);

    card.innerHTML = `
      <div class="uniform-locker-header">
        <div>
          <p class="section-label">Owner: ${owner}</p>
          <h3>${teamName}</h3>
        </div>

        <div class="uniform-color-stack">
          <span class="uniform-color-dot primary-dot"></span>
          <span class="uniform-color-dot secondary-dot"></span>
          <span class="uniform-color-dot decal-dot"></span>
        </div>
      </div>

      <div class="uniform-assets-grid">
        ${buildAssetBox("Primary Logo", primaryLogo, `${teamName} primary logo`)}
        ${buildAssetBox("Secondary Logo", secondaryLogo, `${teamName} secondary logo`)}
      </div>

      <div class="uniform-image-panel">
        ${buildUniformImage(uniformImage, `${teamName} uniform`)}
      </div>
    `;

    grid.appendChild(card);
  });
}

function buildAssetBox(label, imagePath, altText) {
  if (!isRealImagePath(imagePath)) {
    return `
      <div class="uniform-logo-box uniform-placeholder-box">
        <span>${label}</span>
        <strong>Coming Soon</strong>
      </div>
    `;
  }

  return `
    <div class="uniform-logo-box">
      <span>${label}</span>
      <img src="${imagePath}" alt="${altText}" onerror="this.parentElement.classList.add('image-missing'); this.remove();">
    </div>
  `;
}

function buildUniformImage(imagePath, altText) {
  if (!isRealImagePath(imagePath)) {
    return `
      <div class="uniform-placeholder-large">
        <strong>Uniform Coming Soon</strong>
        <span>Add the image path in teams.csv under uniform_image.</span>
      </div>
    `;
  }

  return `
    <img src="${imagePath}" alt="${altText}" onerror="this.parentElement.innerHTML = '<div class=&quot;uniform-placeholder-large&quot;><strong>Uniform Coming Soon</strong><span>Image path not found.</span></div>';">
  `;
}

function isRealImagePath(value) {
  const text = cleanText(value).toLowerCase();

  if (!text) return false;
  if (text === "tbd") return false;
  if (text === "n/a") return false;
  if (text === "na") return false;

  return true;
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

  if (!color) return fallback;

  color = color.replace(/\s/g, "");

  if (!color.startsWith("#")) {
    color = `#${color}`;
  }

  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);

  return isValidHex ? color : fallback;
}

buildUniformsPage();
