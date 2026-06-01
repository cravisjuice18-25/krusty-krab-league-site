async function buildScoPage() {
  try {
    const scoHistory = await loadCSV("data/the-sco.csv");
    const teams = await loadCSV("data/teams.csv");

    const sortedSco = [...scoHistory].sort((a, b) => Number(b.year) - Number(a.year));

    buildScoFeatureCards(sortedSco);
    buildScoBanners(sortedSco, teams);
    buildScoHistory(sortedSco);

  } catch (error) {
    console.error("The Sco page error:", error);

    const bannerGrid = getFirstElement([
      "sco-banners-grid",
      "the-sco-banners-grid",
      "sco-banner-grid",
      "the-sco-banner-grid"
    ]);

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="sco-banner">
          <div class="banner-content">
            <p class="section-label">Error</p>
            <h3>The Sco Not Loaded</h3>
            <p>Check data/the-sco.csv, data/teams.csv, data-loader.js, and the-sco.js.</p>
          </div>
        </article>
      `;
    }
  }
}

function buildScoFeatureCards(scoHistory) {
  const latestSco = scoHistory[0];

  if (!latestSco) return;

  setText("latest-sco-year", `${cleanText(latestSco.year)} The Sco`);
  setText("latest-sco-team", cleanText(latestSco.team));
  setText("latest-sco-details", `${cleanText(latestSco.final_record)} · ${cleanText(latestSco.avg_points_for)} avg points`);

  setText("sco-feature-year", `${cleanText(latestSco.year)} The Sco`);
  setText("sco-feature-team", cleanText(latestSco.team));
  setText("sco-feature-details", `${cleanText(latestSco.final_record)} · ${cleanText(latestSco.avg_points_for)} avg points`);
}

function buildScoBanners(scoHistory, teams) {

function buildScoHistory(scoHistory) {
  const tableBody = getFirstElement([
    "sco-history-body",
    "the-sco-history-body",
    "sco-table-body"
  ]);

  if (!tableBody) return;

  tableBody.innerHTML = "";

  scoHistory.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${cleanText(row.year)}</td>
      <td><strong>${cleanText(row.team)}</strong></td>
      <td>${cleanText(row.final_record)}</td>
      <td>${cleanText(row.final_finish)}</td>
      <td>${cleanText(row.avg_points_for)}</td>
    `;

    tableBody.appendChild(tr);
  });
}

function getOwnerColors(ownerId, teams) {
  const team = teams.find(row => {
    return cleanText(row.owner_id).toLowerCase() === ownerId;
  });

  return {
    primary: cleanColor(team ? team.primary_color : "", "#111827"),
    secondary: cleanColor(team ? team.secondary_color : "", "#ffffff"),
    decal: cleanColor(team ? team.decal_color : "", "#facc15")
  };
}

function getFirstElement(ids) {
  for (const id of ids) {
    const element = document.getElementById(id);

    if (element) {
      return element;
    }
  }

  return null;
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

  if (!color || color.toLowerCase() === "tbd" || color.toLowerCase() === "na") {
    return fallback;
  }

  color = color.replace(/\s/g, "");

  if (!color.startsWith("#")) {
    color = `#${color}`;
  }

  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);

  return isValidHex ? color : fallback;
}

buildScoPage();
