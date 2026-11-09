import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("README demo is a real animated GIF", async () => {
  const gif = await readFile(new URL("../docs/demo.gif", import.meta.url));
  assert.equal(gif.subarray(0, 6).toString(), "GIF89a");
  assert.ok(gif.length > 100_000);
  assert.ok(gif.filter((byte) => byte === 0x2c).length >= 4);
});
