function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function badgeLabel(turn) {
  if (turn.comms.length === 0) return 'none';
  if (turn.comms.length === 1) return turn.comms[0].channel;
  return `${turn.comms.length} comms`;
}

function badgeClass(turn) {
  if (turn.comms.length === 0) return 'none';
  if (turn.comms.length === 1) return turn.comms[0].channel;
  return 'broadcast';
}

const HEADER_COLUMNS = [
  { key: 'turn_dttm', label: 'Turn time' },
  { key: 'thread_name', label: 'Thread' },
  { key: 'user_prompt_summary', label: 'Summary' },
  { key: 'comm_channel', label: 'Comm' },
];

function sortArrow(sort, columnKey) {
  if (!sort || sort.column !== columnKey) return '';
  return sort.direction === 'asc' ? ' ↑' : ' ↓';
}

/**
 * Renders the turn-list header (sortable columns + per-column filter
 * inputs) and the rows themselves into `container`.
 *
 * `data`: { turns, selectedId, error, sort: {column, direction}, filters }
 * `handlers`: { onSelect(turnId), onSort(columnKey), onFilterChange(columnKey, value) }
 */
export function renderTurnList(container, data, handlers) {
  const { turns, selectedId, error, sort, filters = {} } = data;
  const { onSelect, onSort, onFilterChange } = handlers;

  const headerHtml = `
    <div class="turn-list-header">
      ${HEADER_COLUMNS.map(
        (col) => `
        <button type="button" class="col-sort-button" data-col="${col.key}" aria-label="Sort by ${escapeHtml(col.label)}">
          ${escapeHtml(col.label)}${sortArrow(sort, col.key)}
        </button>`
      ).join('')}
    </div>
    <div class="turn-list-filters">
      ${HEADER_COLUMNS.map(
        (col) => `
        <input
          type="text"
          class="col-filter-input"
          data-col="${col.key}"
          placeholder="Filter..."
          value="${escapeHtml(filters[col.key] || '')}"
        />`
      ).join('')}
    </div>`;

  let bodyHtml;
  if (error) {
    bodyHtml = `<p class="turn-list-error">${escapeHtml(error)}</p>`;
  } else if (!turns || turns.length === 0) {
    bodyHtml = '<p class="turn-list-empty">No turns match.</p>';
  } else {
    bodyHtml = turns
      .map(
        (turn) => `
        <div class="turn-row${turn.id === selectedId ? ' selected' : ''}" data-turn-id="${escapeHtml(turn.id)}" role="button" tabindex="0">
          <span class="turn-dttm">${escapeHtml(turn.turn_dttm)}</span>
          <span class="thread-name">${escapeHtml(turn.thread_name)}</span>
          <span class="prompt-summary">${escapeHtml(turn.user_prompt_summary)}</span>
          <span class="comm-badge ${escapeHtml(badgeClass(turn))}">${escapeHtml(badgeLabel(turn))}</span>
        </div>`
      )
      .join('');
  }

  container.innerHTML = `${headerHtml}<div class="turn-rows">${bodyHtml}</div>`;

  container.querySelectorAll('.col-sort-button').forEach((btn) => {
    btn.addEventListener('click', () => onSort(btn.dataset.col));
  });

  container.querySelectorAll('.col-filter-input').forEach((input) => {
    input.addEventListener('input', () => onFilterChange(input.dataset.col, input.value));
  });

  container.querySelectorAll('.turn-row').forEach((row) => {
    const select = () => onSelect(row.dataset.turnId);
    row.addEventListener('click', select);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select();
      }
    });
  });
}
