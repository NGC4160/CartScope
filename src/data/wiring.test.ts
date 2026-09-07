import assert from "node:assert/strict";
import test from "node:test";
import { getSheet, sheetsForPack } from "./wiring.ts";

const MISMATCHED_PDS_IDS = ["pds36-4", "pds36-1", "pds36-2", "pds36-3", "pds36-5", "pds36-charger"];

test("Library TXT 36 V Non-PDS sheet leads the Non-PDS pack with honest 1206 charts", () => {
  const sheet = getSheet("txt36-non-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-non-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 19/);
  assert.match(sheet.manualRef, /E-17/);

  const ids = sheetsForPack("ezgo-txt-36-non-pds").map((s) => s.id);
  assert.deepEqual(ids, ["txt36-non-pds", "pds36-1", "pds36-2", "pds36-3"]);
  for (const id of ["pds36-1", "pds36-2", "pds36-3"]) {
    const moved = getSheet(id);
    assert.ok(moved);
    assert.match(moved.title, /Non-PDS/);
    assert.doesNotMatch(moved.title, /^36 V PDS/);
    assert.match(moved.manualRef, /Non-PDS/);
  }
  assert.ok(!sheetsForPack("ezgo-txt-dcs").some((s) => s.id === "txt36-non-pds"));
  assert.ok(!sheetsForPack("ezgo-txt-tct").some((s) => s.id === "txt36-non-pds"));
  assert.ok(!sheetsForPack("ezgo-pds-36").some((s) => s.id === "txt36-non-pds"));
});

test("PDS pack shows only the Library PDS wire map", () => {
  const sheet = getSheet("txt36-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 9/);
  assert.match(sheet.manualRef, /F-9/);

  const ids = sheetsForPack("ezgo-pds-36").map((s) => s.id);
  assert.deepEqual(ids, ["txt36-pds"]);
  for (const id of MISMATCHED_PDS_IDS) {
    assert.ok(!ids.includes(id), id);
  }
  assert.equal(getSheet("pds36-4"), undefined);
  assert.equal(getSheet("pds36-5"), undefined);
  assert.equal(getSheet("pds36-charger"), undefined);
});
