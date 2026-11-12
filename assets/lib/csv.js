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
const CURRENCY_COLUMNS = ["currency", "original currency"];
const MAX_TRANSACTION_ROWS = 100_000;

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

  function pushRow() {
    row.push(field.trim());
    if (row.some(Boolean)) {
      if (rows.length > 0 && rows.length - 1 >= MAX_TRANSACTION_ROWS) {
        throw new Error(`The CSV exceeds the ${MAX_TRANSACTION_ROWS.toLocaleString("en")} transaction limit.`);
      }
      rows.push(row);
    }
    row = [];
    field = "";
    closedQuote = false;
  }

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
      pushRow();
    } else if (char === "\r") {
      if (input[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      field += char;
      closedQuote = false;
    }
  }

  if (quoted) throw new Error("The CSV ends inside a quoted field.");
  pushRow();
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
  let value = String(input ?? "").trim();
  value = value.replace(/^(?:[A-Z]{3}\s+)|(?:\s+[A-Z]{3})$/i, "");
  const negativeParentheses = value.startsWith("(") && value.endsWith(")");
  if (negativeParentheses) value = value.slice(1, -1);
  value = value.replace(/^[\p{Sc}\s]+|[\p{Sc}\s]+$/gu, "");
  if (/[\p{Sc}]/u.test(value)) throw new Error(`Invalid amount: ${input}`);
  value = value.replace(/\s+/g, "'");
  if (!/^[+-]?\d[\d,.'+-]*$/.test(value) || /[()]/.test(value)) {
    throw new Error(`Invalid amount: ${input}`);
  }
  const sign = value[0] === "-" || value[0] === "+" ? value[0] : "";
  if (sign) value = value.slice(1);
  if (/[+-]/.test(value)) throw new Error(`Invalid amount: ${input}`);

  const validGroupedInteger = (integer, separator) => {
    const groups = integer.split(separator);
    return groups.length > 1 && /^[0-9]{1,3}$/.test(groups[0]) && groups.slice(1).every((group) => /^[0-9]{3}$/.test(group));
  };
  const separators = [...value].filter((char) => ",.'".includes(char));
  const uniqueSeparators = [...new Set(separators)];
  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");
  if (uniqueSeparators.includes("'")) {
    if (uniqueSeparators.some((separator) => separator !== "'" && separator !== "." && separator !== ",")) throw new Error(`Invalid amount: ${input}`);
    const decimal = lastComma > lastDot ? "," : lastDot > lastComma ? "." : "";
    const parts = decimal ? value.split(decimal) : [value, ""];
    const [integer, fraction] = parts;
    if (parts.length !== 2) throw new Error(`Invalid amount: ${input}`);
    if (!validGroupedInteger(integer, "'") || (decimal && !/^\d+$/.test(fraction))) throw new Error(`Invalid amount: ${input}`);
    value = `${integer.replaceAll("'", "")}${decimal ? `.${fraction}` : ""}`;
  } else if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? "," : ".";
    const grouping = decimal === "," ? "." : ",";
    const parts = value.split(decimal);
    const [integer, fraction] = parts;
    if (parts.length !== 2 || !fraction || !/^\d+$/.test(fraction) || !validGroupedInteger(integer, grouping)) throw new Error(`Invalid amount: ${input}`);
    value = `${integer.replaceAll(grouping, "")}.${fraction}`;
  } else if (uniqueSeparators.length === 1) {
    const separator = uniqueSeparators[0];
    const count = separators.length;
    const grouped = validGroupedInteger(value, separator);
    const finalGroup = value.slice(value.lastIndexOf(separator) + 1);
    const isDecimal = count === 1 && finalGroup.length !== 3 && /^\d+$/.test(finalGroup);
    if (!grouped && !isDecimal) throw new Error(`Invalid amount: ${input}`);
    if (count > 1 || separator === "'") value = value.replaceAll(separator, "");
    else if (isDecimal) value = value.replace(separator, ".");
    else if (separator === ",") value = value.replace(",", ".");
  } else if (separators.length) {
    throw new Error(`Invalid amount: ${input}`);
  }
  value = `${sign}${value}`;
  if (negativeParentheses && sign) throw new Error(`Invalid amount: ${input}`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid amount: ${input}`);
  return negativeParentheses ? -Math.abs(parsed) : parsed;
}

export function parseDate(input) {
  const value = String(input ?? "").trim();
  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/i);
  if (match) {
    if (match[4] && Number.isNaN(new Date(value).valueOf())) throw new Error(`Invalid date: ${input}`);
    return validDate(Number(match[1]), Number(match[2]), Number(match[3]), input);
  }
  match = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (match) return validDate(Number(match[3]), Number(match[2]), Number(match[1]), input);
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
      const currency = String(mapping.fixedCurrency || record[mapping.currency] || "EUR").trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new Error(`Invalid currency code: ${currency}`);
      transactions.push({
        id: `row-${record.__row}`,
        sourceRow: record.__row,
        date: parseDate(record[mapping.date]),
        description,
        amount: parseAmount(record[mapping.amount]),
        currency,
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
