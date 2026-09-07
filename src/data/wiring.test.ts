import assert from "node:assert/strict";
import test from "node:test";
import { getSheet, sheetsForPack } from "./wiring.ts";

test("Library TXT 36 V Non-PDS sheet is on the Non-PDS pack only", () => {
  const sheet = getSheet("txt36-non-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-non-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 19/);
  assert.match(sheet.manualRef, /E-17/);

  const ids = sheetsForPack("ezgo-txt-36-non-pds").map((s) => s.id);
  assert.deepEqual(ids, ["txt36-non-pds"]);
  assert.ok(!sheetsForPack("ezgo-txt-dcs").some((s) => s.id === "txt36-non-pds"));
  assert.ok(!sheetsForPack("ezgo-txt-tct").some((s) => s.id === "txt36-non-pds"));
  assert.ok(!sheetsForPack("ezgo-pds-36").some((s) => s.id === "txt36-non-pds"));
});

test("Library TXT 36 V PDS sheet sits with existing pds36 sheets", () => {
  const sheet = getSheet("txt36-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 9/);
  assert.match(sheet.manualRef, /F-9/);

  const ids = sheetsForPack("ezgo-pds-36").map((s) => s.id);
  assert.equal(ids[0], "txt36-pds");
  for (const keep of ["pds36-4", "pds36-1", "pds36-2", "pds36-3", "pds36-5", "pds36-charger"]) {
    assert.ok(ids.includes(keep), keep);
  }
});
