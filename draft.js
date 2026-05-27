async function buildDraftPage() {
  try {
    const drafts = await loadCSV("data/drafts.csv");

    const sortedDrafts = [...drafts].sort((a, b) => {
      return Number(b.year) - Number(a.year);
    });

    buildDraftFeatureCards(sortedDrafts);
    buildDraftSeasonCards(sortedDrafts);

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

  if (recentYear) recentYear.textContent = `${latestDraft.year} Draft`;
  if (recentLocation) recentLocation.textContent = latestDraft.location || "TBD";
  if (recentDetails) recentDetails.textContent = `${latestDraft.format || "TBD"} · ${latestDraft.date || "TBD"}`;

  if (firstPickYear) firstPickYear.textContent = `${latestDraft.year} 1.01`;
  if (firstPickPlayer) firstPickPlayer.textContent = latestDraft.first_pick || "TBD";
  if (firstPickTeam) firstPickTeam.textContent = latestDraft.first_pick_team || "TBD";
}

function buildDraftSeasonCards(drafts) {
  const draftGrid = document.getElementById("draft-season-grid");
  draftGrid.innerHTML = "";

  drafts.forEach(draft => {
    const card = document.createElement("article");
    card.className = "draft-season-card";
    card.id = `draft-${draft.year}`;

    card.innerHTML = `
      <span>${draft.year}</span>
      <h3>${draft.location || "TBD"}</h3>
      <p>${draft.format || "TBD"} · ${draft.date || "TBD"}</p>
      <strong>1.01 ${draft.first_pick || "TBD"}</strong>
    `;

    draftGrid.appendChild(card);
  });
}

buildDraftPage();
