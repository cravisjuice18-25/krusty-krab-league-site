async function buildDraftPage() {
  try {
    const drafts = await loadCSV("data/drafts.csv");

    let draftPicks = [];

    try {
      draftPicks = await loadCSV("data/draft-picks.csv");
    } catch (error) {
      console.warn("draft-picks.csv did not load:", error);
      draftPicks = [];
    }

    const sortedDrafts = [...drafts].sort((a, b) => {
      return Number(b.year) - Number(a.year);
    });

    buildDraftFeatureCards(sortedDrafts);
    buildDraftSeasonCards(sortedDrafts, draftPicks);

  } catch (error) {
    console.error("Draft page error:", error);

    const draftGrid = document.getElementById("draft-season-grid");

    if (draftGrid) {
      draftGrid.innerHTML = `
        <article class="draft-season-card">
          <span>Error</span>
          <h3>Draft CSV Not Loaded</h3>
          <p>Check data/drafts.csv, data-loader.js, and draft.js.</p>
          <strong>File path: data/drafts.csv</strong>
        </article>
      `;
    }
  }
}

function buildDraftFeatureCards(drafts) {
  const latestDraft = drafts[0];

  if (!latestDraft) return;

  const recentYear = document.getElementById("draft-feature-year");
  const recentLocation = document.getElementById("draft-feature-location");
  const recentDetails = document.getElementById("draft-feature-details");

  const firstPickYear = document.getElementById("draft-feature-first-pick-year");
  const firstPickPlayer = document.getElementById("draft-feature-first-pick-player");
  const firstPickTeam = document.getElementById("draft-feature-first-pick-team");

  if (recentYear) recentYear.textContent = `${cleanText(latestDraft.year)} Draft`;
  if (recentLocation) recentLocation.textContent = cleanText(latestDraft.location) || "TBD";
  if (recentDetails) recentDetails.textContent = `${cleanText(latestDraft.format) || "TBD"} · ${cleanText(latestDraft.date) || "TBD"}`;

  if (firstPickYear) firstPickYear.textContent = `${cleanText(latestDraft.year)} 1.01`;
  if (firstPickPlayer) firstPickPlayer.textContent = cleanText(latestDraft.first_pick) || "TBD";
  if (firstPickTeam) firstPickTeam.textContent = cleanText(latestDraft.first_pick_team) || "TBD";
}

function buildDraftSeasonCards(drafts, draftPicks) {
  const draftGrid = document.getElementById("draft-season-grid");

  if (!draftGrid) return;

  draftGrid.innerHTML = "";

  drafts.forEach(draft => {
    const year = cleanText(draft.year);
    const picksForYear = draftPicks
      .filter(pick => cleanText(pick.year) === year)
      .sort((a, b) => {
        return Number(a.overall_pick || a.pick || 0) - Number(b.overall_pick || b.pick || 0);
      });

    const card = document.createElement("article");
    card.className = "draft-season-card draft-accordion-card";
    card.id = `draft-${year}`;

    card.innerHTML = `
      <button class="draft-card-toggle" type="button" aria-expanded="false">
        <div class="draft-card-summary">
          <span>${year}</span>
          <h3>${cleanText(draft.location) || "TBD"}</h3>
          <p>${cleanText(draft.format) || "TBD"} · ${cleanText(draft.date) || "TBD"}</p>
          <strong>1.01 ${cleanText(draft.first_pick) || "TBD"}</strong>
          <em>${cleanText(draft.first_pick_team) || "TBD"}</em>
        </div>

        <div class="draft-expand-label">
          <span class="closed-label">View Full Draft</span>
          <span class="open-label">Collapse Draft</span>
        </div>
      </button>

      <div class="draft-year-details">
        ${buildDraftBoardTable(year, picksForYear)}
      </div>
    `;

    const toggle = card.querySelector(".draft-card-toggle");

    toggle.addEventListener("click", () => {
      const isOpen = card.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    draftGrid.appendChild(card);
  });
}

function buildDraftBoardTable(year, picks) {
  if (!picks || picks.length === 0) {
    return `
      <div class="draft-board-empty">
        <strong>${year} Draft Board</strong>
        <p>Draft picks are not entered yet for this year.</p>
      </div>
    `;
  }

  return `
    <div class="table-wrap draft-board-wrap">
      <table class="draft-board-table">
        <thead>
          <tr>
            <th>Round</th>
            <th>Pick</th>
            <th>Overall</th>
            <th>Team</th>
            <th>Player</th>
            <th>Pos</th>
            <th>NFL</th>
            <th>Notes</th>
          </tr>
        </thead>

        <tbody>
          ${picks.map(pick => {
            return `
              <tr>
                <td>${cleanText(pick.round) || "TBD"}</td>
                <td>${cleanText(pick.pick) || "TBD"}</td>
                <td>${cleanText(pick.overall_pick) || "TBD"}</td>
                <td><strong>${cleanText(pick.drafting_team) || "TBD"}</strong></td>
                <td>${cleanText(pick.player) || "TBD"}</td>
                <td>${cleanText(pick.position) || "TBD"}</td>
                <td>${cleanText(pick.nfl_team) || "TBD"}</td>
                <td>${cleanText(pick.notes) || ""}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function cleanText(value) {
  return String(value || "").trim();
}

buildDraftPage();
