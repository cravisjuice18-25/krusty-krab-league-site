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

    const bannerGrid = getElement([
      "sco-banners-grid",
      "the-sco-banners-grid",
      "sco-banner-grid",
      "the-sco-banner-grid"
    ]);

    if (bannerGrid) {
      bannerGrid.innerHTML = `
        <article class="sco-banner">
          <div class="banner-year">Error</div>
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

  const year = cleanText(latestSco.year);
  const team = cleanText(latestSco.team);
  const record = cleanText(latestSco.final_record);
  const finish = cleanText(latestSco.final_finish);
  const avgPoints = cleanText(latestSco.avg_points_for);

  setText("current-sco-year", `${year} The Sco`);
  setText("current-sco-team", team);
  setText("current-sco-details", `${team} finished ${finish} with a ${record} record and ${avgPoints} average points for.`);

  setText("latest-sco-year", `${year} The Sco`);
  setText("latest-sco-team", team);
  setText("latest-sco-details", `${record} · ${avgPoints} avg points`);

  setText("sco-feature-year", `${year} The Sco`);
  setText("sco-feature-team", team);
  setText("sco-feature-details", `${record} · ${avgPoints} avg points`);
}

function buildScoCounts(scoHistory) {
  const scoCounts = {};

  scoHistory.forEach(row => {
    const ownerId = cleanText(row.owner_id).toLowerCase();
    const team = cleanText(row.team);

    if (!team) return;

    const displayName = formatOwnerName(ownerId) || team;

    scoCounts[displayName] = (scoCounts[displayName] || 0) + 1;
  });

  const list = getElement([
    "sco-count-list",
    "the-sco-count-list",
    "last-place-count-list"
  ]);

  if (!list) return;

  const sortedCounts = Object.entries(scoCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (sortedCounts.length === 0) {
    list.innerHTML = `
      <div class="count-row">
        <span>No Sco counts loaded</span>
        <strong>0</strong>
      </div>
    `;
    return;
  }

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
  const bannerGrid = getElement([
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
    const record = cleanText(row.final_record);
    const avgPoints = cleanText(row.avg_points_for);

    const banner = document.createElement("article");
    banner.className = "sco-banner";

    banner.innerHTML = `
      <div class="banner-year">${year}</div>

      <div class="banner-content">
        <p class="section-label">The Sco</p>
        <h3>${team}</h3>
        <p>${record} · Finished ${finish}</p>
        <strong>${avgPoints} Avg Points For</strong>
      </div>
    `;

    bannerGrid.appendChild(banner);
  });
}

function buildScoHistory(scoHistory) {
  const tableBody = getElement([
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

function formatOwnerName(ownerId) {
  const ownerMap = {
    bard: "Bard",
    sco: "Sco",
    jake: "Jake",
    muffin: "Muffin",
    miner: "Miner",
    hunter: "Hunter",
    kyle: "Kyle",
    gary: "Gary",
    eric: "Eric",
    sabella: "Sabella",
    charlie: "Charlie",
    miller: "Miller"
  };

  return ownerMap[ownerId] || "";
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

buildScoPage();
