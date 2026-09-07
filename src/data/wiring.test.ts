import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getSheet, sheetsForPack } from "./wiring.ts";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "../../public");

const NON_PDS_TREE_IDS = Array.from({ length: 8 }, (_, i) => `txt36-nonpds-tree-${i + 1}`);
const PDS_TREE_IDS = Array.from({ length: 10 }, (_, i) => `txt36-pds-tree-${i + 1}`);
const RETIRED_PDS36_IDS = ["pds36-1", "pds36-2", "pds36-3", "pds36-4", "pds36-5", "pds36-charger"];

const NON_PDS_FIGS = [7, 8, 9, 10, 11, 12, 13, 14];
const NON_PDS_PAGES = ["E-5", "E-6", "E-7", "E-8", "E-9", "E-10", "E-11", "E-12"];
const PDS_FIGS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const PDS_PAGES = ["F-10", "F-11", "F-12", "F-13", "F-14", "F-15", "F-16", "F-17", "F-18", "F-19"];

test("Library TXT 36 V Non-PDS sheet leads the Non-PDS pack, then tree sheets 1–8", () => {
  const sheet = getSheet("txt36-non-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-non-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 19/);
  assert.match(sheet.manualRef, /E-17/);

  const ids = sheetsForPack("ezgo-txt-36-non-pds").map((s) => s.id);
  assert.deepEqual(ids, ["txt36-non-pds", ...NON_PDS_TREE_IDS]);
  assert.ok(!ids.some((id) => id.startsWith("pds36-")));
  assert.ok(!ids.some((id) => id.startsWith("txt36-pds")));

  for (const [i, id] of NON_PDS_TREE_IDS.entries()) {
    const tree = getSheet(id);
    assert.ok(tree, id);
    assert.equal(tree.kind, "control");
    assert.equal(tree.src, `/wiring/${id}.jpg`);
    assert.match(tree.title, /Non-PDS — troubleshooting tree/);
    assert.match(tree.title, new RegExp(`sheet ${i + 1}`));
    assert.match(tree.title, new RegExp(`Fig\\. ${NON_PDS_FIGS[i]}`));
    assert.match(tree.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
    assert.match(tree.manualRef, /28646-G01/);
    assert.match(tree.manualRef, new RegExp(`Fig\\. ${NON_PDS_FIGS[i]}`));
    assert.match(tree.manualRef, new RegExp(NON_PDS_PAGES[i]));
    assert.match(tree.manualRef, /Non-PDS/);
    assert.doesNotMatch(tree.manualRef, /Speed Control \(PDS\)/);
    assert.ok(existsSync(join(PUBLIC, tree.src.replace(/^\//, ""))), tree.src);
  }

  assert.ok(!sheetsForPack("ezgo-txt-dcs").some((s) => s.id === "txt36-non-pds" || s.id.startsWith("txt36-nonpds-tree")));
  assert.ok(!sheetsForPack("ezgo-txt-tct").some((s) => s.id === "txt36-non-pds" || s.id.startsWith("txt36-nonpds-tree")));
  assert.ok(!sheetsForPack("ezgo-pds-36").some((s) => s.id === "txt36-non-pds" || s.id.startsWith("txt36-nonpds-tree")));
});

test("PDS pack shows Library PDS wire map, then tree sheets 1–10", () => {
  const sheet = getSheet("txt36-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 9/);
  assert.match(sheet.manualRef, /F-9/);

  const ids = sheetsForPack("ezgo-pds-36").map((s) => s.id);
  assert.deepEqual(ids, ["txt36-pds", ...PDS_TREE_IDS]);
  assert.ok(!ids.some((id) => id.startsWith("pds36-")));
  assert.ok(!ids.some((id) => id.startsWith("txt36-nonpds")));

  for (const [i, id] of PDS_TREE_IDS.entries()) {
    const tree = getSheet(id);
    assert.ok(tree, id);
    assert.equal(tree.kind, "control");
    assert.equal(tree.src, `/wiring/${id}.jpg`);
    assert.match(tree.title, /PDS — troubleshooting tree/);
    assert.match(tree.title, new RegExp(`sheet ${i + 1}`));
    assert.match(tree.title, new RegExp(`Fig\\. ${PDS_FIGS[i]}`));
    assert.match(tree.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
    assert.match(tree.manualRef, /28646-G01/);
    assert.match(tree.manualRef, new RegExp(`Fig\\. ${PDS_FIGS[i]}`));
    assert.match(tree.manualRef, new RegExp(PDS_PAGES[i]));
    assert.match(tree.manualRef, /\(PDS\)/);
    assert.doesNotMatch(tree.manualRef, /Non-PDS/);
    assert.ok(existsSync(join(PUBLIC, tree.src.replace(/^\//, ""))), tree.src);
  }

  for (const id of RETIRED_PDS36_IDS) {
    assert.equal(getSheet(id), undefined, id);
    assert.ok(!ids.includes(id), id);
  }
});
