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
    buildBasementRecords(sortedSco);

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
  const seed = cleanText(latestSco.regular_season_seed);
  const record = cleanText(latestSco.regular_season_record);
  const avgPoints = cleanText(latestSco.avg_points_for);
  const opponent = cleanText(latestSco.sco_opponent);

  setText("current-sco-year", `${year} The Sco`);
  setText("current-sco-team", team);
  setText(
    "current-sco-details",
    `${team} entered as the ${ordinal(seed)} seed, finished ${record}, averaged ${avgPoints} points for, and lost the Sco game${opponent ? ` against ${opponent}` : ""}.`
  );

  setText("latest-sco-year", `${year} The Sco`);
  setText("latest-sco-team", team);
  setText("latest-sco-details", `${ordinal(seed)} seed · ${record} · ${avgPoints} avg PF`);

  setText("sco-feature-year", `${year} The Sco`);
  setText("sco-feature-team", team);
  setText("sco-feature-details", `${ordinal(seed)} seed · ${record} · ${avgPoints} avg PF`);
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
    const seed = cleanText(row.regular_season_seed);
    const record = cleanText(row.regular_season_record);
    const avgPoints = cleanText(row.avg_points_for);
    const opponent = cleanText(row.sco_opponent);

    const banner = document.createElement("article");
    banner.className = "sco-banner";

    banner.innerHTML = `
      <div class="banner-year">${year}</div>

      <div class="banner-content">
        <p class="section-label">The Sco</p>
        <h3>${team}</h3>
        <p>${ordinal(seed)} seed · ${record}</p>
        <strong>${avgPoints} Avg PF${opponent ? ` · Lost to ${opponent}` : ""}</strong>
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
      <td>${ordinal(cleanText(row.regular_season_seed))}</td>
      <td>${cleanText(row.regular_season_record)}</td>
      <td>${cleanText(row.avg_points_for)}</td>
      <td>${cleanText(row.sco_opponent) || "TBD"}</td>
    `;

    tableBody.appendChild(tr);
  });
}

function buildBasementRecords(scoHistory) {
  const validRows = scoHistory.filter(row => cleanText(row.year));

  if (validRows.length === 0) return;

  const counts = {};

  validRows.forEach(row => {
    const ownerId = cleanText(row.owner_id).toLowerCase();
    const displayName = formatOwnerName(ownerId) || cleanText(row.team);

    counts[displayName] = (counts[displayName] || 0) + 1;
  });

  const mostSco = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  const byAvgPoints = validRows
    .filter(row => !Number.isNaN(Number(row.avg_points_for)));

  const lowestAvg = [...byAvgPoints].sort((a, b) => {
    return Number(a.avg_points_for) - Number(b.avg_points_for);
  })[0];

  const highestAvg = [...byAvgPoints].sort((a, b) => {
    return Number(b.avg_points_for) - Number(a.avg_points_for);
  })[0];

  const bySeed = validRows
    .filter(row => !Number.isNaN(Number(row.regular_season_seed)));

  const bestSeed = [...bySeed].sort((a, b) => {
    return Number(a.regular_season_seed) - Number(b.regular_season_seed);
  })[0];

  const worstSeed = [...bySeed].sort((a, b) => {
    return Number(b.regular_season_seed) - Number(a.regular_season_seed);
  })[0];

  const worstRecord = [...validRows].sort((a, b) => {
    const aPct = calculateRecordPct(cleanText(a.regular_season_record));
    const bPct = calculateRecordPct(cleanText(b.regular_season_record));
    return aPct - bPct;
  })[0];

  const bestRecord = [...validRows].sort((a, b) => {
    const aPct = calculateRecordPct(cleanText(a.regular_season_record));
    const bPct = calculateRecordPct(cleanText(b.regular_season_record));
    return bPct - aPct;
  })[0];

  setText(
    "sco-most-appearances",
    mostSco ? `${mostSco[0]} · ${mostSco[1]}` : "TBD"
  );

  setText(
    "sco-lowest-avg-points",
    lowestAvg ? `${cleanText(lowestAvg.team)} · ${cleanText(lowestAvg.avg_points_for)} · ${cleanText(lowestAvg.year)}` : "TBD"
  );

  setText(
    "sco-highest-avg-points",
    highestAvg ? `${cleanText(highestAvg.team)} · ${cleanText(highestAvg.avg_points_for)} · ${cleanText(highestAvg.year)}` : "TBD"
  );

  setText(
    "sco-best-seed",
    bestSeed ? `${cleanText(bestSeed.team)} · ${ordinal(cleanText(bestSeed.regular_season_seed))} seed · ${cleanText(bestSeed.year)}` : "TBD"
  );

  setText(
    "sco-worst-seed",
    worstSeed ? `${cleanText(worstSeed.team)} · ${ordinal(cleanText(worstSeed.regular_season_seed))} seed · ${cleanText(worstSeed.year)}` : "TBD"
  );

  setText(
    "sco-worst-record",
    worstRecord ? `${cleanText(worstRecord.team)} · ${cleanText(worstRecord.regular_season_record)} · ${cleanText(worstRecord.year)}` : "TBD"
  );

  setText(
    "sco-best-record",
    bestRecord ? `${cleanText(bestRecord.team)} · ${cleanText(bestRecord.regular_season_record)} · ${cleanText(bestRecord.year)}` : "TBD"
  );
}

function calculateRecordPct(record) {
  const parts = cleanText(record).split("-").map(Number);

  const wins = Number(parts[0]) || 0;
  const losses = Number(parts[1]) || 0;
  const ties = Number(parts[2]) || 0;
  const total = wins + losses + ties;

  if (!total) return 0;

  return (wins + ties * 0.5) / total;
}

function ordinal(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return cleanText(value) || "TBD";

  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = number % 100;

  return number + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
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
