import assert from "node:assert/strict";
import test from "node:test";
import { createRequestGate } from "../src/lib/request-gate.js";

test("only the most recently started file read can update the import view", () => {
  const gate = createRequestGate();
  const earlierRead = gate.begin();
  const laterRead = gate.begin();
  const updates = [];

  assert.equal(gate.runIfCurrent(laterRead, () => updates.push("latest")), true);
  assert.equal(gate.runIfCurrent(earlierRead, () => updates.push("stale")), false);
  assert.deepEqual(updates, ["latest"]);
});

test("a synchronous selection invalidates an older pending read", () => {
  const gate = createRequestGate();
  const pendingRead = gate.begin();
  const updates = [];

  gate.begin();
  assert.equal(gate.runIfCurrent(pendingRead, () => updates.push("stale file")), false);
  assert.deepEqual(updates, []);
});
