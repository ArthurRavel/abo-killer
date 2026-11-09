import { detectAdapter, normalizeRows, parseCsv, suggestMapping } from "./lib/csv.js";
import { createSafeSummary, detectRecurring, totalsByCurrency } from "./lib/recurrence.js";
import { SAMPLE_CSV, SAMPLE_FILENAME } from "./sample-data.js";

const app = document.querySelector("#app");
const announcer = document.querySelector("#announcer");

const state = {
  phase: "landing",
  filename: "",
  parsed: null,
  adapter: null,
  mapping: null,
  transactions: [],
  rowErrors: [],
  selectedTransactions: new Set(),
  candidates: [],
  selectedCandidates: new Set(),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function announce(message) {
  announcer.textContent = "";
  window.setTimeout(() => { announcer.textContent = message; }, 20);
}

function focusView(selector = ".view-heading") {
  window.requestAnimationFrame(() => {
    document.querySelector(selector)?.focus({ preventScroll: true });
  });
}

function scrollToTop() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function progress(active) {
  const steps = [
    { label: "Review transactions", shortLabel: "Import" },
    { label: "Review matches", shortLabel: "Matches" },
    { label: "Your summary", shortLabel: "Summary" },
  ];
  return `<nav class="progress" aria-label="Analysis progress">
    ${steps.map(({ label, shortLabel }, index) => {
      const position = index + 1;
      const className = position === active ? "active" : position < active ? "done" : "";
      const number = position < active ? "✓" : position;
      return `<div class="progress-item ${className}" ${position === active ? 'aria-current="step"' : ""}>
        <span class="step-number" aria-hidden="true">${number}</span>
        <span class="step-label"><span class="step-label-full">${label}</span><span class="step-label-short">${shortLabel}</span></span>
      </div>`;
    }).join("")}
  </nav>`;
}

function renderLanding({ focusHeading = false } = {}) {
  state.phase = "landing";
  app.innerHTML = `<section class="hero">
    <div class="hero-copy">
      <h1 class="view-heading" tabindex="-1">Find the <span class="strike">quiet drain.</span></h1>
      <p>Drop in a European bank CSV. Abo Killer finds recurring charges, shows its evidence, and lets you decide what counts—before revealing a total.</p>
      <ul class="proof-row" aria-label="Product guarantees">
        <li>Zero uploads</li><li>Explainable matches</li><li>No account needed</li><li>Open source</li>
      </ul>
    </div>
    <div class="drop-card">
      <div class="drop-zone" id="drop-zone">
        <div class="upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14" /></svg></div>
        <strong>Drop your CSV here</strong>
        <p>Your file stays in this tab. N26, Revolut, Wise, and other CSVs are supported.</p>
        <div class="button-row">
          <button class="button primary" id="choose-file" type="button">Choose CSV</button>
          <button class="button secondary light" id="use-demo" type="button">Try synthetic demo</button>
        </div>
        <input class="file-input" id="file-input" type="file" accept=".csv,text/csv" />
      </div>
    </div>
  </section>`;
  bindLanding();
  if (focusHeading) focusView();
}

function bindLanding() {
  const input = document.querySelector("#file-input");
  const dropZone = document.querySelector("#drop-zone");
  document.querySelector("#choose-file").addEventListener("click", () => input.click());
  document.querySelector("#use-demo").addEventListener("click", () => loadCsv(SAMPLE_CSV, SAMPLE_FILENAME));
  input.addEventListener("change", () => input.files[0] && readFile(input.files[0]));
  ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  }));
  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    if (file) readFile(file);
  });
}

async function readFile(file) {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    renderError("Unsupported file", "This baseline accepts CSV files. PDF is deliberately not enabled until text extraction can be tested reliably; scanned PDFs will remain unsupported.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    renderError("File too large", "Choose a CSV smaller than 10 MB. This limit keeps processing responsive in your tab.");
    return;
  }
  try {
    loadCsv(await file.text(), file.name);
  } catch (error) {
    renderError("Could not read that file", error.message);
  }
}

function loadCsv(text, filename) {
  try {
    const parsed = parseCsv(text);
    const adapter = detectAdapter(parsed.headers);
    const mapping = adapter?.mapping ?? suggestMapping(parsed.headers);
    state.filename = filename;
    state.parsed = parsed;
    state.adapter = adapter;
    state.mapping = { ...mapping };
    applyMapping();
    state.phase = "transactions";
    renderTransactionReview({ focusHeading: true });
    announce(`${state.transactions.length} transactions loaded for review.`);
  } catch (error) {
    renderError("Could not parse that CSV", error.message);
  }
}

