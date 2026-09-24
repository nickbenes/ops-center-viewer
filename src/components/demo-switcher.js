import { DEMOS } from '../lib/demos.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

/**
 * Renders the demo tabs + upload control. Calls onSelectDemo(demoId) or
 * onUploadFile(file) when the user picks a source.
 */
export function renderDemoSwitcher(container, { activeDemoId, uploadedFileName }, { onSelectDemo, onUploadFile }) {
  const tabsHtml = DEMOS.map(
    (demo) => `
      <button
        type="button"
        class="demo-tab${demo.id === activeDemoId ? ' active' : ''}"
        data-demo-id="${escapeHtml(demo.id)}"
        title="${escapeHtml(demo.description)}"
      >${escapeHtml(demo.label)}</button>`
  ).join('');

  container.innerHTML = `
    ${tabsHtml}
    <div class="upload-control">
      <label class="upload-button">
        Upload project-logs.csv
        <input type="file" accept=".csv,text/csv" style="display:none" />
      </label>
      ${uploadedFileName ? `<span class="upload-filename" title="${escapeHtml(uploadedFileName)}">${escapeHtml(uploadedFileName)}</span>` : ''}
    </div>
  `;

  container.querySelectorAll('.demo-tab').forEach((btn) => {
    btn.addEventListener('click', () => onSelectDemo(btn.dataset.demoId));
  });

  const fileInput = container.querySelector('input[type="file"]');
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) onUploadFile(file);
    fileInput.value = '';
  });
}
