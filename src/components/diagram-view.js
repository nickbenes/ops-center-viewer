import mermaid from 'mermaid';
import { buildDiagram } from '../lib/build-diagram.js';

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base' });

let renderCounter = 0;

/**
 * Renders the Mermaid agent-comms diagram for the current turn set into
 * `container`. Returns the built diagram's edge/node metadata so the caller
 * can drive row<->diagram highlighting.
 */
export async function renderDiagram(container, turns) {
  const diagram = buildDiagram(turns);

  if (diagram.nodeIds.size === 0) {
    container.innerHTML = '<p class="diagram-empty">No entities to diagram.</p>';
    return diagram;
  }

  const id = `diagram-${renderCounter++}`;
  try {
    const { svg } = await mermaid.render(id, diagram.definition);
    container.innerHTML = svg;
  } catch (err) {
    container.innerHTML = `<p class="diagram-empty">Failed to render diagram: ${err.message}</p>`;
  }
  return diagram;
}

/**
 * Clears any highlight classes, then (if turnId is set) highlights the
 * nodes/edges for every comm on that turn.
 */
export function highlightForTurn(container, diagram, turnId) {
  container.querySelectorAll('.node.highlighted').forEach((el) => el.classList.remove('highlighted'));
  container.querySelectorAll('path.flowchart-link.highlighted').forEach((el) => el.classList.remove('highlighted'));

  if (!turnId || !diagram) return;

  const matchingEdges = diagram.edges.filter((e) => e.turnId === turnId);
  for (const edge of matchingEdges) {
    highlightNode(container, edge.fromId);
    highlightNode(container, edge.toId);
    highlightEdge(container, edge.edgeIndex);
  }
}

function highlightNode(container, nodeId) {
  // Mermaid prefixes node element ids with its own render id, so match on
  // the "flowchart-<nodeId>-" segment rather than the full id.
  const el = container.querySelector(`[id*="flowchart-${nodeId}-"]`);
  if (el) el.classList.add('highlighted');
}

function highlightEdge(container, edgeIndex) {
  // Edge paths render in the same order they're written into the diagram
  // definition, so the Nth edge we built corresponds to the Nth path here.
  const path = container.querySelectorAll('path.flowchart-link')[edgeIndex];
  if (path) path.classList.add('highlighted');
}
