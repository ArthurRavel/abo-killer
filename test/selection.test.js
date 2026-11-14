import assert from "node:assert/strict";
import test from "node:test";
import { selectedTransactionIds } from "../src/lib/selection.js";

test("keeps deliberate exclusions while a generic mapping hides and restores rows", () => {
  const excluded = new Set(["row-3"]);
  const initiallyValid = [{ id: "row-2" }, { id: "row-3" }, { id: "row-4" }];
  const temporarilyValid = [{ id: "row-2" }, { id: "row-4" }];
  const restored = [{ id: "row-2" }, { id: "row-3" }, { id: "row-4" }];

  assert.deepEqual([...selectedTransactionIds(initiallyValid, excluded)], ["row-2", "row-4"]);
  assert.deepEqual([...selectedTransactionIds(temporarilyValid, excluded)], ["row-2", "row-4"]);
  assert.deepEqual([...selectedTransactionIds(restored, excluded)], ["row-2", "row-4"]);
});

test("selects newly valid rows by default unless the user excluded them", () => {
  const excluded = new Set(["row-5"]);

  assert.deepEqual(
    [...selectedTransactionIds([{ id: "row-5" }, { id: "row-6" }], excluded)],
    ["row-6"],
  );
});
