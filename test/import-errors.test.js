import assert from "node:assert/strict";
import test from "node:test";
import { renderSkippedRows } from "../src/lib/import-errors.js";

test("skipped-row disclosure reports the count and every row reason", () => {
  const html = renderSkippedRows([
    { row: 2, message: "Invalid date: yesterday" },
    { row: 7, message: "Invalid currency code: EURO" },
    { row: 19, message: "Invalid amount: pending" },
    { row: 28, message: "Missing description" },
  ]);

  assert.match(html, /4 rows skipped/);
  for (const detail of ["Row 2:", "yesterday", "Row 7:", "EURO", "Row 19:", "pending", "Row 28:", "Missing description"]) {
    assert.ok(html.includes(detail), `missing ${detail}`);
  }
  assert.match(html, /<details class="notice import-errors">/);
});

test("skipped-row disclosure handles singular counts and escapes imported text", () => {
  const html = renderSkippedRows([{ row: "<3>", message: "<img src=x onerror=alert(1)>" }]);

  assert.match(html, /1 row skipped/);
  assert.match(html, /Row &lt;3&gt;:/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
});

test("no disclosure is rendered when no rows were skipped", () => {
  assert.equal(renderSkippedRows([]), "");
});