function applyMapping() {
  try {
    const result = normalizeRows(state.parsed, state.mapping);
    state.transactions = result.transactions;
    state.rowErrors = result.errors;
    state.selectedTransactions = new Set(state.transactions.map(({ id }) => id));
  } catch (error) {
    state.transactions = [];
    state.rowErrors = [{ row: "—", message: error.message }];
    state.selectedTransactions = new Set();
  }
}

function mappingFields() {
  if (state.adapter) {
    return `<div class="notice">Detected <strong>${escapeHtml(state.adapter.name)}</strong>. We mapped its known export columns automatically; verify the rows below before continuing.</div>`;
  }
  const option = (value, label, selected) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
  const select = (field, label, allowBlank = false) => `<label>${label}<select data-map="${field}">
    ${allowBlank ? option("", "Use EUR", state.mapping[field]) : option("", "Choose a column…", state.mapping[field])}
    ${state.parsed.headers.map((header) => option(header, header, state.mapping[field])).join("")}
  </select></label>`;
  return `<div class="notice"><strong>Generic CSV:</strong> confirm which columns contain the required values. Currency defaults to EUR when no column is selected.</div>
    <div class="mapping-grid">
      ${select("date", "Date column")}${select("description", "Description column")}${select("amount", "Amount column")}${select("currency", "Currency column", true)}
    </div>`;
}

function renderTransactionReview({ focusHeading = false, focusMap = "" } = {}) {
  const preview = state.transactions.slice(0, 18);
  app.innerHTML = `<section class="workspace">
    ${progress(1)}
    <div class="panel">
      <header class="panel-head">
        <div><p class="step-kicker">Step 1 of 3</p><h2 class="view-heading" tabindex="-1">Check the import</h2><p>Nothing is counted yet. Exclude anything that was parsed incorrectly.</p></div>
        <div class="file-chip">${escapeHtml(state.filename)}</div>
      </header>
      <div class="panel-body">
        ${mappingFields()}
        ${state.rowErrors.length ? `<div class="notice"><strong>${state.rowErrors.length} row${state.rowErrors.length === 1 ? "" : "s"} skipped.</strong> ${escapeHtml(state.rowErrors.slice(0, 3).map((error) => `Row ${error.row}: ${error.message}`).join(" · "))}</div>` : ""}
        ${preview.length ? `<div class="table-wrap"><table>
          <thead><tr><th><span class="sr-only">Include</span></th><th>Date</th><th>Description</th><th>Currency</th><th class="amount">Amount</th></tr></thead>
          <tbody>${preview.map((transaction) => `<tr>
            <td><label class="check-control"><input class="check transaction-toggle" type="checkbox" data-id="${escapeHtml(transaction.id)}" ${state.selectedTransactions.has(transaction.id) ? "checked" : ""} aria-label="Include row ${transaction.sourceRow}" /></label></td>
            <td>${escapeHtml(transaction.date)}</td><td>${escapeHtml(transaction.description)}</td><td>${escapeHtml(transaction.currency)}</td>
            <td class="amount ${transaction.amount > 0 ? "positive" : ""}">${escapeHtml(formatMoney(transaction.amount, transaction.currency))}</td>
          </tr>`).join("")}</tbody>
        </table></div>${state.transactions.length > preview.length ? `<p class="more-row">+ ${state.transactions.length - preview.length} more parsed rows included in analysis</p>` : ""}` : `<div class="empty-state"><p>No valid rows yet. Choose the required columns above.</p></div>`}
      </div>
      <footer class="panel-actions">
        <p><strong id="selected-count">${state.selectedTransactions.size}</strong> parsed rows selected · analysis happens in memory</p>
        <div class="button-row"><button class="button secondary" id="start-over" type="button">Start over</button><button class="button primary" id="analyze" type="button" ${state.selectedTransactions.size ? "" : "disabled"}>Find recurring charges</button></div>
      </footer>
    </div>
  </section>`;
  bindTransactionReview();
  if (focusMap) focusView(`[data-map="${focusMap}"]`);
  else if (focusHeading) focusView();
}

