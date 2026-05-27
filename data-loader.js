async function loadCSV(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  const text = await response.text();
  return parseCSV(text);
}

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue.trim());
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
      }

      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentValue += char;
    }
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }

  const headers = rows[0].map(header => header.trim());

  return rows.slice(1)
    .filter(row => row.some(value => value !== ""))
    .map(row => {
      const item = {};

      headers.forEach((header, index) => {
        item[header] = row[index] || "";
      });

      return item;
    });
}
