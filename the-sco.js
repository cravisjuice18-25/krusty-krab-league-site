async function buildScoPage() {
  try {
    const scoHistory = await loadCSV("data/the-sco.csv");

    const sortedSco = [...scoHistory]
      .filter(row => cleanText(row.year))
      .sort((a, b) => Number(b.year) - Number(a.year));

    buildCurrentSco(sortedSco);
    buildScoCounts(sortedSco);
    buildScoBanners(sortedSco);
    buildScoHistory(sortedSco);

  } catch (error) {
    console.error("The Sco page error:", error);

    const bannerGrid = document.getElementById("sco-banners-grid");

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="sco-banner">
          <div class="banner-content">
            <p class="section-label">Error</p>
            <h3>The Sco Not Loaded</h3>
            <p>Check data/the-sco.csv, data-loader.js, and the-sco.js.</p>
          </div>
        </article>
      `;
    }
  }
}

function buildCurrentSco(scoHistory) {
  const latestSco = scoHistory[0];

  if (!latestSco) return;

  setText("current-sco-year", `${cleanText(latestSco.year)} The Sco`);
  setText("current-sco-team", cleanText(latestSco.team));
  setText(
    "current-sco-details",
    `${cleanText(latestSco.team)} finished ${cleanText(latestSco.final_finish)} with a ${cleanText(latestSco.final_record)} record and ${cleanText(latestSco.avg_points_for)} average points for.`
  );
}

function buildScoCounts(scoHistory) {
  const scoCounts = {};

  scoHistory.forEach(row => {
    const team = cleanText(row.team);

    if (!team) return;

    scoCounts[team] = (scoCounts[team] || 0) + 1;
  });

  const list = document.getElementById("sco-count-list");

  if (!list) return;

  const sortedCounts = Object.entries(scoCounts)
    .sort((a, b) => b[1] - a[1]);

  list.innerHTML = "";

  sortedCounts.forEach(([team, count]) => {
    const item = document.createElement("div");
    item.className = "count-row";

    item.innerHTML = `
      <span>${team}</span>
      <strong>${count}</strong>
    `;

    list.appendChild(item);
  });
}

function buildScoBanners(scoHistory) {
  const bannerGrid = document.getElementById("sco-banners-grid");

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
        <p>${cleanText(row.final_record)} · Finished ${cleanText(row.final_finish)}</p>
        <strong>${cleanText(row.avg_points_for)} Avg Points For</strong>
      </div>
    `;

    bannerGrid.appendChild(banner);
  });
}

function buildScoHistory(scoHistory) {
  const tableBody = document.getElementById("sco-history-body");

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

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

buildScoPage();
