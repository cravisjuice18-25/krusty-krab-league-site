async function buildChampionsPage() {
  try {
    const champions = await loadCSV("data/champions.csv");

    const sortedChampions = [...champions].sort((a, b) => {
      return Number(b.year) - Number(a.year);
    });

    buildCurrentChampion(sortedChampions);
    buildChampionshipBanners(sortedChampions);
    buildChampionshipHistory(sortedChampions);
    buildTitleCounts(champions);
    buildTitleGameRecords(champions);

  } catch (error) {
    console.error("Champions page error:", error);

    const currentChampionTeam = document.getElementById("current-champion-team");
    const currentChampionDetails = document.getElementById("current-champion-details");
    const tableBody = document.getElementById("championship-history-body");
    const bannerGrid = document.getElementById("championship-banner-grid");

    if (currentChampionTeam) {
      currentChampionTeam.textContent = "Error loading champions.csv";
    }

    if (currentChampionDetails) {
      currentChampionDetails.textContent =
        "Check champions.csv, data-loader.js, and champions.js.";
    }

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="championship-banner-card">
          <span>Error</span>
          <h3>CSV Not Loaded</h3>
          <p>Check the file path: data/champions.csv</p>
        </article>
      `;
    }

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">Error loading championship history.</td>
        </tr>
      `;
    }
  }
}

function buildCurrentChampion(champions) {
  const latest = champions[0];

  if (!latest) return;

  document.getElementById("current-champion-year").textContent = `${latest.year} Champion`;
  document.getElementById("current-champion-team").textContent = latest.champion;

  document.getElementById("current-champion-details").textContent =
    `${latest.champion} defeated ${latest.runner_up} ${latest.final_score}. Regular season record: ${latest.champion_record}.`;
}

function buildChampionshipBanners(champions) {
  const bannerGrid = document.getElementById("championship-banner-grid");
  bannerGrid.innerHTML = "";

  champions.forEach(row => {
    const banner = document.createElement("article");
    banner.className = "championship-banner-card";

    banner.innerHTML = `
      <span>${row.year}</span>
      <h3>${row.champion}</h3>
      <p>Defeated ${row.runner_up} · ${row.final_score}</p>
    `;

    bannerGrid.appendChild(banner);
  });
}

function buildChampionshipHistory(champions) {
  const tableBody = document.getElementById("championship-history-body");
  tableBody.innerHTML = "";

  champions.forEach(row => {
    const tableRow = document.createElement("tr");

    tableRow.innerHTML = `
      <td>${row.year}</td>
      <td><strong>${row.champion}</strong></td>
      <td>${row.runner_up}</td>
      <td>${row.final_score}</td>
      <td>${row.champion_record}</td>
    `;

    tableBody.appendChild(tableRow);
  });
}

function buildTitleCounts(champions) {
  const counts = {};

  champions.forEach(row => {
    if (!row.champion || row.champion === "TBD" || row.champion === "NA") return;

    counts[row.champion] = (counts[row.champion] || 0) + 1;
  });

  const sortedCounts = Object.entries(counts).sort((a, b) => {
    return b[1] - a[1] || a[0].localeCompare(b[0]);
  });

  const list = document.getElementById("title-count-list");
  list.innerHTML = "";

  if (sortedCounts.length === 0) {
    list.innerHTML = `
      <div class="title-count-item">
        <span>No title counts yet</span>
        <strong>—</strong>
      </div>
    `;
    return;
  }

  sortedCounts.forEach(([team, count]) => {
    const item = document.createElement("div");
    item.className = "title-count-item";

    item.innerHTML = `
      <span>${team}</span>
      <strong>${count}</strong>
    `;

    list.appendChild(item);
  });
}

function parseScore(scoreText) {
  if (!scoreText || scoreText === "TBD" || scoreText === "NA") return null;

  const numbers = scoreText.match(/\d+(\.\d)?/g);

  if (!numbers || numbers.length < 2) return null;

  const championScore = Number(numbers[0]);
  const runnerUpScore = Number(numbers[1]);

  if (Number.isNaN(championScore) || Number.isNaN(runnerUpScore)) return null;

  return {
    championScore,
    runnerUpScore,
    margin: Math.abs(championScore - runnerUpScore),
    total: championScore + runnerUpScore
  };
}

function buildTitleGameRecords(champions) {
  const games = champions
    .map(row => {
      const parsedScore = parseScore(row.final_score);

      if (!parsedScore) return null;

      return {
        ...row,
        ...parsedScore
      };
    })
    .filter(Boolean);

  if (games.length === 0) {
    setTitleGameRecordText("highest-championship-score", "No score data yet.");
    setTitleGameRecordText("lowest-championship-score", "No score data yet.");
    setTitleGameRecordText("closest-championship-game", "No score data yet.");
    setTitleGameRecordText("biggest-championship-blowout", "No score data yet.");
    return;
  }

  const highestChampionScore = [...games].sort((a, b) => b.championScore - a.championScore)[0];
  const lowestChampionScore = [...games].sort((a, b) => a.championScore - b.championScore)[0];
  const closestGame = [...games].sort((a, b) => a.margin - b.margin)[0];
  const biggestBlowout = [...games].sort((a, b) => b.margin - a.margin)[0];

  setTitleGameRecordText(
    "highest-championship-score",
    `${highestChampionScore.champion} · ${formatScore(highestChampionScore.championScore)} points · ${highestChampionScore.year}`
  );

  setTitleGameRecordText(
    "lowest-championship-score",
    `${lowestChampionScore.champion} · ${formatScore(lowestChampionScore.championScore)} points · ${lowestChampionScore.year}`
  );

  setTitleGameRecordText(
    "closest-championship-game",
    `${closestGame.champion} defeated ${closestGame.runner_up} by ${formatScore(closestGame.margin)} points · ${closestGame.year}`
  );

  setTitleGameRecordText(
    "biggest-championship-blowout",
    `${biggestBlowout.champion} defeated ${biggestBlowout.runner_up} by ${formatScore(biggestBlowout.margin)} points · ${biggestBlowout.year}`
  );
}

function setTitleGameRecordText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function formatScore(value) {
  return Number(value).toFixed(2).replace(".00", "");
}

buildChampionsPage();
