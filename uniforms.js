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
  setText("uniform-active-count", `${activeTeams.length} Active Franchises`);
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

    const teamName = cleanText(team.team_name) || "TBD";
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
          <p class="section-label">${owner}</p>
          <h3>${teamName}</h3>
        </div>

        <div class="uniform-color-stack" title="Primary / Secondary / Decal colors">
          <span class="uniform-color-dot primary-dot"></span>
          <span class="uniform-color-dot secondary-dot"></span>
          <span class="uniform-color-dot decal-dot"></span>
        </div>
      </div>

      <div class="uniform-assets-grid">
        ${buildAssetBox("Primary Logo", primaryLogo, `${teamName} primary logo`, initials(teamName))}
        ${buildAssetBox("Secondary Logo", secondaryLogo, `${teamName} secondary logo`, initials(teamName))}
        ${buildDecalBox("Decal", decalColor)}
      </div>

      <div class="uniform-image-panel">
        ${buildUniformImage(uniformImage, `${teamName} uniform`, teamName)}
      </div>
    `;

    grid.appendChild(card);
  });
}

function buildAssetBox(label, imagePath, altText, fallbackText) {
  if (!isRealImagePath(imagePath)) {
    return `
      <div class="uniform-logo-box uniform-placeholder-box">
        <span>${label}</span>
        <strong>${fallbackText || "TBD"}</strong>
      </div>
    `;
  }

  return `
    <div class="uniform-logo-box">
      <span>${label}</span>
      <img 
        src="${imagePath}" 
        alt="${altText}" 
        onerror="this.parentElement.classList.add('image-missing'); this.remove();"
      >
    </div>
  `;
}

function buildDecalBox(label, decalColor) {
  return `
    <div class="uniform-logo-box uniform-decal-box">
      <span>${label}</span>
      <div class="uniform-decal-preview"></div>
      <strong>${decalColor}</strong>
    </div>
  `;
}

function buildUniformImage(imagePath, altText, fallbackText) {
  if (!isRealImagePath(imagePath)) {
    return `
      <div class="uniform-placeholder-large">
        <strong>${fallbackText || "TBD"}</strong>
        <span>Uniform image: TBD</span>
      </div>
    `;
  }

  return `
    <img 
      src="${imagePath}" 
      alt="${altText}" 
      onerror="this.parentElement.innerHTML = '<div class=&quot;uniform-placeholder-large&quot;><strong>${escapeForInline(fallbackText || "TBD")}</strong><span>Uniform image: TBD</span></div>';"
    >
  `;
}

function isRealImagePath(value) {
  const text = cleanText(value).toLowerCase();

  if (!text) return false;
  if (text === "tbd") return false;
  if (text === "n/a") return false;
  if (text === "na") return false;
  if (text === "-") return false;

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

function initials(value) {
  const words = cleanText(value)
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return "TBD";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function escapeForInline(value) {
  return cleanText(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}

buildUniformsPage();
