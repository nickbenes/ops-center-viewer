// Derives a Mermaid flowchart definition from parsed turns, per the design
// decision: one node per distinct entity found in thread_name and every
// value appearing in comm_to; one edge per communication row between its
// thread and each comm_to destination, styled by comm_channel.

function sanitizeId(raw) {
  // Mermaid node ids can't contain most punctuation; slugify and keep a
  // stable, collision-resistant id distinct from the display label.
  return `n_${raw.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

const CHANNEL_STYLE = {
  direct_message: { arrow: '-->', label: 'direct' },
  broadcast: { arrow: '-.->', label: 'broadcast' },
  shared_file: { arrow: '-.->', label: 'shared file' },
  none: { arrow: '---', label: '' },
};

/**
 * Builds { definition, nodeIds, edges } from a list of parsed turns.
 * `edges` carries enough info (turnId, fromId, toId) for row<->diagram
 * highlighting; `nodeIds` maps entity name -> mermaid node id.
 */
export function buildDiagram(turns) {
  const entities = new Set();
  for (const turn of turns) {
    entities.add(turn.thread_name);
    for (const comm of turn.comms) entities.add(comm.to);
  }

  const nodeIds = new Map();
  for (const entity of entities) nodeIds.set(entity, sanitizeId(entity));

  const lines = ['flowchart LR'];
  for (const entity of entities) {
    const id = nodeIds.get(entity);
    lines.push(`  ${id}("${entity.replace(/"/g, '#quot;')}")`);
  }

  const edges = [];
  for (const turn of turns) {
    const fromId = nodeIds.get(turn.thread_name);
    for (const comm of turn.comms) {
      const toId = nodeIds.get(comm.to);
      const style = CHANNEL_STYLE[comm.channel] || CHANNEL_STYLE.none;
      const edgeIndex = edges.length;
      const label = style.label ? `|${style.label}|` : '';
      lines.push(`  ${fromId} ${style.arrow}${label} ${toId}`);
      edges.push({ turnId: turn.id, fromId, toId, edgeIndex, channel: comm.channel });
    }
  }

  return { definition: lines.join('\n'), nodeIds, edges };
}