function bindTransactionReview() {
  document.querySelectorAll("[data-map]").forEach((select) => select.addEventListener("change", () => {
    const field = select.dataset.map;
    state.mapping[field] = select.value;
    if (field === "currency") state.mapping.fixedCurrency = select.value ? "" : "EUR";
    applyMapping();
    renderTransactionReview({ focusMap: field });
  }));
  document.querySelectorAll(".transaction-toggle").forEach((checkbox) => checkbox.addEventListener("change", () => {
    if (checkbox.checked) state.selectedTransactions.add(checkbox.dataset.id);
    else state.selectedTransactions.delete(checkbox.dataset.id);
    document.querySelector("#selected-count").textContent = state.selectedTransactions.size;
    document.querySelector("#analyze").disabled = state.selectedTransactions.size === 0;
  }));
  document.querySelector("#start-over").addEventListener("click", reset);
  document.querySelector("#analyze").addEventListener("click", () => {
    const selected = state.transactions.filter(({ id }) => state.selectedTransactions.has(id));
    state.candidates = detectRecurring(selected);
    state.selectedCandidates = new Set(state.candidates.map(({ id }) => id));
    state.phase = "candidates";
    renderCandidateReview({ focusHeading: true });
    scrollToTop();
    announce(`${state.candidates.length} recurring candidates found. Review them before totals are shown.`);
  });
}

function renderCandidateReview({ focusHeading = false } = {}) {
  app.innerHTML = `<section class="workspace">
    ${progress(2)}
    <div class="panel">
      <header class="panel-head">
        <div><p class="step-kicker">Step 2 of 3</p><h2 class="view-heading" tabindex="-1">${state.candidates.length ? `Review ${state.candidates.length} possible recurring charge${state.candidates.length === 1 ? "" : "s"}` : "No recurring pattern found"}</h2>
          <p>${state.candidates.length ? "The detector proposes; you decide. Totals stay hidden until you confirm." : "No merchant met the cadence and confidence rules in the selected rows."}</p></div>
        <div class="file-chip">Deterministic results</div>
      </header>
      <div class="panel-body">
        ${state.candidates.length ? `<div class="candidate-grid">${state.candidates.map(candidateCard).join("")}</div>
          <div class="withheld"><strong>Total withheld.</strong> Confirm that these are subscriptions or recurring charges before Abo Killer calculates their impact.</div>` : `<div class="empty-state"><div class="empty-icon" aria-hidden="true">✓</div><p>That can mean there are no repeating charges, or the statement does not span enough time. Monthly patterns need at least three occurrences; unknown merchants need four.</p></div>`}
      </div>
      <footer class="panel-actions">
        <p>${state.candidates.length ? `<strong id="candidate-count">${state.selectedCandidates.size}</strong> candidates selected` : "Try a longer date range or adjust the imported rows."}</p>
        <div class="button-row"><button class="button secondary" id="back-to-rows" type="button">Back</button>${state.candidates.length ? `<button class="button primary" id="confirm" type="button">Confirm & calculate</button>` : `<button class="button primary" id="start-over" type="button">Import another CSV</button>`}</div>
      </footer>
    </div>
  </section>`;
  bindCandidateReview();
  if (focusHeading) focusView();
}

function candidateCard(candidate) {
  return `<article class="candidate">
    <label class="check-control candidate-check"><input class="candidate-toggle" type="checkbox" data-id="${escapeHtml(candidate.id)}" ${state.selectedCandidates.has(candidate.id) ? "checked" : ""} aria-label="Include ${escapeHtml(candidate.name)}" /></label>
    <div>
      <h3>${escapeHtml(candidate.name)}</h3>
      <div class="candidate-sub"><span class="badge ${candidate.recognized ? "" : "unknown"}">${candidate.recognized ? "Recognized provider" : "Unrecognized merchant"}</span><span>${escapeHtml(candidate.frequencyLabel)}</span><span>${candidate.confidence}% confidence</span></div>
      <details><summary>Why this matched</summary><ul class="evidence-list">${candidate.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></details>
    </div>
    <div class="candidate-price"><strong>${escapeHtml(formatMoney(candidate.expectedCharge, candidate.currency))}</strong><span>expected / ${escapeHtml(candidate.frequency)}</span></div>
  </article>`;
}

function bindCandidateReview() {
  document.querySelector("#back-to-rows").addEventListener("click", () => {
    renderTransactionReview({ focusHeading: true });
    scrollToTop();
  });
  document.querySelectorAll(".candidate-toggle").forEach((checkbox) => checkbox.addEventListener("change", () => {
    if (checkbox.checked) state.selectedCandidates.add(checkbox.dataset.id);
    else state.selectedCandidates.delete(checkbox.dataset.id);
    document.querySelector("#candidate-count").textContent = state.selectedCandidates.size;
  }));
  const startOver = document.querySelector("#start-over");
  if (startOver) startOver.addEventListener("click", reset);
  const confirm = document.querySelector("#confirm");
  if (confirm) confirm.addEventListener("click", () => {
    state.phase = "summary";
    renderSummary({ focusHeading: true });
    scrollToTop();
    announce("Your reviewed subscription estimate is ready.");
  });
}

