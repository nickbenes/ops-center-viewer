function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

const RAW_FIELDS = [
  'turn_dttm',
  'thread_name',
  'thread_dttm',
  'user_prompt_summary',
  'comm_to',
  'comm_channel',
  'comm_ref',
];

/**
 * Renders the "raw" full 7-column CSV row for the selected turn,
 * Redux-DevTools style (this panel sits to the right of the turn list).
 */
export function renderDetailPanel(container, { turn }) {
  if (!turn) {
    container.innerHTML = '<p class="detail-empty">Select a row to see its raw fields.</p>';
    return;
  }

  const fieldsHtml = RAW_FIELDS.map(
    (field) => `
      <dt>${escapeHtml(field)}</dt>
      <dd>${escapeHtml(turn[field] || '')}</dd>`
  ).join('');

  const commsHtml =
    turn.comms.length === 0
      ? ''
      : `
      <h2>Parsed comms (${turn.comms.length})</h2>
      <table class="detail-comms-table">
        <thead>
          <tr><th>to</th><th>channel</th><th>ref</th></tr>
        </thead>
        <tbody>
          ${turn.comms
            .map(
              (c) => `<tr><td>${escapeHtml(c.to)}</td><td>${escapeHtml(c.channel)}</td><td>${escapeHtml(c.ref)}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>`;

  container.innerHTML = `
    <h2>Raw session-log entry</h2>
    <dl>${fieldsHtml}</dl>
    ${commsHtml}
  `;
}
