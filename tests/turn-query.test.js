import { describe, it, expect } from 'vitest';
import { sortTurns, filterTurns, DEFAULT_SORT } from '../src/lib/turn-query.js';
import { parseProjectLogsCsv, COLUMNS } from '../src/lib/csv-parser.js';

const HEADER = COLUMNS.join(',');

function turnsFrom(rows) {
  return parseProjectLogsCsv([HEADER, ...rows].join('\n'));
}

describe('sortTurns', () => {
  const rows = [
    '2026-09-20T09:00:00-04:00,orchestrator,t,first,none,none,none',
    '2026-09-20T11:00:00-04:00,researcher,t,third,none,none,none',
    '2026-09-20T10:00:00-04:00,todo-agent,t,second,none,none,none',
  ];

  it('sorts by turn_dttm ascending (chronological, the new default)', () => {
    const sorted = sortTurns(turnsFrom(rows), DEFAULT_SORT.column, DEFAULT_SORT.direction);
    expect(sorted.map((t) => t.user_prompt_summary)).toEqual(['first', 'second', 'third']);
  });

  it('sorts by turn_dttm descending', () => {
    const sorted = sortTurns(turnsFrom(rows), 'turn_dttm', 'desc');
    expect(sorted.map((t) => t.user_prompt_summary)).toEqual(['third', 'second', 'first']);
  });

  it('sorts by thread_name ascending, case-insensitively', () => {
    const sorted = sortTurns(turnsFrom(rows), 'thread_name', 'asc');
    expect(sorted.map((t) => t.thread_name)).toEqual(['orchestrator', 'researcher', 'todo-agent']);
  });

  it('sorts by user_prompt_summary', () => {
    const sorted = sortTurns(turnsFrom(rows), 'user_prompt_summary', 'asc');
    expect(sorted.map((t) => t.user_prompt_summary)).toEqual(['first', 'second', 'third']);
  });

  it('sorts by comm_channel, grouping turns with no comms under "none"', () => {
    const commRows = [
      '2026-09-20T09:00:00-04:00,a,t,no-comm,none,none,none',
      '2026-09-20T09:01:00-04:00,b,t,has-broadcast,c,broadcast,-',
      '2026-09-20T09:02:00-04:00,c,t,has-direct,a,direct_message,-',
    ];
    const sorted = sortTurns(turnsFrom(commRows), 'comm_channel', 'asc');
    expect(sorted.map((t) => t.user_prompt_summary)).toEqual(['has-broadcast', 'has-direct', 'no-comm']);
  });

  it('falls back to turn_dttm for an unknown column', () => {
    const sorted = sortTurns(turnsFrom(rows), 'not_a_real_column', 'asc');
    expect(sorted.map((t) => t.user_prompt_summary)).toEqual(['first', 'second', 'third']);
  });

  it('does not mutate the input array', () => {
    const input = turnsFrom(rows);
    const originalOrder = input.map((t) => t.id);
    sortTurns(input, 'turn_dttm', 'desc');
    expect(input.map((t) => t.id)).toEqual(originalOrder);
  });
});

describe('filterTurns', () => {
  const rows = [
    '2026-09-20T09:00:00-04:00,orchestrator,t,Kick off the cycle,researcher,direct_message,-',
    '2026-09-20T09:01:00-04:00,researcher,t,Found 3 listings,todo-agent,broadcast,memory/listings.md',
    '2026-09-20T09:02:00-04:00,todo-agent,t,Wrote the todo list,orchestrator,shared_file,memory/todos.md',
  ];

  it('returns all turns when no filters are set', () => {
    expect(filterTurns(turnsFrom(rows), {})).toHaveLength(3);
    expect(filterTurns(turnsFrom(rows), { thread_name: '', user_prompt_summary: '  ' })).toHaveLength(3);
  });

  it('filters by a case-insensitive substring on thread_name', () => {
    const result = filterTurns(turnsFrom(rows), { thread_name: 'RESEARCH' });
    expect(result.map((t) => t.thread_name)).toEqual(['researcher']);
  });

  it('filters by user_prompt_summary substring', () => {
    const result = filterTurns(turnsFrom(rows), { user_prompt_summary: 'todo list' });
    expect(result).toHaveLength(1);
    expect(result[0].thread_name).toBe('todo-agent');
  });

  it('filters by comm_channel substring, matching either channel or comm_to', () => {
    const byChannel = filterTurns(turnsFrom(rows), { comm_channel: 'broadcast' });
    expect(byChannel).toHaveLength(1);

    const byTo = filterTurns(turnsFrom(rows), { comm_channel: 'orchestrator' });
    expect(byTo).toHaveLength(1);
    expect(byTo[0].thread_name).toBe('todo-agent');
  });

  it('combines multiple active filters with AND semantics', () => {
    const result = filterTurns(turnsFrom(rows), { thread_name: 'agent', comm_channel: 'shared_file' });
    expect(result).toHaveLength(1);
    expect(result[0].thread_name).toBe('todo-agent');
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterTurns(turnsFrom(rows), { thread_name: 'nonexistent' })).toEqual([]);
  });
});
