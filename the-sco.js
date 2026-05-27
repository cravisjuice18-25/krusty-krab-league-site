async function buildTheScoPage() {
  try {
    const scoHistory = await loadCSV("data/the-sco.csv");

    const sortedScoHistory = [...scoHistory].sort((a, b) => {
      return Number(b.year) - Number(a.year);
    });

    buildCurrentSco(sortedScoHistory);
    buildScoBanners(sortedScoHistory);
    buildScoHistoryTable(sortedScoHistory);
    buildScoCounts(scoHistory);

  } catch (error) {
    console.error("The Sco page error:", error);

    const currentScoTeam = document.getElementById("current-sco-team");
    const currentScoDetails = document.getElementById("current-sco-details");
    const tableBody = document.getElementById("sco-history-body");
    const bannerGrid = document.getElementById("sco-banner-grid");

    if (currentScoTeam) {
      currentScoTeam.textContent = "Error loading the-sco.csv";
    }

    if (currentScoDetails) {
      currentScoDetails.textContent =
        "Check the-sco.csv, data-loader.js, and the-sco.js.";
    }

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="sco-banner-card">
          <span>Error</span>
          <h3>CSV Not Loaded</h3>
          <p>Check the file path: data/the-sco.csv</p>
        </article>
      `;
    }

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">Error loading The Sco history.</td>
        </tr>
      `;
    }
  }
}

function buildCurrentSco(scoHistory) {
  const latest = scoHistory[0];

  if (!latest) return;

  document.getElementById("current-sco-year").textContent = `${latest.year} The Sco`;
  document.getElementById("current-sco-team").textContent = latest.team;

  document.getElementById("current-sco-details").textContent =
    `${latest.team} finished ${latest.final_finish} with a ${latest.final_record} record and ${latest.avg_points_for} avg points for.`;
}

function buildScoBanners(scoHistory) {
  const bannerGrid = document.getElementById("sco-banner-grid");
  bannerGrid.innerHTML = "";

  scoHistory.forEach(row => {
    const banner = document.createElement("article");
    banner.className = "sco-banner-card";

    banner.innerHTML = `
      <span>${row.year}</span>
      <h3>${row.team}</h3>
      <p>Final Record: ${row.final_record}</p>
    `;

    bannerGrid.appendChild(banner);
  });
}

function buildScoHistoryTable(scoHistory) {
  const tableBody = document.getElementById("sco-history-body");
  tableBody.innerHTML = "";

  scoHistory.forEach(row => {
    const tableRow = document.createElement("tr");

    tableRow.innerHTML = `
      <td>${row.year}</td>
      <td><strong>${row.team}</strong></td>
      <td>${row.final_record}</td>
      <td>${row.final_finish}</td>
      <td>${row.avg_points_for}</td>
    `;

    tableBody.appendChild(tableRow);
  });
}

function buildScoCounts(scoHistory) {
  const counts = {};

  scoHistory.forEach(row => {
    if (!row.team || row.team === "TBD" || row.team === "NA") return;

    counts[row.team] = (counts[row.team] || 0) + 1;
  });

  const sortedCounts = Object.entries(counts).sort((a, b) => {
    return b[1] - a[1] || a[0].localeCompare(b[0]);
  });

  const list = document.getElementById("sco-count-list");
  list.innerHTML = "";

  if (sortedCounts.length === 0) {
    list.innerHTML = `
      <div class="sco-count-item">
        <span>No The Sco counts yet</span>
        <strong>—</strong>
      </div>
    `;
    return;
  }

  sortedCounts.forEach(([team, count]) => {
    const item = document.createElement("div");
    item.className = "sco-count-item";

    item.innerHTML = `
      <span>${team}</span>
      <strong>${count}</strong>
    `;

    list.appendChild(item);
  });
}

buildTheScoPage();
