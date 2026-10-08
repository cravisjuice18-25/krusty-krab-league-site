async function buildRecordsPage() {
  try {
    const records = await loadCSV("data/records.csv");
    buildSyncedRecords(records);
  } catch (error) {
    console.warn("Record sync data unavailable; retaining the page's existing records.", error);
  }
  try {
    const hallOfFame = await loadCSV("data/hall-of-fame.csv");
    buildHallOfFame(hallOfFame);
  } catch (error) {
    console.warn("Hall of Fame data did not load. Hiding section.", error);
    hideHallOfFameSection();
  }
}

function recordElement(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function buildSyncedRecords(records) {
  for (const id of ["regular-season", "mini-games", "play-in", "playoffs", "championships", "power-rating", "points-moves", "league-scoring"]) {
    const section = document.getElementById(id);
    const rows = records.filter(row => row.category === id);
    if (!section || !rows.length) continue;
    const body = section.querySelector("tbody");
    const grid = section.querySelector(".record-card-grid");
    const list = section.querySelector(".records-list");
    const container = body || grid || list;
    if (!container) continue;
    container.replaceChildren();
    rows.forEach(row => {
      if (body) {
        const tr = document.createElement("tr");
        [row.record, row.value, row.holder, row.year].forEach(value => tr.appendChild(recordElement("td", value)));
        body.appendChild(tr);
      } else if (grid) {
        const card = recordElement("div", "", "record-stat-card");
        card.append(recordElement("span", row.record), recordElement("strong", row.value), recordElement("p", `${row.holder} · ${row.year}`));
        grid.appendChild(card);
      } else {
        const item = recordElement("div", "", "record-item");
        item.append(recordElement("strong", row.record), recordElement("span", `${row.holder} · ${row.value} · ${row.year}`));
        list.appendChild(item);
      }
    });
  }
  for (const [id, kind] of [["player-records", "(season)"], ["player-game-records", "(single game)"]]) {
    const body = document.querySelector(`#${id} tbody`);
    const rows = records.filter(row => row.category === "player-records" && row.record.includes(kind));
    if (!body || !rows.length) continue;
    body.replaceChildren();
    rows.forEach(row => {
      const tr = document.createElement("tr");
      [row.record.split(",")[0], row.value, row.holder, row.notes, row.year].forEach(value => tr.appendChild(recordElement("td", value)));
      body.appendChild(tr);
    });
  }
  const features = [
    records.find(row => row.category === "regular-season" && row.record.startsWith("Best Winning Percentage, Career")),
    records.find(row => row.category === "regular-season" && row.record === "Most Wins (Career)"),
    records.find(row => row.record === "Highest Single-Game PF"),
    records.find(row => row.record === "Most Official Championships")
  ];
  document.querySelectorAll(".record-feature-card").forEach((card, index) => {
    const row = features[index];
    if (!row) return;
    card.querySelector("strong").textContent = row.value;
    card.querySelector("span").textContent = `${row.holder} · ${row.year}`;
  });
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
