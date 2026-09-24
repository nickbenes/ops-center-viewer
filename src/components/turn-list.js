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

/**
 * Renders the reverse-chronological flat turn list into `container`.
 * Calls `onSelect(turnId)` when a row is clicked.
 */
export function renderTurnList(container, { turns, selectedId, error }, onSelect) {
  if (error) {
    container.innerHTML = `<p class="turn-list-error">${escapeHtml(error)}</p>`;
    return;
  }

  if (!turns || turns.length === 0) {
    container.innerHTML = '<p class="turn-list-empty">No turns loaded.</p>';
    return;
  }

  container.innerHTML = turns
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
