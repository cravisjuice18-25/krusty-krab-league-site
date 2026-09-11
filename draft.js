async function buildDraftPage() {
  try {
    const drafts = await loadOptionalCSV("data/drafts.csv");
    const draftPicks = await loadOptionalCSV("data/draft-picks.csv");

    const draftsByYear = buildDraftsByYear(drafts);
    const picksByYear = groupDraftPicksByYear(draftPicks);
    const years = getDraftYears(draftsByYear, picksByYear);

    buildDraftYearSelector(years);
    buildDraftRoundSelector([]);

    if (years.length > 0) {
      renderSelectedDraft(years[0], "full", draftsByYear, picksByYear);
    } else {
      renderDraftEmptyState();
    }

    setupDraftFilters(draftsByYear, picksByYear);

  } catch (error) {
    console.error("Draft page error:", error);
    renderDraftError();
  }
}

/* =========================================================
   DATA LOADING
   ========================================================= */

async function loadOptionalCSV(path) {
  try {
    return await loadCSV(path);
  } catch (error) {
    console.warn(`${path} did not load:`, error);
    return [];
  }
}

/* =========================================================
   GROUPING
   ========================================================= */

function buildDraftsByYear(drafts) {
  const lookup = {};

  (drafts || []).forEach(row => {
    const year = cleanText(row.year);

    if (!year) return;

    lookup[year] = row;
  });

  return lookup;
}

function groupDraftPicksByYear(picks) {
  const grouped = {};

  (picks || []).forEach(row => {
    const year = cleanText(row.year);

    if (!year) return;

    if (!grouped[year]) {
      grouped[year] = [];
    }

    grouped[year].push(row);
  });

  Object.keys(grouped).forEach(year => {
    grouped[year].sort((a, b) => {
      return getPickNumber(a) - getPickNumber(b);
    });
  });

  return grouped;
}

function getDraftYears(draftsByYear, picksByYear) {
  const years = new Set([
    ...Object.keys(draftsByYear || {}),
    ...Object.keys(picksByYear || {})
  ]);

  return [...years].sort((a, b) => Number(b) - Number(a));
}

/* =========================================================
   SELECTORS
   ========================================================= */

function buildDraftYearSelector(years) {
  const selector = document.getElementById("draft-year-selector");

  if (!selector) return;

  selector.innerHTML = "";

  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `${year} Draft`;
    selector.appendChild(option);
  });
}

function buildDraftRoundSelector(picks) {
  const selector = document.getElementById("draft-round-selector");

  if (!selector) return;

  const rounds = [...new Set(
    (picks || [])
      .map(row => cleanText(row.round))
      .filter(Boolean)
  )].sort((a, b) => Number(a) - Number(b));

  selector.innerHTML = "";

  const fullOption = document.createElement("option");
  fullOption.value = "full";
  fullOption.textContent = "Full Draft";
  selector.appendChild(fullOption);

  rounds.forEach(round => {
    const option = document.createElement("option");
    option.value = round;
    option.textContent = `Round ${round}`;
    selector.appendChild(option);
  });
}

function setupDraftFilters(draftsByYear, picksByYear) {
  const yearSelector = document.getElementById("draft-year-selector");
  const roundSelector = document.getElementById("draft-round-selector");

  if (!yearSelector || !roundSelector) return;

  yearSelector.addEventListener("change", () => {
    const selectedYear = yearSelector.value;
    const picks = picksByYear[selectedYear] || [];

    buildDraftRoundSelector(picks);
    renderSelectedDraft(selectedYear, "full", draftsByYear, picksByYear);
  });

  roundSelector.addEventListener("change", () => {
    renderSelectedDraft(yearSelector.value, roundSelector.value, draftsByYear, picksByYear);
  });
}

/* =========================================================
   SELECTED DRAFT RENDER
   ========================================================= */

