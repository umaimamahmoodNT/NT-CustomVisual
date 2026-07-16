/**
 * SFID TARGETING TABLE
 * A minimal Community Visualization: renders a basic table (sfid, placement
 * name, dates, metrics) and shows Additional Targeting as a hover tooltip
 * on the sfid cell. This is a standalone test viz — it does not touch or
 * replace the existing production plugin.
 *
 * Built for Google's dscc (Data Studio Community Components) library.
 */

let tooltipEl = null;

function drawViz(data) {
  const container = document.getElementById('container');
  container.innerHTML = '';

  const style = data.style || {};
  const headerBg = getStyleValue(style, 'headerBackgroundColor', '#f1f3f4');
  const fontSize = getStyleValue(style, 'fontSize', 12);
  container.style.fontSize = `${fontSize}px`;

  const table = document.createElement('table');
  table.className = 'sfid-table';

  // ---------- HEADER ROW ----------
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = headerBg;

  const columns = getColumns(data);
  columns.forEach((col) => {
    const th = document.createElement('th');
    th.textContent = col.label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // ---------- BODY ROWS ----------
  const tbody = document.createElement('tbody');

  data.tables.DEFAULT.forEach((row) => {
    const tr = document.createElement('tr');

    columns.forEach((col) => {
      const td = document.createElement('td');
      const value = row[col.id];
      td.textContent = formatValue(value, col.id);

      // Attach hover behavior only to the sfid cell
      if (col.id === 'sfid') {
        const targetingText = row.additionalTargeting;
        if (targetingText) {
          td.classList.add('sfid-hover-target');
          td.addEventListener('mouseenter', (e) => showTooltip(e, targetingText));
          td.addEventListener('mousemove', (e) => positionTooltip(e));
          td.addEventListener('mouseleave', hideTooltip);
        }
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// ---------- COLUMN DEFINITIONS ----------
// Builds the column list from whatever fields the user has mapped in the
// Setup panel — so this adapts automatically if you add/remove a dimension
// or metric in Looker Studio, rather than hardcoding column names.
function getColumns(data) {
  const cols = [];
  const fields = data.fields;

  if (fields.sfid) cols.push({ id: 'sfid', label: fields.sfid[0].name });
  if (fields.placementName) cols.push({ id: 'placementName', label: fields.placementName[0].name });
  if (fields.startDate) cols.push({ id: 'startDate', label: fields.startDate[0].name });
  if (fields.endDate) cols.push({ id: 'endDate', label: fields.endDate[0].name });

  if (fields.metrics) {
    fields.metrics.forEach((m) => {
      cols.push({ id: m.id, label: m.name });
    });
  }

  return cols;
}

function formatValue(value, colId) {
  if (value === undefined || value === null) return '';
  return String(value);
}

function getStyleValue(style, key, fallback) {
  return style[key] && style[key].value !== undefined ? style[key].value : fallback;
}

// ---------- TOOLTIP ----------
function showTooltip(mouseEvent, text) {
  hideTooltip();
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'sfid-targeting-tooltip';
  tooltipEl.textContent = text;
  document.body.appendChild(tooltipEl);
  positionTooltip(mouseEvent);
}

function positionTooltip(mouseEvent) {
  if (!tooltipEl) return;
  const padding = 12;
  const { clientX, clientY } = mouseEvent;
  const rect = tooltipEl.getBoundingClientRect();

  let left = clientX + padding;
  let top = clientY + padding;

  if (left + rect.width > window.innerWidth) left = clientX - rect.width - padding;
  if (top + rect.height > window.innerHeight) top = clientY - rect.height - padding;

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}

// ---------- SUBSCRIBE TO DATA ----------
// objectTransform gives each row as an object keyed by the config field ids
// (sfid, placementName, additionalTargeting, etc.) — matches what this file
// reads above.
dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
