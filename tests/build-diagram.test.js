import { describe, it, expect } from 'vitest';
import { buildDiagram } from '../src/lib/build-diagram.js';
import { parseProjectLogsCsv, COLUMNS } from '../src/lib/csv-parser.js';

const HEADER = COLUMNS.join(',');

describe('buildDiagram', () => {
  it('creates one node per distinct thread_name and comm_to value', () => {
    const csv = [
      HEADER,
      '2026-09-20T10:00:00-04:00,orchestrator,t,summary,researcher,direct_message,-',
      '2026-09-20T10:01:00-04:00,researcher,t,summary,none,none,none',
    ].join('\n');
    const turns = parseProjectLogsCsv(csv);
    const { nodeIds } = buildDiagram(turns);
    expect([...nodeIds.keys()].sort()).toEqual(['orchestrator', 'researcher']);
  });

  it('creates one edge per comm, distinct from an unrelated turn with no comms', () => {
    const csv = [
      HEADER,
      '2026-09-20T10:00:00-04:00,orchestrator,t,summary,researcher,direct_message,-',
      '2026-09-20T10:01:00-04:00,researcher,t,summary,none,none,none',
    ].join('\n');
    const turns = parseProjectLogsCsv(csv);
    const { edges } = buildDiagram(turns);
    expect(edges).toHaveLength(1);
    expect(edges[0].channel).toBe('direct_message');
  });

  it('creates one edge per comm_to destination for a broadcast to multiple recipients', () => {
    const csv = [
      HEADER,
      '2026-09-20T10:00:00-04:00,researcher,t,summary,todo-agent|orchestrator,broadcast|broadcast,ref|ref',
    ].join('\n');
    const turns = parseProjectLogsCsv(csv);
    const { edges, nodeIds } = buildDiagram(turns);
    expect(edges).toHaveLength(2);
    expect([...nodeIds.keys()].sort()).toEqual(['orchestrator', 'researcher', 'todo-agent']);
  });

  it('produces a valid mermaid flowchart definition', () => {
    const csv = [
      HEADER,
      '2026-09-20T10:00:00-04:00,orchestrator,t,summary,researcher,direct_message,-',
    ].join('\n');
    const turns = parseProjectLogsCsv(csv);
    const { definition } = buildDiagram(turns);
    expect(definition).toMatch(/^flowchart LR/);
    expect(definition).toContain('-->');
  });

  it('links each edge back to the originating turn id for row<->diagram highlighting', () => {
    const csv = [
      HEADER,
      '2026-09-20T10:00:00-04:00,orchestrator,t,summary,researcher,direct_message,-',
    ].join('\n');
    const turns = parseProjectLogsCsv(csv);
    const { edges } = buildDiagram(turns);
    expect(edges[0].turnId).toBe(turns[0].id);
  });
});
