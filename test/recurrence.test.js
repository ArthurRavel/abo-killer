import assert from "node:assert/strict";
import test from "node:test";
import { importCsv } from "../src/lib/csv.js";
import { detectRecurring, normalizeMerchant, totalsByCurrency } from "../src/lib/recurrence.js";
import { SAMPLE_CSV } from "../src/sample-data.js";

const transaction = (date, description, amount, currency = "EUR") => ({
  id: `${date}-${description}`,
  date,
  description,
  amount,
  currency,
});

test("normalizes processor prefixes, accents, and changing reference numbers", () => {
  assert.equal(normalizeMerchant("PAYPAL *SPOTIFY 778293"), "spotify");
  assert.equal(normalizeMerchant("Spötify AB 482993"), "spotify ab");
  assert.equal(normalizeMerchant("VISA NETFLIX.COM 839201"), "netflix com");
});

test("detects monthly cadence and explains a variable-price subscription", () => {
  const rows = [
    transaction("2025-01-12", "NETFLIX.COM", -13.49),
    transaction("2025-02-12", "NETFLIX.COM", -13.49),
    transaction("2025-03-12", "NETFLIX.COM", -13.49),
    transaction("2025-04-12", "NETFLIX.COM", -14.99),
    transaction("2025-05-12", "NETFLIX.COM", -14.99),
  ];
  const [match] = detectRecurring(rows);
  assert.equal(match.name, "Netflix");
  assert.equal(match.frequency, "monthly");
  assert.equal(match.expectedCharge, 14.99);
  assert.equal(match.annualCost, 179.88);
  assert.ok(match.evidence.some((line) => line.startsWith("amounts range")));
  assert.ok(match.confidence >= 80);
});

test("requires three annual charges before proposing a recognized subscription", () => {
  const twoCharges = ["2023-01-05", "2024-01-05"]
    .map((date) => transaction(date, "Adobe Creative Cloud", -59.99));
  const threeCharges = ["2023-01-05", "2024-01-05", "2025-01-05"]
    .map((date) => transaction(date, "Adobe Creative Cloud", -59.99));

  assert.deepEqual(detectRecurring(twoCharges), []);
  const [match] = detectRecurring(threeCharges);
  assert.equal(match.name, "Adobe");
  assert.equal(match.frequency, "annual");
  assert.equal(match.occurrences.length, 3);
});

test("requires strong evidence for unknown merchants", () => {
  const strong = ["2025-01-05", "2025-02-05", "2025-03-05", "2025-04-05"].map((date) => transaction(date, "Cloud Nine Studio", -24));
  const weak = ["2025-01-02", "2025-02-19", "2025-03-04", "2025-05-28"].map((date) => transaction(date, "Mystery Shop", -20));
  assert.equal(detectRecurring(strong).length, 1);
  assert.equal(detectRecurring(strong)[0].recognized, false);
  assert.equal(detectRecurring(weak).length, 0);
});

test("analyzes large single-merchant histories without exceeding argument limits", () => {
  const rows = Array.from({ length: 66_000 }, (_, index) => transaction(
    new Date(Date.UTC(2000, 0, 1) + index * 7 * 86_400_000).toISOString().slice(0, 10),
    "Cloud Nine Studio",
    -24,
  ));

  const [match] = detectRecurring(rows);
  assert.equal(match.name, "Cloud Nine Studio");
  assert.equal(match.frequency, "weekly");
});

test("recognizes an otherwise regular monthly pattern with one missed billing period", () => {
  const rows = ["2025-01-05", "2025-02-05", "2025-04-05", "2025-05-05"]
    .map((date) => transaction(date, "Cloud Nine Studio", -24));
  const [match] = detectRecurring(rows);
  assert.equal(match.frequency, "monthly");
  assert.equal(match.annualCost, 288);
  assert.ok(match.evidence.includes("1 interval spans two monthly periods"));
});