function selectedCandidates() {
  return state.candidates.filter(({ id }) => state.selectedCandidates.has(id));
}

function renderSummary({ focusHeading = false } = {}) {
  const selected = selectedCandidates();
  const totals = totalsByCurrency(selected);
  const totalCards = Object.entries(totals).map(([currency, total]) => `<div class="total-card"><span>Estimated monthly</span><strong>${escapeHtml(formatMoney(total.monthly, currency))}</strong><small>${escapeHtml(formatMoney(total.annual, currency))} per year</small></div>`).join("");
  app.innerHTML = `<section class="workspace">
    ${progress(3)}
    <div class="panel">
      <div class="summary-hero"><p class="step-kicker">Reviewed estimate</p><h2 class="view-heading" tabindex="-1">${selected.length ? `${selected.length} quiet drain${selected.length === 1 ? "" : "s"}, made visible.` : "Nothing selected. Nothing counted."}</h2><p>Estimates use the median of the latest three charges. Currencies remain separate—no hidden conversion.</p><div class="totals">${totalCards || `<div class="total-card"><span>Estimated monthly</span><strong>—</strong><small>No selected charges</small></div>`}</div></div>
      <div class="panel-body">
        <div class="result-list">${selected.map(resultRow).join("") || `<div class="empty-state"><p>Go back if you want to include a candidate.</p></div>`}</div>
        <div class="privacy-export"><p><strong>Safe to take with you.</strong><br />Export includes aggregate provider estimates—not raw descriptions, dates, balances, account details, or imported rows.</p><button class="button secondary" id="export-summary" type="button" ${selected.length ? "" : "disabled"}>Export JSON summary</button></div>
      </div>
      <footer class="panel-actions"><p>All imported data disappears when this tab is closed or reset.</p><div class="button-row"><button class="button secondary" id="back-to-candidates" type="button">Review again</button><button class="button primary" id="start-over" type="button">Analyze another file</button></div></footer>
    </div>
  </section>`;
  document.querySelector("#back-to-candidates").addEventListener("click", () => {
    renderCandidateReview({ focusHeading: true });
    scrollToTop();
  });
  document.querySelector("#start-over").addEventListener("click", reset);
  document.querySelector("#export-summary").addEventListener("click", exportSummary);
  if (focusHeading) focusView();
}

function resultRow(candidate) {
  return `<article class="result-row"><div><h3>${escapeHtml(candidate.name)}</h3><p>${escapeHtml(candidate.frequencyLabel)} · ${candidate.confidence}% confidence · ${candidate.recognized ? "recognized provider" : "unrecognized merchant"}</p></div>
    <div class="result-cost"><strong>${escapeHtml(formatMoney(candidate.annualCost, candidate.currency))}</strong><span>estimated / year</span></div>
    <div>${candidate.provider ? `<a class="reviewed-link" href="${escapeHtml(candidate.provider.cancelUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(candidate.provider.linkLabel)}</a>` : `<span class="no-link">No reviewed cancellation link</span>`}</div></article>`;
}

function exportSummary() {
  const content = JSON.stringify(createSafeSummary(selectedCandidates()), null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `abo-killer-summary-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  announce("Privacy-safe summary exported.");
}

function renderError(title, message) {
  app.innerHTML = `<section class="error-screen" role="alert"><p class="step-kicker">Import stopped safely</p><h1 class="view-heading" tabindex="-1">${escapeHtml(title)}</h1><p class="error-message">${escapeHtml(message)}</p><button class="button primary" id="start-over" type="button">Try another file</button></section>`;
  document.querySelector("#start-over").addEventListener("click", reset);
  focusView();
}

function reset() {
  state.filename = "";
  state.parsed = null;
  state.adapter = null;
  state.mapping = null;
  state.transactions = [];
  state.rowErrors = [];
  state.selectedTransactions = new Set();
  state.candidates = [];
  state.selectedCandidates = new Set();
  renderLanding({ focusHeading: true });
  scrollToTop();
  announce("Imported data cleared from memory.");
}

renderLanding();
