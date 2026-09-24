import './style.css';
import { parseProjectLogsCsv, CsvSchemaError } from './lib/csv-parser.js';
import { DEMOS } from './lib/demos.js';
import { renderTurnList } from './components/turn-list.js';
import { renderDetailPanel } from './components/detail-panel.js';

const state = {
  turns: [],
  selectedId: null,
  error: null,
};

const turnListEl = document.getElementById('turn-list');
const detailPanelEl = document.getElementById('detail-panel');

function render() {
  renderTurnList(turnListEl, state, (turnId) => {
    state.selectedId = state.selectedId === turnId ? null : turnId;
    render();
  });
  const selectedTurn = state.turns.find((t) => t.id === state.selectedId) || null;
  renderDetailPanel(detailPanelEl, { turn: selectedTurn });
}

async function loadCsvText(text) {
  try {
    state.turns = parseProjectLogsCsv(text);
    state.selectedId = null;
    state.error = null;
  } catch (err) {
    state.turns = [];
    state.selectedId = null;
    state.error = err instanceof CsvSchemaError ? err.message : `Failed to parse CSV: ${err.message}`;
  }
  render();
}

async function loadInitialDemo() {
  const demo = DEMOS[0];
  try {
    const res = await fetch(demo.file);
    const text = await res.text();
    await loadCsvText(text);
  } catch (err) {
    state.error = `Failed to load demo data: ${err.message}`;
    render();
  }
}

loadInitialDemo();
