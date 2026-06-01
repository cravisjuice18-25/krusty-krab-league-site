async function buildChampionsPage() {
  try {
    const champions = await loadCSV("data/champions.csv");

    const sortedChampions = [...champions]
      .filter(row => cleanText(row.year))
      .sort((a, b) => Number(b.year) - Number(a.year));

    buildCurrentChampion(sortedChampions);
    buildTitleCounts(sortedChampions);
    buildChampionBanners(sortedChampions);
    buildChampionshipHistory(sortedChampions);
    buildChampionshipRecords(sortedChampions);

  } catch (error) {
    console.error("Champions page error:", error);

    const bannerGrid = getElement([
      "championship-banners-grid",
      "champion-banners-grid",
      "champions-banner-grid",
      "championship-banner-grid"
    ]);

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="championship-banner">
          <div class="banner-year">Error</div>
          <div class="banner-content">
            <p class="section-label">Error</p>
            <h3>Champions Not Loaded</h3>
            <p>Check data/champions.csv, data-loader.js, and champions.js.</p>
          </div>
        </article>
      `;
    }
  }
}

function buildCurrentChampion(champions) {
  const latestChampion = champions.find(row => {
    return cleanText(row.champion).toLowerCase() !== "no winner";
  });

  if (!latestChampion) return;

  const year = cleanText(latestChampion.year);
  const champion = cleanText(latestChampion.champion);
  const runnerUp = cleanText(latestChampion.runner_up);
  const finalScore = cleanText(latestChampion.final_score);
  const championRecord = cleanText(latestChampion.champion_record);

  setText("current-champion-year", `${year} Champion`);
  setText("current-champion-team", champion);
  setText("current-champion-details", `${champion} defeated ${runnerUp} ${finalScore}. Regular season record: ${championRecord}.`);

  setText("latest-champion-year", `${year} Champion`);
  setText("latest-champion-team", champion);
  setText("latest-champion-details", `${finalScore} · ${championRecord}`);

  setText("champion-feature-year", `${year} Champion`);
  setText("champion-feature-team", champion);
  setText("champion-feature-details", `${finalScore} · ${championRecord}`);
}

function buildTitleCounts(champions) {
  const titleCounts = {};

  champions.forEach(row => {
    const champion = cleanText(row.champion);

    if (!champion || champion.toLowerCase() === "no winner" || champion.toLowerCase() === "na") return;

    titleCounts[champion] = (titleCounts[champion] || 0) + 1;
  });

  const list = getElement([
    "champion-title-count-list",
    "title-count-list",
    "championship-title-count-list",
    "league-title-count-list"
  ]);

  if (!list) return;

  const sortedCounts = Object.entries(titleCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (sortedCounts.length === 0) {
    list.innerHTML = `
      <div class="count-row">
        <span>No titles loaded</span>
        <strong>0</strong>
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  sortedCounts.forEach(([champion, count]) => {
    const item = document.createElement("div");
    item.className = "count-row";

    item.innerHTML = `
      <span>${champion}</span>
      <strong>${count}</strong>
    `;

    list.appendChild(item);
  });
}

function buildChampionBanners(champions) {
  const bannerGrid = getElement([
    "championship-banners-grid",
    "champion-banners-grid",
    "champions-banner-grid",
    "championship-banner-grid"
  ]);

  if (!bannerGrid) return;

  bannerGrid.innerHTML = "";

  champions.forEach(row => {
    const year = cleanText(row.year);
    const champion = cleanText(row.champion);
    const runnerUp = cleanText(row.runner_up);
    const finalScore = cleanText(row.final_score);
    const championRecord = cleanText(row.champion_record);

    if (!year || champion.toLowerCase() === "no winner") return;

    const banner = document.createElement("article");
    banner.className = "championship-banner";

    banner.innerHTML = `
      <div class="banner-year">${year}</div>

      <div class="banner-content">
        <p class="section-label">League Champion</p>
        <h3>${champion}</h3>
        <p>Defeated ${runnerUp} · ${finalScore}</p>
        <strong>${championRecord}</strong>
      </div>
    `;

    bannerGrid.appendChild(banner);
  });
}

function buildChampionshipHistory(champions) {
  const tableBody = getElement([
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

function buildChampionshipRecords(champions) {
  const validGames = champions.filter(row => {
    return cleanText(row.champion).toLowerCase() !== "no winner" &&
      cleanText(row.final_score).includes("-");
  });

  if (validGames.length === 0) return;

  const scoredGames = validGames.map(row => {
    const scores = cleanText(row.final_score).split("-").map(Number);
    const high = Math.max(scores[0], scores[1]);
    const low = Math.min(scores[0], scores[1]);
    const margin = high - low;

    return {
      year: cleanText(row.year),
      champion: cleanText(row.champion),
      runnerUp: cleanText(row.runner_up),
      finalScore: cleanText(row.final_score),
      high,
      low,
      margin
    };
  });

  const highestScore = [...scoredGames].sort((a, b) => b.high - a.high)[0];
  const lowestScore = [...scoredGames].sort((a, b) => a.high - b.high)[0];
  const closestGame = [...scoredGames].sort((a, b) => a.margin - b.margin)[0];
  const biggestBlowout = [...scoredGames].sort((a, b) => b.margin - a.margin)[0];

  setText("highest-championship-score", `${highestScore.high} · ${highestScore.champion} · ${highestScore.year}`);
  setText("lowest-championship-score", `${lowestScore.high} · ${lowestScore.champion} · ${lowestScore.year}`);
  setText("closest-championship-game", `${closestGame.finalScore} · ${closestGame.year}`);
  setText("biggest-championship-blowout", `${biggestBlowout.margin} points · ${biggestBlowout.year}`);
}

function getElement(ids) {
  for (const id of ids) {
    const element = document.getElementById(id);

    if (element) return element;
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
