// Sorting/filtering for the turn list. Kept separate from csv-parser.js so
// the parser stays a pure "text in, turns out" function.

const SORT_KEY_FNS = {
  turn_dttm: (t) => t.turn_dttm,
  thread_name: (t) => t.thread_name.toLowerCase(),
  user_prompt_summary: (t) => t.user_prompt_summary.toLowerCase(),
  comm_channel: (t) => (t.comms.length === 0 ? 'none' : t.comms.map((c) => c.channel).sort().join(',')),
};

export const SORTABLE_COLUMNS = Object.keys(SORT_KEY_FNS);
export const DEFAULT_SORT = { column: 'turn_dttm', direction: 'asc' };

/**
 * Stable sort of `turns` by one of SORTABLE_COLUMNS, ascending or descending.
 * Unknown columns fall back to turn_dttm.
 */
export function sortTurns(turns, column, direction) {
  const keyFn = SORT_KEY_FNS[column] || SORT_KEY_FNS[DEFAULT_SORT.column];
  const sorted = [...turns].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

function filterHaystack(turn, column) {
  switch (column) {
    case 'turn_dttm':
      return turn.turn_dttm.toLowerCase();
    case 'thread_name':
      return turn.thread_name.toLowerCase();
    case 'user_prompt_summary':
      return turn.user_prompt_summary.toLowerCase();
    case 'comm_channel':
      return `${turn.comm_channel} ${turn.comm_to}`.toLowerCase();
    default:
      return '';
  }
}

/**
 * Keeps only turns matching every active filter. `filters` is
 * { [column]: substring }; blank/whitespace-only values are ignored.
 * Matching is a case-insensitive substring match.
 */
export function filterTurns(turns, filters) {
  const active = Object.entries(filters || {}).filter(([, v]) => v && v.trim() !== '');
  if (active.length === 0) return turns;

  return turns.filter((turn) =>
    active.every(([column, value]) => filterHaystack(turn, column).includes(value.trim().toLowerCase()))
  );
}
