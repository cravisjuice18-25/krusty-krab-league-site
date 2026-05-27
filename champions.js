async function buildChampionsPage() {
  const champions = await loadCSV("data/champions.csv");

  const bannerGrid = document.getElementById("championship-banner-grid");
  const tableBody = document.getElementById("championship-history-body");

  bannerGrid.innerHTML = "";
  tableBody.innerHTML = "";

  champions.forEach(row => {
    const banner = document.createElement("article");
    banner.className = "championship-banner-card";

    banner.innerHTML = `
      <span>${row.year}</span>
      <h3>${row.champion}</h3>
      <p>Defeated ${row.runner_up} · ${row.final_score}</p>
    `;

    bannerGrid.appendChild(banner);

    const tableRow = document.createElement("tr");

    tableRow.innerHTML = `
      <td>${row.year}</td>
      <td><strong>${row.champion}</strong></td>
      <td>${row.runner_up}</td>
      <td>${row.final_score}</td>
      <td>${row.champion_record}</td>
    `;

    tableBody.appendChild(tableRow);
  });
}

buildChampionsPage();
