async function buildChampionsPage() {
  try {
    const champions = await loadCSV("data/champions.csv");

    const sortedChampions = [...champions]
      .filter(row => cleanText(row.year))
      .sort((a, b) => Number(b.year) - Number(a.year));

    buildChampionFeatureCards(sortedChampions);
    buildChampionBanners(sortedChampions);
    buildChampionshipHistory(sortedChampions);

  } catch (error) {
    console.error("Champions page error:", error);

    const bannerGrid = getChampionBannerGrid();

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="championship-banner">
          <div class="banner-year">Error</div>
          <div class="banner-content">
            <p class="section-label">Error</p>
            <h3>Champions Not Loaded</h3>
            <p>Check data/champions.csv, data-loader.js, and champions.js.</p>
            <strong>Data Error</strong>
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

  const year = cleanText(latestChampion.year);
  const champion = cleanText(latestChampion.champion);
  const finalScore = cleanText(latestChampion.final_score);
  const championRecord = cleanText(latestChampion.champion_record);

  setText("latest-champion-year", `${year} Champion`);
  setText("latest-champion-team", champion);
  setText("latest-champion-details", `${finalScore} · ${championRecord}`);

  setText("champion-feature-year", `${year} Champion`);
  setText("champion-feature-team", champion);
  setText("champion-feature-details", `${finalScore} · ${championRecord}`);

  setText("champion-feature-score", finalScore);
  setText("champion-feature-record", championRecord);
}

function buildChampionBanners(champions) {
  const bannerGrid = getChampionBannerGrid();

  if (!bannerGrid) {
    console.warn("Champion banner grid not found.");
    return;
  }

  bannerGrid.innerHTML = "";

  champions.forEach(row => {
    const year = cleanText(row.year);
    const champion = cleanText(row.champion);
    const finalScore = cleanText(row.final_score);
    const championRecord = cleanText(row.champion_record);

    if (!year || champion.toLowerCase() === "no winner") {
      return;
    }

    const banner = document.createElement("article");
    banner.className = "championship-banner";

    banner.innerHTML = `
      <div class="banner-year">${year}</div>

      <div class="banner-content">
        <p class="section-label">League Champion</p>
        <h3>${champion}</h3>
        <p>${finalScore || "Final score TBD"}</p>
        <strong>${championRecord || "Record TBD"}</strong>
      </div>
    `;

    bannerGrid.appendChild(banner);
  });
}

function buildChampionshipHistory(champions) {
  const tableBody = getChampionshipHistoryBody();

  if (!tableBody) {
    console.warn("Championship history table body not found.");
    return;
  }

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

function getChampionBannerGrid() {
  return getFirstElementById([
    "championship-banners-grid",
    "champion-banners-grid",
    "championship-banner-grid",
    "champions-banner-grid"
  ]) || document.querySelector(".championship-banners-grid")
     || document.querySelector(".champion-banners-grid")
     || document.querySelector(".championship-banner-grid")
     || document.querySelector(".champions-banner-grid");
}

function getChampionshipHistoryBody() {
  return getFirstElementById([
    "championship-history-body",
    "champions-history-body",
    "champion-history-body"
  ]) || document.querySelector("#championship-history tbody")
     || document.querySelector(".championship-history tbody")
     || document.querySelector(".champions-history tbody");
}

function getFirstElementById(ids) {
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

buildChampionsPage();
