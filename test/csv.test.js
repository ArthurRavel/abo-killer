import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { detectAdapter, detectDelimiter, importCsv, normalizeRows, parseAmount, parseCsv } from "../src/lib/csv.js";

const fixture = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

test("parses a known N26 export and detects its adapter", async () => {
  const result = importCsv(await fixture("n26.csv"));
  assert.equal(result.adapter.name, "N26");
  assert.equal(result.transactions.length, 3);
  assert.deepEqual(result.transactions[1], {
    id: "row-3",
    sourceRow: 3,
    date: "2025-02-03",
    description: "PAYPAL *SPOTIFY 7782",
    amount: -10.99,
    currency: "EUR",
  });
});

test("handles semicolon-delimited European decimals and quoted commas", async () => {
  const text = await fixture("generic-eu.csv");
  assert.equal(detectDelimiter(text), ";");
  const parsed = parseCsv(text);
  assert.equal(detectAdapter(parsed.headers), null);
  const result = normalizeRows(parsed, {
    date: "Booking date",
    description: "Details",
    amount: "Value",
    currency: "CCY",
    fixedCurrency: "",
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.transactions[0].description, "ACME, VIDEO");
  assert.equal(result.transactions[2].amount, -10.99);
});

test("parses adversarial European CSV quoting, BOM, CRLF, and embedded delimiters", async () => {
  const text = (await fixture("european-adversarial.csv")).replaceAll("\n", "\r\n");
  const parsed = parseCsv(text);
  assert.equal(parsed.delimiter, ";");
  assert.equal(parsed.headers[0], "Booking date");
  assert.equal(parsed.rows.length, 3);
  assert.equal(parsed.rows[0].Details, "CAFÉ; VIDEO, PLUS");
  assert.equal(parsed.rows[1].Details, "L'ATELIER \"NORD\"");
  assert.equal(parsed.rows[2].Details, "ACME\r\nEUROPE");
  assert.equal(parsed.rows[2].Value, "(1.234,56 €)");
  assert.equal(parseAmount(parsed.rows[2].Value), -1234.56);
});

test("parses common European and international amount formats", () => {
  assert.equal(parseAmount("-1.234,56 €"), -1234.56);
  assert.equal(parseAmount("(1,234.56)"), -1234.56);
  assert.equal(parseAmount("42,90"), 42.9);
  assert.equal(parseAmount("42,9"), 42.9);
  assert.equal(parseAmount("1.234,5"), 1234.5);
  assert.equal(parseAmount("1,234"), 1.234);
  assert.equal(parseAmount("1.234"), 1.234);
  assert.equal(parseAmount("1,234,567"), 1234567);
  assert.equal(parseAmount("1'234.56"), 1234.56);
  assert.equal(parseAmount("€ 1 234,56"), 1234.56);
  assert.equal(parseAmount("EUR 12,34"), 12.34);
  assert.equal(parseAmount("12.34 USD"), 12.34);
});

test("rejects corrupted amount text instead of deleting unknown characters", () => {
  assert.throws(() => parseAmount("12abc34"), /Invalid amount/);
  assert.throws(() => parseAmount("12?34"), /Invalid amount/);
  assert.throws(() => parseAmount("1(2)"), /Invalid amount/);
  assert.throws(() => parseAmount("1'2"), /Invalid amount/);
  assert.throws(() => parseAmount("1,23,456"), /Invalid amount/);
  assert.throws(() => parseAmount("1,234.56.7"), /Invalid amount/);
  assert.throws(() => parseAmount("1€2"), /Invalid amount/);
  assert.throws(() => parseAmount("1 2"), /Invalid amount/);
  assert.throws(() => parseAmount("(12)-"), /Invalid amount/);
});

test("rejects malformed quoted input", () => {
  assert.throws(() => parseCsv('date,description,amount\n2025-01-01,"broken,-4'), /quoted field/);
  assert.throws(() => parseCsv('date,description,amount\n2025-01-01,broken"text,-4'), /quoted field must start/);
  assert.throws(() => parseCsv('date,description,amount\n2025-01-01,"broken"text,-4'), /after a closing quote/);
  assert.throws(() => parseCsv('date,description,amount\n2025-01-01,too,few,columns'), /row 2 has 4 columns; expected 3/);
});
