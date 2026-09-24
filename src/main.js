import './style.css';
import { parseProjectLogsCsv, CsvSchemaError } from './lib/csv-parser.js';
import { DEMOS } from './lib/demos.js';
import { sortTurns, filterTurns, DEFAULT_SORT, SORTABLE_COLUMNS } from './lib/turn-query.js';
import { renderTurnList } from './components/turn-list.js';
import { renderDetailPanel } from './components/detail-panel.js';
import { renderDemoSwitcher } from './components/demo-switcher.js';
import { renderDiagram, highlightForTurn } from './components/diagram-view.js';

const EMPTY_FILTERS = Object.fromEntries(SORTABLE_COLUMNS.map((col) => [col, '']));

const state = {
  turns: [],
  selectedId: null,
  error: null,
  activeDemoId: null,
  uploadedFileName: null,
  diagram: null,
  sort: { ...DEFAULT_SORT },
  filters: { ...EMPTY_FILTERS },
};

const demoSwitcherEl = document.getElementById('demo-switcher');
const turnListEl = document.getElementById('turn-list');
const detailPanelEl = document.getElementById('detail-panel');
const diagramViewEl = document.getElementById('diagram-view');

function getDisplayedTurns() {
  return sortTurns(filterTurns(state.turns, state.filters), state.sort.column, state.sort.direction);
}

function render() {
  renderDemoSwitcher(
    demoSwitcherEl,
    { activeDemoId: state.activeDemoId, uploadedFileName: state.uploadedFileName },
    { onSelectDemo: selectDemo, onUploadFile: uploadFile }
  );

  const displayedTurns = getDisplayedTurns();
  renderTurnList(
    turnListEl,
    { turns: displayedTurns, selectedId: state.selectedId, error: state.error, sort: state.sort, filters: state.filters },
    { onSelect: selectTurn, onSort: sortBy, onFilterChange: setFilter }
  );

  const selectedTurn = state.turns.find((t) => t.id === state.selectedId) || null;
  renderDetailPanel(detailPanelEl, { turn: selectedTurn });
  highlightForTurn(diagramViewEl, state.diagram, state.selectedId);
}

function selectTurn(turnId) {
  state.selectedId = state.selectedId === turnId ? null : turnId;
  render();
}

function sortBy(column) {
  if (state.sort.column === column) {
    state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort = { column, direction: 'asc' };
  }
  render();
}

function setFilter(column, value) {
  state.filters[column] = value;
  render();
  // render() rebuilds the DOM, so put focus (and the caret) back where the user was typing.
  const input = turnListEl.querySelector(`.col-filter-input[data-col="${column}"]`);
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function applyCsvText(text) {
  try {
    state.turns = parseProjectLogsCsv(text);
    state.selectedId = null;
    state.error = null;
  } catch (err) {
    state.turns = [];
    state.selectedId = null;
    state.error = err instanceof CsvSchemaError ? err.message : `Failed to parse CSV: ${err.message}`;
  }
  state.filters = { ...EMPTY_FILTERS };
}

async function refreshDiagram() {
  state.diagram = await renderDiagram(diagramViewEl, state.turns);
}

async function selectDemo(demoId) {
  const demo = DEMOS.find((d) => d.id === demoId);
  if (!demo) return;
  state.activeDemoId = demoId;
  state.uploadedFileName = null;
  try {
    const res = await fetch(demo.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    applyCsvText(text);
  } catch (err) {
    state.turns = [];
    state.selectedId = null;
    state.error = `Failed to load demo data: ${err.message}`;
  }
  render();
  await refreshDiagram();
}

async function uploadFile(file) {
  state.activeDemoId = null;
  state.uploadedFileName = file.name;
  try {
    const text = await file.text();
    applyCsvText(text);
  } catch (err) {
    state.turns = [];
    state.selectedId = null;
    state.error = `Failed to read uploaded file: ${err.message}`;
  }
  render();
  await refreshDiagram();
}

const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function handleNavKeydown(e) {
  if (!NAV_KEYS.has(e.key)) return;
  if (TYPING_TAGS.has(document.activeElement?.tagName)) return;

  const displayed = getDisplayedTurns();
  if (displayed.length === 0) return;

  e.preventDefault();

  const currentIndex = displayed.findIndex((t) => t.id === state.selectedId);
  const goingBack = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
  const nextIndex =
    currentIndex === -1 ? 0 : goingBack ? Math.max(0, currentIndex - 1) : Math.min(displayed.length - 1, currentIndex + 1);

  state.selectedId = displayed[nextIndex].id;
  render();

  const selectedRow = turnListEl.querySelector('.turn-row.selected');
  if (selectedRow) selectedRow.scrollIntoView({ block: 'nearest' });
}

document.addEventListener('keydown', handleNavKeydown);

selectDemo(DEMOS[0].id);
