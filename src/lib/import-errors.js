function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderSkippedRows(errors) {
  if (!errors.length) return "";
  const count = errors.length;
  const label = `${count} row${count === 1 ? "" : "s"} skipped`;
  return `<details class="notice import-errors">
    <summary><strong>${label}.</strong> Review every skipped row and reason</summary>
    <ul>${errors.map(({ row, message }) => `<li><strong>Row ${escapeHtml(row)}:</strong> ${escapeHtml(message)}</li>`).join("")}</ul>
  </details>`;
}
