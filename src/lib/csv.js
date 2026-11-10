const DATE_COLUMNS = ["date", "completed date", "booking date", "value date", "transaction date"];
const DESCRIPTION_COLUMNS = [
  "description",
  "payee",
  "merchant",
  "name",
  "payment reference",
  "reference",
];
const AMOUNT_COLUMNS = ["amount", "amount (eur)", "transaction amount", "value"];
const CURRENCY_COLUMNS = ["currency", "original currency", "type foreign currency"];

export const ADAPTERS = [
  {
    id: "n26",
    name: "N26",
    matches: (headers) => has(headers, "Date", "Payee", "Amount (EUR)"),
    mapping: {
      date: "Date",
      description: "Payee",
      fallbackDescription: "Payment reference",
      amount: "Amount (EUR)",
      fixedCurrency: "EUR",
    },
  },
  {
    id: "revolut",
    name: "Revolut",
    matches: (headers) => has(headers, "Type", "Completed Date", "Description", "Amount", "Currency"),
    mapping: {
      date: "Completed Date",
      description: "Description",
      amount: "Amount",
      currency: "Currency",
    },
  },
  {
    id: "wise",
    name: "Wise",
    matches: (headers) => has(headers, "Date", "Amount", "Currency", "Description") &&
      headers.some((header) => /wise id|transferwise id/i.test(header)),
    mapping: {
      date: "Date",
      description: "Merchant",
      fallbackDescription: "Description",
      amount: "Amount",
      currency: "Currency",
    },
  },
];

function has(headers, ...wanted) {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  return wanted.every((header) => normalized.includes(header.toLowerCase()));
}

export function detectDelimiter(text) {
  const firstLogicalLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const delimiters = [",", ";", "\t"];
  return delimiters
    .map((delimiter) => ({ delimiter, count: countOutsideQuotes(firstLogicalLine, delimiter) }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function countOutsideQuotes(line, needle) {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && line[index] === needle) count += 1;
  }
  return count;
}

export function parseCsv(text, delimiter = detectDelimiter(text)) {
  const input = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        closedQuote = true;
      } else field += char;
    } else if (closedQuote && char !== delimiter && char !== "\n" && char !== "\r") {
      throw new Error("Unexpected text after a closing quote.");
    } else if (char === '"') {
      if (field.length) throw new Error("A quoted field must start with a quote.");
      quoted = true;
    } else if (char === delimiter) {
      row.push(field.trim());
      field = "";
      closedQuote = false;
    } else if (char === "\n") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
      closedQuote = false;
    } else if (char === "\r") {
      if (input[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
      closedQuote = false;
    } else {
      field += char;
      closedQuote = false;
    }
  }

  if (quoted) throw new Error("The CSV ends inside a quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV needs a header and at least one transaction.");

  const [headers, ...data] = rows;
  const uniqueHeaders = new Set(headers.map((header) => header.toLowerCase()));
  if (uniqueHeaders.size !== headers.length) throw new Error("The CSV has duplicate column names.");
  const invalidRow = data.findIndex((values) => values.length !== headers.length);
  if (invalidRow >= 0) throw new Error(`CSV row ${invalidRow + 2} has ${data[invalidRow].length} columns; expected ${headers.length}.`);

  return {
    delimiter,
    headers,
    rows: data.map((values, rowIndex) => ({
      ...Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex] ?? ""])),
      __row: rowIndex + 2,
    })),
  };
}

export function detectAdapter(headers) {
  return ADAPTERS.find((adapter) => adapter.matches(headers)) ?? null;
}

export function suggestMapping(headers) {
  const find = (candidates) => headers.find((header) => candidates.includes(header.trim().toLowerCase())) ?? "";
  const currency = find(CURRENCY_COLUMNS);
  return {
    date: find(DATE_COLUMNS),
    description: find(DESCRIPTION_COLUMNS),
    amount: find(AMOUNT_COLUMNS),
    currency,
    fixedCurrency: currency ? "" : "EUR",
  };
}

export function parseAmount(input) {
  if (typeof input === "number") return input;
  let value = String(input ?? "").trim().replace(/[€£$\s]/g, "").replace(/[^\d,.'()\-+]/g, "");
  const negativeParentheses = /^\(.*\)$/.test(value);
  value = value.replace(/[()']/g, "");
  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");
  if (lastComma > lastDot) value = value.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma && lastComma >= 0) value = value.replace(/,/g, "");
  else if (lastComma >= 0) {
    const decimals = value.length - lastComma - 1;
    value = decimals === 1 || decimals === 2 ? value.replace(",", ".") : value.replace(/,/g, "");
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid amount: ${input}`);
  return negativeParentheses ? -Math.abs(parsed) : parsed;
}

export function parseDate(input) {
  const value = String(input ?? "").trim();
  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) return validDate(Number(match[1]), Number(match[2]), Number(match[3]), input);
  match = value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/);
  if (match) return validDate(Number(match[3]), Number(match[2]), Number(match[1]), input);
  const date = new Date(value);
  if (!Number.isNaN(date.valueOf())) return date.toISOString().slice(0, 10);
  throw new Error(`Invalid date: ${input}`);
}

function validDate(year, month, day, input) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Invalid date: ${input}`);
  }
  return date.toISOString().slice(0, 10);
}

export function normalizeRows(parsed, mapping) {
  if (!mapping.date || !mapping.description || !mapping.amount) {
    throw new Error("Choose date, description, and amount columns.");
  }

  const errors = [];
  const transactions = [];
  for (const record of parsed.rows) {
    try {
      const primaryDescription = record[mapping.description];
      const fallback = mapping.fallbackDescription ? record[mapping.fallbackDescription] : "";
      const description = String(primaryDescription || fallback || "").trim();
      if (!description) throw new Error("Missing description");
      transactions.push({
        id: `row-${record.__row}`,
        sourceRow: record.__row,
        date: parseDate(record[mapping.date]),
        description,
        amount: parseAmount(record[mapping.amount]),
        currency: String(mapping.fixedCurrency || record[mapping.currency] || "EUR").trim().toUpperCase(),
      });
    } catch (error) {
      errors.push({ row: record.__row, message: error.message });
    }
  }
  return { transactions, errors };
}

export function importCsv(text) {
  const parsed = parseCsv(text);
  const adapter = detectAdapter(parsed.headers);
  const mapping = adapter?.mapping ?? suggestMapping(parsed.headers);
  return { parsed, adapter, mapping, ...normalizeRows(parsed, mapping) };
}
