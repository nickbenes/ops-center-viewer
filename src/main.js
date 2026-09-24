import './style.css';
import { parseProjectLogsCsv, CsvSchemaError } from './lib/csv-parser.js';
import { DEMOS } from './lib/demos.js';
import { renderTurnList } from './components/turn-list.js';
import { renderDetailPanel } from './components/detail-panel.js';
import { renderDemoSwitcher } from './components/demo-switcher.js';
import { renderDiagram, highlightForTurn } from './components/diagram-view.js';

const state = {
  turns: [],
  selectedId: null,
  error: null,
  activeDemoId: null,
  uploadedFileName: null,
  diagram: null,
};

const demoSwitcherEl = document.getElementById('demo-switcher');
const turnListEl = document.getElementById('turn-list');
const detailPanelEl = document.getElementById('detail-panel');
const diagramViewEl = document.getElementById('diagram-view');

function render() {
  renderDemoSwitcher(
    demoSwitcherEl,
    { activeDemoId: state.activeDemoId, uploadedFileName: state.uploadedFileName },
    { onSelectDemo: selectDemo, onUploadFile: uploadFile }
  );
  renderTurnList(turnListEl, state, selectTurn);
  const selectedTurn = state.turns.find((t) => t.id === state.selectedId) || null;
  renderDetailPanel(detailPanelEl, { turn: selectedTurn });
  highlightForTurn(diagramViewEl, state.diagram, state.selectedId);
}

function selectTurn(turnId) {
  state.selectedId = state.selectedId === turnId ? null : turnId;
  renderTurnList(turnListEl, state, selectTurn);
  const selectedTurn = state.turns.find((t) => t.id === state.selectedId) || null;
  renderDetailPanel(detailPanelEl, { turn: selectedTurn });
  highlightForTurn(diagramViewEl, state.diagram, state.selectedId);
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

selectDemo(DEMOS[0].id);
