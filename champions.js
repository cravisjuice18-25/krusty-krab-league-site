async function buildChampionsPage() {
  const champions = await loadCSV("data/champions.csv");

  const sortedChampions = [...champions].sort((a, b) => {
    return Number(b.year) - Number(a.year);
  });

  buildCurrentChampion(sortedChampions);
  buildChampionshipBanners(sortedChampions);
  buildChampionshipHistory(sortedChampions);
  buildTitleCounts(champions);
  buildRunnerUpCounts(champions);
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
    if (!row.champion || row.champion === "TBD") return;
    counts[row.champion] = (counts[row.champion] || 0) + 1;
  });

  const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);

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

function buildRunnerUpCounts(champions) {
  const counts = {};

  champions.forEach(row => {
    if (!row.runner_up || row.runner_up === "TBD") return;
    counts[row.runner_up] = (counts[row.runner_up] || 0) + 1;
  });

  const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const list = document.getElementById("runner-up-count-list");
  list.innerHTML = "";

  if (sortedCounts.length === 0) {
    list.innerHTML = `
      <div class="record-item">
        <strong>No runner-up counts yet</strong>
        <span>Add real runner-up data to champions.csv.</span>
      </div>
    `;
    return;
  }

  sortedCounts.forEach(([team, count]) => {
    const item = document.createElement("div");
    item.className = "record-item";

    item.innerHTML = `
      <strong>${team}</strong>
      <span>${count} runner-up finish${count === 1 ? "" : "es"}</span>
    `;

    list.appendChild(item);
  });
}

buildChampionsPage();
