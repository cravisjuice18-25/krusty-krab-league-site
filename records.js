async function buildRecordsPage() {
  try {
    const hallOfFame = await loadCSV("data/hall-of-fame.csv");
    buildHallOfFame(hallOfFame);
  } catch (error) {
    console.warn("Hall of Fame data did not load. Hiding section.", error);
    hideHallOfFameSection();
  }
}

function buildHallOfFame(hallOfFame) {
  const grid = document.getElementById("hall-of-fame-grid");

  if (!grid) return;

  const moments = hallOfFame.filter(moment => {
    const title = cleanText(moment.title).toLowerCase();

    return (
      title &&
      title !== "tbd" &&
      title !== "na" &&
      title !== "n/a" &&
      title !== "coming soon" &&
      title !== "undefined" &&
      title !== "null"
    );
  });

  if (moments.length === 0) {
    hideHallOfFameSection();
    return;
  }

  grid.innerHTML = "";

  moments.forEach(moment => {
    const title = cleanText(moment.title);
    const year = cleanText(moment.year);
    const category = cleanText(moment.category) || "League Lore";
    const imagePath = cleanText(moment.image_path);
    const caption = cleanText(moment.caption);
    const notes = cleanText(moment.notes);

    const card = document.createElement("article");
    card.className = "hall-of-fame-card";

    const labelParts = [
      category,
      !isMissing(year) ? year : ""
    ].filter(Boolean);

    card.innerHTML = `
      ${!isMissing(imagePath) ? `
        <div class="hall-of-fame-image">
          <img src="${imagePath}" alt="${title}">
        </div>
      ` : ""}

      <div class="hall-of-fame-content">
        <span>${labelParts.join(" · ")}</span>
        <h3>${title}</h3>
        ${!isMissing(caption) ? `<p>${caption}</p>` : ""}
        ${!isMissing(notes) ? `<p>${notes}</p>` : ""}
      </div>
    `;

    grid.appendChild(card);
  });
}

function hideHallOfFameSection() {
  const section = document.getElementById("hall-of-fame");

  if (section) {
    section.style.display = "none";
  }

  const hallOfFameNavLink = document.querySelector('.record-category-nav a[href="#hall-of-fame"]');

  if (hallOfFameNavLink) {
    hallOfFameNavLink.style.display = "none";
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

function isMissing(value) {
  const text = cleanText(value).toLowerCase();

  return (
    !text ||
    text === "tbd" ||
    text === "na" ||
    text === "n/a" ||
    text === "coming soon" ||
    text === "undefined" ||
    text === "null" ||
    text === "-"
  );
}

buildRecordsPage();