test("does not infer recurrence across gaps longer than two billing periods", () => {
  const rows = ["2025-01-05", "2025-02-05", "2025-05-05", "2025-06-05"]
    .map((date) => transaction(date, "Cloud Nine Studio", -24));
  assert.deepEqual(detectRecurring(rows), []);
});

test("does not label a regular fortnightly pattern as weekly", () => {
  const rows = ["2025-01-01", "2025-01-15", "2025-01-29", "2025-02-12"]
    .map((date) => transaction(date, "Cloud Nine Studio", -24));
  assert.deepEqual(detectRecurring(rows), []);
});

test("does not treat repeated 60-day gaps as missed monthly charges", () => {
  const rows = ["2025-01-01", "2025-03-02", "2025-05-01", "2025-06-30"]
    .map((date) => transaction(date, "Cloud Nine Studio", -24));
  assert.deepEqual(detectRecurring(rows), []);
});

test("prefers quarterly cadence over a doubled monthly window at 76 days", () => {
  const rows = ["2025-01-01", "2025-03-18", "2025-06-02", "2025-08-17"]
    .map((date) => transaction(date, "Cloud Nine Studio", -24));
  const [match] = detectRecurring(rows);
  assert.equal(match.frequency, "quarterly");
});

test("same-day duplicates cannot manufacture enough recurrence evidence", () => {
  const rows = [
    transaction("2025-01-05", "Cloud Nine Studio", -24),
    transaction("2025-02-05", "Cloud Nine Studio", -24),
    transaction("2025-02-05", "Cloud Nine Studio", -24),
    transaction("2025-02-05", "Cloud Nine Studio", -25),
    transaction("2025-03-05", "Cloud Nine Studio", -24),
  ];
  assert.deepEqual(detectRecurring(rows), []);
});

test("detects a sufficiently supported recurrence despite an ambiguous duplicate date", () => {
  const rows = [
    transaction("2025-01-05", "Cloud Nine Studio", -24),
    transaction("2025-02-05", "Cloud Nine Studio", -24),
    transaction("2025-02-05", "Cloud Nine Studio", -25),
    transaction("2025-03-05", "Cloud Nine Studio", -24),
    transaction("2025-04-05", "Cloud Nine Studio", -24),
    transaction("2025-05-05", "Cloud Nine Studio", -24),
    transaction("2025-06-05", "Cloud Nine Studio", -24),
  ];
  const [match] = detectRecurring(rows);
  assert.equal(match.name, "Cloud Nine Studio");
  assert.equal(match.frequency, "monthly");
  assert.equal(match.occurrences.length, 5);
  assert.ok(match.occurrences.every(({ date }) => date !== "2025-02-05"));
});

test("excludes transfers, salary, groceries, and incoming money", () => {
  const rows = [
    ...["2025-01-01", "2025-02-01", "2025-03-01", "2025-04-01"].map((date) => transaction(date, "SEPA transfer to savings", -200)),
    ...["2025-01-03", "2025-02-03", "2025-03-03", "2025-04-03"].map((date) => transaction(date, "City Supermarket", -65)),
    ...["2025-01-25", "2025-02-25", "2025-03-25", "2025-04-25"].map((date) => transaction(date, "Salary ACME", 3000)),
  ];
  assert.deepEqual(detectRecurring(rows), []);
});

test("keeps currencies separate when calculating totals", () => {
  const candidates = [
    { currency: "EUR", annualCost: 120 },
    { currency: "EUR", annualCost: 60 },
    { currency: "GBP", annualCost: 96 },
  ];
  assert.deepEqual(totalsByCurrency(candidates), {
    EUR: { annual: 180, monthly: 15 },
    GBP: { annual: 96, monthly: 8 },
  });
});

test("runs the bundled synthetic demo through the complete analysis pipeline", () => {
  const imported = importCsv(SAMPLE_CSV);
  const candidates = detectRecurring(imported.transactions);
  assert.deepEqual(candidates.map(({ name }) => name).sort(), ["Cloud Nine Studio", "Netflix", "Spotify"]);
  assert.deepEqual(totalsByCurrency(candidates), { EUR: { annual: 599.76, monthly: 49.98 } });
});
