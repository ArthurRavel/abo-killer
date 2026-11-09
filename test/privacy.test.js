import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSafeSummary } from "../src/lib/recurrence.js";
import { PROVIDERS } from "../src/lib/providers.js";

test("privacy-safe export contains aggregates, not raw transaction fields", () => {
  const summary = createSafeSummary([{
    id: "EUR-spotify",
    name: "Spotify",
    merchant: "spotify user 884421",
    recognized: true,
    currency: "EUR",
    frequency: "monthly",
    expectedCharge: 10.99,
    annualCost: 131.88,
    confidence: 96,
    occurrences: [{ date: "2025-01-03", amount: -10.99 }],
  }], "2026-11-09T17:00:00.000Z");
  const output = JSON.stringify(summary);
  assert.match(output, /Spotify/);
  assert.doesNotMatch(output, /884421|2025-01-03|occurrences|merchant/);
});

test("browser source does not persist or transmit imported data", async () => {
  const files = ["../src/main.js", "../src/lib/csv.js", "../src/lib/recurrence.js"];
  const source = (await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8")))).join("\n");
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\b/);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB)\b/);
});

test("provider catalog only contains explicit HTTPS help destinations", () => {
  const allowedHosts = new Set([
    "support.spotify.com", "help.netflix.com", "helpx.adobe.com", "support.microsoft.com",
    "support.apple.com", "support.google.com", "help.dropbox.com", "www.canva.com",
  ]);
  assert.equal(PROVIDERS.length, 8);
  for (const provider of PROVIDERS) {
    const url = new URL(provider.cancelUrl);
    assert.equal(url.protocol, "https:");
    assert.ok(allowedHosts.has(url.hostname), `${provider.name} uses an unexpected host`);
  }
});
