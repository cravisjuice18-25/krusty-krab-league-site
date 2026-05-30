async function buildRecordsPage() {
  try {
    const hallOfFame = await loadCSV("data/hall-of-fame.csv");
    buildHallOfFame(hallOfFame);
  } catch (error) {
    console.error("Records page error:", error);

    const grid = document.getElementById("hall-of-fame-grid");

    if (grid) {
      grid.innerHTML = `
        <article class="hall-of-fame-card">
          <div class="hall-of-fame-image">
            <img src="images/hof-moment-1.jpg" alt="Hall of Fame Moment">
          </div>

          <div class="hall-of-fame-content">
            <span>Error</span>
            <h3>Hall of Fame Not Loaded</h3>
            <p>Check data/hall-of-fame.csv, data-loader.js, and records.js.</p>
          </div>
        </article>
      `;
    }
  }
}

function buildHallOfFame(hallOfFame) {
  const grid = document.getElementById("hall-of-fame-grid");

  if (!grid) return;

  const moments = hallOfFame.filter(moment => {
    return cleanText(moment.title) && cleanText(moment.title).toLowerCase() !== "tbd";
  });

  if (moments.length === 0) {
    grid.innerHTML = `
      <article class="hall-of-fame-card">
        <div class="hall-of-fame-image">
          <img src="images/hof-moment-1.jpg" alt="Hall of Fame Moment">
        </div>

        <div class="hall-of-fame-content">
          <span>League Lore</span>
          <h3>Hall of Fame Moments</h3>
          <p>Moments will appear here once they are added to the Hall of Fame CSV.</p>
        </div>
      </article>
    `;
    return;
  }

  grid.innerHTML = "";

  moments.forEach(moment => {
    const card = document.createElement("article");
    card.className = "hall-of-fame-card";

    const title = cleanText(moment.title) || "Hall of Fame Moment";
    const year = cleanText(moment.year);
    const category = cleanText(moment.category) || "League Lore";
    const imagePath = cleanText(moment.image_path) || "images/hof-moment-1.jpg";
    const caption = cleanText(moment.caption) || "Add caption here.";

    const labelParts = [
      category,
      year && year.toLowerCase() !== "tbd" ? year : ""
    ].filter(Boolean);

    card.innerHTML = `
      <div class="hall-of-fame-image">
        <img src="${imagePath}" alt="${title}">
      </div>

      <div class="hall-of-fame-content">
        <span>${labelParts.join(" · ")}</span>
        <h3>${title}</h3>
        <p>${caption}</p>
      </div>
    `;

    grid.appendChild(card);
  });
}

function cleanText(value) {
  return String(value || "").trim();
}

buildRecordsPage();
