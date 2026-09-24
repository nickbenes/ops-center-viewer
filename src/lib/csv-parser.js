// Parser for ops-center's project-logs.csv / session-log.csv schema.
// Schema (from ops-center's references/logging-protocol.md) is treated as finalized:
// turn_dttm,thread_name,thread_dttm,user_prompt_summary,comm_to,comm_channel,comm_ref
// comm_to/comm_channel/comm_ref are pipe-delimited and positionally matched, or "none".

export const COLUMNS = [
  'turn_dttm',
  'thread_name',
  'thread_dttm',
  'user_prompt_summary',
  'comm_to',
  'comm_channel',
  'comm_ref',
];

export class CsvSchemaError extends Error {}

/**
 * Parse project-logs.csv text into an array of turn objects, in file row
 * order. Sorting/filtering for display is the caller's responsibility
 * (see lib/turn-query.js) — this just parses.
 */
export function parseProjectLogsCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];

  const [header, ...dataRows] = rows;
  validateHeader(header);

  return dataRows
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row, index) => rowToTurn(row, index));
}

function validateHeader(header) {
  const normalized = header.map((h) => h.trim());
  const matches =
    normalized.length === COLUMNS.length && COLUMNS.every((col, i) => normalized[i] === col);
  if (!matches) {
    throw new CsvSchemaError(
      `Unexpected CSV header. Expected columns: ${COLUMNS.join(',')}. Got: ${normalized.join(',')}`
    );
  }
}

function rowToTurn(row, index) {
  const [turn_dttm, thread_name, thread_dttm, user_prompt_summary, comm_to, comm_channel, comm_ref] =
    COLUMNS.map((_, i) => (row[i] ?? '').trim());

  return {
    id: `${thread_dttm}__${turn_dttm}__${index}`,
    turn_dttm,
    thread_name,
    thread_dttm,
    user_prompt_summary,
    comm_to,
    comm_channel,
    comm_ref,
    comms: splitComms(comm_to, comm_channel, comm_ref),
  };
}

/**
 * Expand the pipe-delimited, positionally-matched comm_to/comm_channel/comm_ref
 * fields into a list of { to, channel, ref } objects. Empty for comm_to === "none".
 */
function splitComms(commTo, commChannel, commRef) {
  if (!commTo || commTo === 'none') return [];

  const toParts = commTo.split('|').map((s) => s.trim());
  const channelParts = commChannel.split('|').map((s) => s.trim());
  const refParts = commRef.split('|').map((s) => s.trim());

  return toParts.map((to, i) => ({
    to,
    channel: channelParts[i] || 'none',
    ref: refParts[i] && refParts[i] !== '-' ? refParts[i] : '',
  }));
}

/**
 * RFC 4180-style CSV row tokenizer: handles quoted fields, embedded commas,
 * embedded newlines, and doubled-quote escaping ("" -> ").
 */
export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;
  let sawAnyField = false;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      sawAnyField = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      sawAnyField = true;
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      sawAnyField = false;
      i += 1;
      continue;
    }
    field += char;
    sawAnyField = true;
    i += 1;
  }

  if (sawAnyField || field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
