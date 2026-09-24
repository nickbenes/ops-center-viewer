import { describe, it, expect } from 'vitest';
import { parseProjectLogsCsv, parseCsvRows, CsvSchemaError, COLUMNS } from '../src/lib/csv-parser.js';

const HEADER = COLUMNS.join(',');

describe('parseCsvRows', () => {
  it('splits simple comma-separated rows', () => {
    const rows = parseCsvRows('a,b,c\n1,2,3\n');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const rows = parseCsvRows('a,b\n"hello, world",2\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['hello, world', '2'],
    ]);
  });

  it('handles doubled-quote escaping inside quoted fields', () => {
    const rows = parseCsvRows('a\n"she said ""hi"""\n');
    expect(rows).toEqual([['a'], ['she said "hi"']]);
  });

  it('handles embedded newlines inside quoted fields', () => {
    const rows = parseCsvRows('a,b\n"line1\nline2",2\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['line1\nline2', '2'],
    ]);
  });

  it('handles a final row with no trailing newline', () => {
    const rows = parseCsvRows('a,b\n1,2');
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('strips carriage returns from CRLF line endings', () => {
    const rows = parseCsvRows('a,b\r\n1,2\r\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('parseProjectLogsCsv', () => {
  it('parses a well-formed row into a turn object', () => {
    const csv = `${HEADER}\n2026-09-20T10:00:00-04:00,orchestrator,2026-09-20T09:00:00-04:00,"Kick off the job search team",none,none,none\n`;
    const turns = parseProjectLogsCsv(csv);
    expect(turns).toHaveLength(1);
    expect(turns[0]).toMatchObject({
      turn_dttm: '2026-09-20T10:00:00-04:00',
      thread_name: 'orchestrator',
      thread_dttm: '2026-09-20T09:00:00-04:00',
      user_prompt_summary: 'Kick off the job search team',
      comm_to: 'none',
      comm_channel: 'none',
      comm_ref: 'none',
      comms: [],
    });
  });

  it('parses turns in file row order, unsorted (sorting is the caller\'s job)', () => {
    const csv = [
      HEADER,
      '2026-09-20T09:00:00-04:00,a,t,first,none,none,none',
      '2026-09-20T11:00:00-04:00,a,t,third,none,none,none',
      '2026-09-20T10:00:00-04:00,a,t,second,none,none,none',
    ].join('\n');
    const turns = parseProjectLogsCsv(csv);
    expect(turns.map((t) => t.user_prompt_summary)).toEqual(['first', 'third', 'second']);
  });

  it('expands pipe-delimited comm_to/comm_channel/comm_ref into positional comms', () => {
    const csv = `${HEADER}\n2026-09-20T10:00:00-04:00,researcher,t,"Found 3 listings",orchestrator|todo-agent,direct_message|broadcast,-|memory/listings.md\n`;
    const turns = parseProjectLogsCsv(csv);
    expect(turns[0].comms).toEqual([
      { to: 'orchestrator', channel: 'direct_message', ref: '' },
      { to: 'todo-agent', channel: 'broadcast', ref: 'memory/listings.md' },
    ]);
  });

  it('treats comm_to=none as no comms', () => {
    const csv = `${HEADER}\n2026-09-20T10:00:00-04:00,a,t,summary,none,none,none\n`;
    const turns = parseProjectLogsCsv(csv);
    expect(turns[0].comms).toEqual([]);
  });

  it('throws CsvSchemaError on an unexpected header', () => {
    const csv = 'foo,bar\n1,2\n';
    expect(() => parseProjectLogsCsv(csv)).toThrow(CsvSchemaError);
  });

  it('skips blank trailing lines', () => {
    const csv = `${HEADER}\n2026-09-20T10:00:00-04:00,a,t,summary,none,none,none\n\n`;
    const turns = parseProjectLogsCsv(csv);
    expect(turns).toHaveLength(1);
  });

  it('returns an empty array for a header-only file', () => {
    const turns = parseProjectLogsCsv(`${HEADER}\n`);
    expect(turns).toEqual([]);
  });

  it('assigns each turn a stable unique id', () => {
    const csv = [
      HEADER,
      '2026-09-20T09:00:00-04:00,a,t1,first,none,none,none',
      '2026-09-20T09:00:00-04:00,a,t2,second,none,none,none',
    ].join('\n');
    const turns = parseProjectLogsCsv(csv);
    expect(turns[0].id).not.toEqual(turns[1].id);
  });
});
