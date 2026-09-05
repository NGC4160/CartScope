import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

test("redact unit tests", () => {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const r = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--test",
      join(root, "src/lib/redact.test.ts"),
      join(root, "src/lib/handheld.test.ts"),
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.log(r.stdout);
    console.log(r.stderr);
  }
  assert.equal(r.status, 0);
});
