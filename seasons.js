async function buildSeasonsPage() {
  try {
    const standings = await loadCSV("data/standings.csv");

    const standingsByYear = groupStandingsByYear(standings);
    const years = Object.keys(standingsByYear).sort((a, b) => Number(b) - Number(a));

    buildSeasonFeatureCards(standingsByYear, years);
    buildSeasonYearNav(years);
    buildSeasonBlocks(standingsByYear, years);

  } catch (error) {
    console.error("Seasons page error:", error);

    const seasonBlocks = document.getElementById("season-blocks");

    if (seasonBlocks) {
      seasonBlocks.innerHTML = `
        <section class="content-card season-block">
          <div class="season-block-header">
            <div>
              <p class="section-label">Error</p>
              <h2>Standings Not Loaded</h2>
            </div>
          </div>

          <p class="season-placeholder-text">
            Check data/standings.csv, data-loader.js, and seasons.js.
          </p>
        </section>
      `;
    }
  }
}

function groupStandingsByYear(standings) {
  const grouped = {};

  standings.forEach(row => {
    const year = cleanText(row.year);

    if (!year) return;

    if (!grouped[year]) {
      grouped[year] = [];
    }

    grouped[year].push(row);
  });

  Object.keys(grouped).forEach(year => {
    grouped[year].sort((a, b) => {
      return Number(a.rank) - Number(b.rank);
    });
  });

  return grouped;
}

function buildSeasonFeatureCards(standingsByYear, years) {
  const latestYear = years[0];

  if (!latestYear) return;

  const latestStandings = standingsByYear[latestYear];
  const firstPlace = latestStandings[0];
  const lastPlace = latestStandings[latestStandings.length - 1];

  const topScoringTeam = [...latestStandings].sort((a, b) => {
    return Number(b.points_for) - Number(a.points_for);
  })[0];

  setText("season-feature-year", `${latestYear} Season`);
  setText("season-feature-winner", cleanText(firstPlace.team));
  setText("season-feature-winner-details", `1st Place · ${cleanText(firstPlace.record)} Regular Season Record`);

  setText("season-feature-points-team", cleanText(topScoringTeam.team));
  setText("season-feature-points-details", `${formatNumber(topScoringTeam.points_for)} points · ${formatNumber(topScoringTeam.avg_for)} average`);

  setText("season-feature-sco-team", cleanText(lastPlace.team));
  setText("season-feature-sco-details", `${ordinal(latestStandings.length)} Place · ${cleanText(lastPlace.record)} Regular Season Record`);
}

function buildSeasonYearNav(years) {
  const nav = document.getElementById("season-year-nav");

  if (!nav) return;

  nav.innerHTML = "";

  years.forEach(year => {
    const link = document.createElement("a");
    link.href = `#season-${year}`;
    link.textContent = year;
    nav.appendChild(link);
  });
}

function buildSeasonBlocks(standingsByYear, years) {
  const container = document.getElementById("season-blocks");

  if (!container) return;

  container.innerHTML = "";

  years.forEach((year, index) => {
    const standings = standingsByYear[year];
    const firstPlace = standings[0];
    const lastPlace = standings[standings.length - 1];

    const topScoringTeam = [...standings].sort((a, b) => {
      return Number(b.points_for) - Number(a.points_for);
    })[0];

    const leagueAverage = calculateLeagueAverage(standings);

    const section = document.createElement("section");
    section.className = "content-card season-block";
    section.id = `season-${year}`;

    section.innerHTML = `
      <div class="season-block-header">
        <div>
          <p class="section-label">Season Archive</p>
          <h2>${year} Final Standings</h2>
        </div>
        <div class="season-pill">${index === 0 ? "Most Recent Season" : "Season Archive"}</div>
      </div>

      <div class="season-summary-strip">
        <div><span>1st Place</span><strong>${cleanText(firstPlace.team)}</strong></div>
        <div><span>Top Points</span><strong>${cleanText(topScoringTeam.team)}</strong></div>
        <div><span>The Sco</span><strong>${cleanText(lastPlace.team)}</strong></div>
        <div><span>League Avg.</span><strong>${leagueAverage} PPG</strong></div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Owner</th>
              <th>Team</th>
              <th>Rating</th>
              <th>Record</th>
              <th>Win %</th>
              <th>PF</th>
              <th>Avg.</th>
              <th>PA</th>
              <th>Avg.</th>
              <th>Margin</th>
              <th>Avg. Margin</th>
              <th>Moves</th>
            </tr>
          </thead>

          <tbody>
            ${standings.map(row => buildStandingRow(row)).join("")}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(section);
  });
}

function buildStandingRow(row) {
  return `
    <tr>
      <td>${cleanText(row.rank)}</td>
      <td>${formatOwnerName(row.owner_id)}</td>
      <td><strong>${cleanText(row.team)}</strong></td>
      <td>${formatNumber(row.team_rating)}</td>
      <td>${cleanText(row.record)}</td>
      <td>${formatWinPct(row.win_pct)}</td>
      <td>${formatNumber(row.points_for)}</td>
      <td>${formatNumber(row.avg_for)}</td>
      <td>${formatNumber(row.points_against)}</td>
      <td>${formatNumber(row.avg_against)}</td>
      <td>${formatNumber(row.point_margin)}</td>
      <td>${formatNumber(row.avg_point_margin)}</td>
      <td>${cleanText(row.moves)}</td>
    </tr>
  `;
}

function calculateLeagueAverage(standings) {
  const averages = standings
    .map(row => Number(row.avg_for))
    .filter(value => !Number.isNaN(value));

  if (averages.length === 0) return "TBD";

  const total = averages.reduce((sum, value) => sum + value, 0);
  return (total / averages.length).toFixed(2);
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

  const cleaned = cleanText(ownerId).toLowerCase();
  return ownerMap[cleaned] || cleanText(ownerId) || "TBD";
}

function formatWinPct(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return cleanText(value) || "TBD";
  }

  return number.toFixed(2);
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

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return cleanText(value) || "TBD";
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function ordinal(number) {
  const value = Number(number);

  if (Number.isNaN(value)) return `${number}`;

  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = value % 100;

  return value + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
}

buildSeasonsPage();
