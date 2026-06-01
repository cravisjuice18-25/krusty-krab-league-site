async function buildChampionsPage() {
  try {
    const champions = await loadCSV("data/champions.csv");
    const teams = await loadCSV("data/teams.csv");

    const sortedChampions = [...champions].sort((a, b) => Number(b.year) - Number(a.year));

    buildChampionFeatureCards(sortedChampions);
    buildChampionBanners(sortedChampions, teams);
    buildChampionshipHistory(sortedChampions);

  } catch (error) {
    console.error("Champions page error:", error);

    const bannerGrid = getFirstElement([
      "championship-banners-grid",
      "champion-banners-grid",
      "championship-banner-grid",
      "champions-banner-grid"
    ]);

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="championship-banner">
          <div class="banner-content">
            <p class="section-label">Error</p>
            <h3>Champions Not Loaded</h3>
            <p>Check data/champions.csv, data/teams.csv, data-loader.js, and champions.js.</p>
          </div>
        </article>
      `;
    }
  }
}

function buildChampionFeatureCards(champions) {
  const latestChampion = champions.find(row => {
    return cleanText(row.champion).toLowerCase() !== "no winner";
  });

  if (!latestChampion) return;

  setText("latest-champion-year", `${cleanText(latestChampion.year)} Champion`);
  setText("latest-champion-team", cleanText(latestChampion.champion));
  setText("latest-champion-details", `${cleanText(latestChampion.final_score)} · ${cleanText(latestChampion.champion_record)}`);

  setText("champion-feature-year", `${cleanText(latestChampion.year)} Champion`);
  setText("champion-feature-team", cleanText(latestChampion.champion));
  setText("champion-feature-details", `${cleanText(latestChampion.final_score)} · ${cleanText(latestChampion.champion_record)}`);
}

function buildScoBanners(scoHistory, teams) {
  const bannerGrid = getFirstElement([
    "sco-banners-grid",
    "the-sco-banners-grid",
    "sco-banner-grid",
    "the-sco-banner-grid"
  ]);

  if (!bannerGrid) return;

  bannerGrid.innerHTML = "";

  scoHistory.forEach(row => {
    const year = cleanText(row.year);
    const team = cleanText(row.team);

    const banner = document.createElement("article");
    banner.className = "sco-banner";

    banner.innerHTML = `
      <div class="banner-year">${year}</div>

      <div class="banner-content">
        <p class="section-label">The Sco</p>
        <h3>${team}</h3>
        <p>${cleanText(row.final_record) || "Final record TBD"}</p>
        <strong>${cleanText(row.avg_points_for) || "Avg points TBD"} Avg Points</strong>
      </div>
    `;

    bannerGrid.appendChild(banner);
  });
}

function buildChampionshipHistory(champions) {
  const tableBody = getFirstElement([
    "championship-history-body",
    "champions-history-body",
    "champion-history-body"
  ]);

  if (!tableBody) return;

  tableBody.innerHTML = "";

  champions.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${cleanText(row.year)}</td>
      <td><strong>${cleanText(row.champion)}</strong></td>
      <td>${cleanText(row.runner_up)}</td>
      <td>${cleanText(row.final_score)}</td>
      <td>${cleanText(row.champion_record)}</td>
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

buildChampionsPage();
