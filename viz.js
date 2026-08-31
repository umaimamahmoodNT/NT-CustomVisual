/**
 * TOOLTIP TABLE
 * A general-purpose Community Visualization for Looker Studio: renders a
 * plain HTML table from any dimensions/metrics the user maps, and shows a
 * hover tooltip on the first column using a separate "tooltip content"
 * field that is never rendered as its own column.
 *
 * Looker Studio's native table has no tooltip support, so this works around
 * that limitation by drawing the table ourselves (via Google's dscc
 * library) and attaching real DOM hover handlers.
 */

let tooltipEl = null;

function drawViz(data) {
  const container = document.getElementById('container');
  container.innerHTML = '';

  const style = data.style || {};
  const headerBg = getStyleValue(style, 'headerBackgroundColor', '#f1f3f4');
  const fontSize = getStyleValue(style, 'fontSize', 12);
  const tooltipBg = getStyleValue(style, 'tooltipBackgroundColor', '#1f1f1f');
  const tooltipColor = getStyleValue(style, 'tooltipTextColor', '#ffffff');
  container.style.fontSize = `${fontSize}px`;

  const table = document.createElement('table');
  table.className = 'tooltip-table';

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
  const tooltipFieldId = getTooltipFieldId(data);

  data.tables.DEFAULT.forEach((row) => {
    const tr = document.createElement('tr');

    columns.forEach((col, colIndex) => {
      const td = document.createElement('td');
      const value = row[col.id];
      td.textContent = formatValue(value);

      // The first table column carries the tooltip, so users always know
      // where to hover regardless of which fields they've mapped.
      if (colIndex === 0 && tooltipFieldId) {
        const tooltipText = row[tooltipFieldId];
        if (tooltipText) {
          td.classList.add('tooltip-hover-target');
          td.addEventListener('mouseenter', (e) => showTooltip(e, tooltipText, tooltipBg, tooltipColor));
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
// Setup panel (Table Columns + Metrics), in the order they were added, so
// this adapts to any table shape instead of hardcoding column names.
function getColumns(data) {
  const cols = [];
  const fields = data.fields;

  if (fields.tableColumns) {
    fields.tableColumns.forEach((f) => cols.push({ id: f.id, label: f.name }));
  }

  if (fields.metrics) {
    fields.metrics.forEach((m) => cols.push({ id: m.id, label: m.name }));
  }

  return cols;
}

function getTooltipFieldId(data) {
  const field = data.fields.tooltipField && data.fields.tooltipField[0];
  return field ? field.id : null;
}

function formatValue(value) {
  if (value === undefined || value === null) return '';
  return String(value);
}

function getStyleValue(style, key, fallback) {
  return style[key] && style[key].value !== undefined ? style[key].value : fallback;
}

// ---------- TOOLTIP ----------
function showTooltip(mouseEvent, text, bgColor, textColor) {
  hideTooltip();
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'tooltip-popup';
  tooltipEl.textContent = text;
  tooltipEl.style.backgroundColor = bgColor;
  tooltipEl.style.color = textColor;
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
// objectTransform gives each row as an object keyed by field id — matches
// what this file reads above via col.id / tooltipFieldId.
dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
