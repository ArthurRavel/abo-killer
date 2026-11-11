import assert from "node:assert/strict";
import test from "node:test";
import { paginate } from "../src/lib/pagination.js";

test("paginates every row without overlapping or skipping boundaries", () => {
  const rows = Array.from({ length: 53 }, (_, index) => index + 1);
  const first = paginate(rows, 0, 25);
  const second = paginate(rows, 1, 25);
  const last = paginate(rows, 2, 25);

  assert.deepEqual(first, { items: rows.slice(0, 25), page: 0, pageCount: 3, start: 0, end: 25 });
  assert.deepEqual(second, { items: rows.slice(25, 50), page: 1, pageCount: 3, start: 25, end: 50 });
  assert.deepEqual(last, { items: rows.slice(50), page: 2, pageCount: 3, start: 50, end: 53 });
  assert.deepEqual([...first.items, ...second.items, ...last.items], rows);
});

test("clamps pages for empty and shortened result sets", () => {
  assert.deepEqual(paginate([], 4), { items: [], page: 0, pageCount: 1, start: 0, end: 0 });
  assert.equal(paginate(["one", "two"], 7).page, 0);
  assert.equal(paginate(["one", "two"], -2).page, 0);
});

test("rejects invalid page sizes", () => {
  assert.throws(() => paginate([1], 0, 0), RangeError);
  assert.throws(() => paginate([1], 0, 1.5), RangeError);
});