function renderSelectedDraft(year, roundView, draftsByYear, picksByYear) {
  const draftMeta = draftsByYear[year] || {};
  const allPicks = picksByYear[year] || [];

  buildDraftRoundSelectorIfNeeded(year, allPicks, roundView);

  const filteredPicks = roundView === "full"
    ? allPicks
    : allPicks.filter(row => cleanText(row.round) === cleanText(roundView));

  const viewLabel = roundView === "full" ? "Full Draft" : `Round ${roundView}`;

  setText("draft-selected-label", `${year} Draft`);
  setText("draft-selected-title", viewLabel);

  setText("draft-meta-year", year || "TBD");
  setText("draft-meta-date", cleanText(draftMeta.date) || "TBD");
  setText("draft-meta-location", cleanText(draftMeta.location) || "TBD");

  renderDraftPicksTable(filteredPicks);
}

function buildDraftRoundSelectorIfNeeded(year, picks, selectedRound) {
  const selector = document.getElementById("draft-round-selector");

  if (!selector) return;

  const currentOptions = [...selector.options].map(option => option.value);
  const neededRounds = [
    "full",
    ...new Set(
      (picks || [])
        .map(row => cleanText(row.round))
        .filter(Boolean)
    )
  ];

  const needsRebuild =
    currentOptions.length !== neededRounds.length ||
    currentOptions.some(option => !neededRounds.includes(option));

  if (!needsRebuild) return;

  buildDraftRoundSelector(picks);

  if (neededRounds.includes(selectedRound)) {
    selector.value = selectedRound;
  } else {
    selector.value = "full";
  }
}

function renderDraftPicksTable(picks) {
  const tableBody = document.getElementById("draft-picks-body");

  if (!tableBody) return;

  if (!picks || picks.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">No draft picks found for this view.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = picks.map(row => buildDraftPickRow(row)).join("");
}

function buildDraftPickRow(row) {
  const pickNumber =
    cleanText(row.overall_pick) ||
    cleanText(row.pick) ||
    cleanText(row.pick_number) ||
    cleanText(row.no) ||
    "TBD";

  const round =
    cleanText(row.round) ||
    getRoundFromPickNumber(pickNumber) ||
    "TBD";

  const teamOwner =
    cleanText(row.drafting_team) ||
    cleanText(row.team_owner) ||
    cleanText(row.team) ||
    cleanText(row.owner) ||
    "TBD";

  const player =
    cleanText(row.player) ||
    cleanText(row.player_name) ||
    "TBD";

  const position =
    cleanText(row.position) ||
    cleanText(row.pos) ||
    "TBD";

  return `
    <tr>
      <td>${pickNumber}</td>
      <td>${round}</td>
      <td><strong>${teamOwner}</strong></td>
      <td>${player}</td>
      <td>${position}</td>
    </tr>
  `;
}

/* =========================================================
   STATES
   ========================================================= */

function renderDraftEmptyState() {
  setText("draft-selected-label", "Draft Archive");
  setText("draft-selected-title", "No Draft Data Found");
  setText("draft-meta-year", "TBD");
  setText("draft-meta-date", "TBD");
  setText("draft-meta-location", "TBD");

  const tableBody = document.getElementById("draft-picks-body");

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">No draft data found. Check data/drafts.csv and data/draft-picks.csv.</td>
      </tr>
    `;
  }
}

function renderDraftError() {
  setText("draft-selected-label", "Error");
  setText("draft-selected-title", "Draft Data Not Loaded");

  const tableBody = document.getElementById("draft-picks-body");

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">Check draft.js, data-loader.js, data/drafts.csv, and data/draft-picks.csv.</td>
      </tr>
    `;
  }
}

/* =========================================================
   HELPERS
   ========================================================= */

function getPickNumber(row) {
  const pick =
    cleanText(row.overall_pick) ||
    cleanText(row.pick) ||
    cleanText(row.pick_number) ||
    cleanText(row.no);

  const numeric = Number(pick);

  if (!Number.isNaN(numeric)) return numeric;

  const pickMatch = pick.match(/\d+/);

  if (pickMatch) return Number(pickMatch[0]);

  return 9999;
}

function getRoundFromPickNumber(pickNumber) {
  const cleaned = cleanText(pickNumber);

  if (!cleaned.includes(".")) return "";

  return cleaned.split(".")[0];
}

function setText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

buildDraftPage();
