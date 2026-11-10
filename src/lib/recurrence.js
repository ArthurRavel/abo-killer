import { findProvider } from "./providers.js";

const PROCESSOR_PREFIXES = /^(?:paypal\s*\*|pp\s*\*|sumup\s*\*|stripe\s*\*|adyen\s*\*|sq\s*\*)/i;
const NOISE_WORDS = new Set(["card", "payment", "purchase", "pos", "direct", "debit", "sepa", "eu"]);
const EXCLUDED = /\b(?:salary|payroll|transfer|cash|atm|withdrawal|tax|rent|mortgage|insurance|loan|credit card|card repayment|grocery|supermarket|fuel|restaurant)\b/i;

export function normalizeMerchant(input) {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(PROCESSOR_PREFIXES, "")
    .replace(/https?:\/\/\S+|www\.\S+/g, " ")
    .replace(/\b(?:visa|mastercard|mc)\b/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/[^a-z0-9+]+/g, " ")
    .split(/\s+/)
    .filter((word) => word && !NOISE_WORDS.has(word))
    .slice(0, 5)
    .join(" ")
    .trim();
}

const CADENCES = [
  { id: "weekly", label: "Weekly", min: 5, max: 9, days: 7, annualFactor: 52 },
  { id: "monthly", label: "Monthly", min: 24, max: 38, days: 30.44, annualFactor: 12 },
  { id: "quarterly", label: "Quarterly", min: 76, max: 106, days: 91.3, annualFactor: 4 },
  { id: "annual", label: "Annual", min: 330, max: 400, days: 365.25, annualFactor: 1 },
];

function daysBetween(a, b) {
  return Math.round((new Date(b).valueOf() - new Date(a).valueOf()) / 86_400_000);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function classifyCadence(dates) {
  const intervals = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
  const typical = median(intervals);
  const cadence = CADENCES.find(({ min, max }) => typical >= min && typical <= max);
  if (!cadence) return null;
  const matching = intervals.filter((gap) => gap >= cadence.min && gap <= cadence.max).length;
  return {
    ...cadence,
    typicalGap: typical,
    intervalConsistency: matching / intervals.length,
    intervals,
  };
}

export function detectRecurring(transactions) {
  const groups = new Map();
  transactions
    .filter((transaction) => transaction.amount < 0 && !EXCLUDED.test(transaction.description))
    .forEach((transaction) => {
      const merchant = normalizeMerchant(transaction.description);
      if (merchant.length < 2) return;
      const key = `${transaction.currency}:${merchant}`;
      const group = groups.get(key) ?? [];
      group.push({ ...transaction, merchant });
      groups.set(key, group);
    });

  const candidates = [];
  for (const rawGroup of groups.values()) {
    const dateCounts = new Map();
    for (const { date } of rawGroup) dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1);
    // Same-day amounts are ambiguous (including identical ones), so exclude that date entirely.
    const group = rawGroup.filter(({ date }) => dateCounts.get(date) === 1);
    group.sort((a, b) => a.date.localeCompare(b.date));
    if (group.length < 2) continue;
    const cadence = classifyCadence(group.map(({ date }) => date));
    if (!cadence) continue;
    if (cadence.id !== "annual" && group.length < 3) continue;

    const amounts = group.map(({ amount }) => Math.abs(amount));
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const amountSpread = Math.max(...amounts) - Math.min(...amounts);
    const amountVariation = average ? amountSpread / average : 1;
    const provider = findProvider(group[0].merchant);

    // Unknown merchants need stronger evidence; known providers may vary prices or billing dates.
    if (!provider && (cadence.intervalConsistency < 0.75 || amountVariation > 0.35 || group.length < 4)) continue;

    const occurrenceScore = Math.min(group.length / 6, 1);
    const amountScore = Math.max(0, 1 - Math.min(amountVariation, 1));
    const confidence = Math.round(
      Math.min(0.99, 0.35 + cadence.intervalConsistency * 0.3 + amountScore * 0.17 + occurrenceScore * 0.1 + (provider ? 0.07 : 0)) * 100,
    );
    const recentAmounts = amounts.slice(-3);
    const expectedCharge = median(recentAmounts);
    const annualCost = roundMoney(expectedCharge * cadence.annualFactor);
    const evidence = [
      `${group.length} matching charges`,
      `${cadence.typicalGap}-day median gap`,
      cadence.intervalConsistency === 1
        ? "all intervals match the cadence"
        : `${Math.round(cadence.intervalConsistency * 100)}% of intervals match the cadence`,
      amountVariation < 0.02
        ? "stable amount"
        : `amounts range ${formatNumber(Math.min(...amounts))}–${formatNumber(Math.max(...amounts))}`,
    ];

    candidates.push({
      id: `${group[0].currency}-${group[0].merchant}`.replace(/\s+/g, "-"),
      merchant: group[0].merchant,
      name: provider?.name ?? titleCase(group[0].merchant),
      provider: provider ?? null,
      recognized: Boolean(provider),
      currency: group[0].currency,
      frequency: cadence.id,
      frequencyLabel: cadence.label,
      expectedCharge: roundMoney(expectedCharge),
      annualCost,
      confidence,
      evidence,
      occurrences: group.map(({ date, amount }) => ({ date, amount })),
    });
  }

  return candidates.sort((a, b) => b.annualCost - a.annualCost || b.confidence - a.confidence);
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value) {
  return value.toFixed(2).replace(/\.00$/, "");
}

export function totalsByCurrency(candidates) {
  return candidates.reduce((totals, candidate) => {
    const current = totals[candidate.currency] ?? { monthly: 0, annual: 0 };
    current.annual = roundMoney(current.annual + candidate.annualCost);
    current.monthly = roundMoney(current.annual / 12);
    totals[candidate.currency] = current;
    return totals;
  }, {});
}

export function createSafeSummary(candidates, generatedAt = new Date().toISOString()) {
  return {
    schema: "abo-killer-summary/v1",
    generatedAt,
    note: "Aggregated estimates only. No raw transaction descriptions, dates, balances, or account details are included.",
    totals: totalsByCurrency(candidates),
    subscriptions: candidates.map((candidate) => ({
      name: candidate.name,
      recognizedProvider: candidate.recognized,
      currency: candidate.currency,
      frequency: candidate.frequency,
      expectedCharge: candidate.expectedCharge,
      annualEstimate: candidate.annualCost,
      confidence: candidate.confidence,
    })),
  };
}
