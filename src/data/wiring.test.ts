import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getSheet, sheetsForPack } from "./wiring.ts";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "../../public");

const NON_PDS_TREE_IDS = Array.from({ length: 8 }, (_, i) => `txt36-nonpds-tree-${i + 1}`);
const PDS_SUPPORT_IDS = ["txt36-pds-intro", "txt36-pds-fault-codes-1", "txt36-pds-fault-codes-2"];
const PDS_TREE_IDS = Array.from({ length: 10 }, (_, i) => `txt36-pds-tree-${i + 1}`);
const RETIRED_PDS36_IDS = ["pds36-1", "pds36-2", "pds36-3", "pds36-4", "pds36-5", "pds36-charger"];

const NON_PDS_FIGS = [7, 8, 9, 10, 11, 12, 13, 14];
const NON_PDS_PAGES = ["E-5", "E-6", "E-7", "E-8", "E-9", "E-10", "E-11", "E-12"];
const PDS_FIGS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const PDS_PAGES = ["F-10", "F-11", "F-12", "F-13", "F-14", "F-15", "F-16", "F-17", "F-18", "F-19"];

function assertPublicSrc(src: string) {
  assert.ok(existsSync(join(PUBLIC, src.replace(/^\//, ""))), src);
}

function isNonPdsSheet(id: string) {
  return id === "txt36-non-pds" || id === "txt36-nonpds-fig6" || id.startsWith("txt36-nonpds-tree");
}

function isPdsSheet(id: string) {
  return id === "txt36-pds" || id.startsWith("txt36-pds-");
}

test("Library TXT 36 V Non-PDS sheet leads the pack, then Fig. 6, then trees 1–8", () => {
  const sheet = getSheet("txt36-non-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-non-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 19/);
  assert.match(sheet.manualRef, /E-17/);

  const overview = getSheet("txt36-nonpds-fig6");
  assert.ok(overview);
  assert.equal(overview.kind, "control");
  assert.equal(overview.src, "/wiring/txt36-nonpds-fig6.jpg");
  assert.match(overview.title, /simplified troubleshooting diagram \(Fig\. 6\)/);
  assert.match(overview.manualRef, /28646-G01/);
  assert.match(overview.manualRef, /Fig\. 6/);
  assert.match(overview.manualRef, /E-4/);
  assert.match(overview.manualRef, /Non-PDS/);
  assert.doesNotMatch(overview.title, /wire map/i);
  assertPublicSrc(overview.src);

  const ids = sheetsForPack("ezgo-txt-36-non-pds").map((s) => s.id);
  assert.deepEqual(ids, ["txt36-non-pds", "txt36-nonpds-fig6", ...NON_PDS_TREE_IDS]);
  assert.ok(!ids.some((id) => id.startsWith("pds36-")));
  assert.ok(!ids.some(isPdsSheet));

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
    assertPublicSrc(tree.src);
  }

  assert.ok(!sheetsForPack("ezgo-txt-dcs").some((s) => isNonPdsSheet(s.id)));
  assert.ok(!sheetsForPack("ezgo-txt-tct").some((s) => isNonPdsSheet(s.id)));
  assert.ok(!sheetsForPack("ezgo-pds-36").some((s) => isNonPdsSheet(s.id)));
});

test("PDS pack shows Library map, then F-6 intro and Fig. 7–8 support, then trees 1–10", () => {
  const sheet = getSheet("txt36-pds");
  assert.ok(sheet);
  assert.equal(sheet.src, "/wiring/txt36-pds-wiring.png");
  assert.match(sheet.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
  assert.match(sheet.manualRef, /Fig\. 9/);
  assert.match(sheet.manualRef, /F-9/);

  const intro = getSheet("txt36-pds-intro");
  assert.ok(intro);
  assert.equal(intro.kind, "control");
  assert.equal(intro.src, "/wiring/txt36-pds-intro.jpg");
  assert.match(intro.title, /troubleshooting diagrams intro/);
  assert.match(intro.manualRef, /F-6/);
  assert.match(intro.manualRef, /28646-G01/);
  assert.doesNotMatch(intro.title, /wire map/i);
  assertPublicSrc(intro.src);

  const codes1 = getSheet("txt36-pds-fault-codes-1");
  assert.ok(codes1);
  assert.equal(codes1.kind, "control");
  assert.equal(codes1.src, "/wiring/txt36-pds-fault-codes-1.jpg");
  assert.match(codes1.title, /diagnostic mode fault codes \(Fig\. 7\)/);
  assert.match(codes1.manualRef, /Fig\. 7/);
  assert.match(codes1.manualRef, /F-7/);
  assert.doesNotMatch(codes1.title, /wire map/i);
  assertPublicSrc(codes1.src);

  const codes2 = getSheet("txt36-pds-fault-codes-2");
  assert.ok(codes2);
  assert.equal(codes2.kind, "pinout");
  assert.equal(codes2.src, "/wiring/txt36-pds-fault-codes-2.jpg");
  assert.match(codes2.title, /fault codes continued/);
  assert.match(codes2.title, /controller connectors/);
  assert.match(codes2.title, /Fig\. 8/);
  assert.match(codes2.manualRef, /Fig\. 8/);
  assert.match(codes2.manualRef, /F-8/);
  assert.doesNotMatch(codes2.title, /wire map/i);
  assertPublicSrc(codes2.src);

  const ids = sheetsForPack("ezgo-pds-36").map((s) => s.id);
  assert.deepEqual(ids, ["txt36-pds", ...PDS_SUPPORT_IDS, ...PDS_TREE_IDS]);
  assert.ok(!ids.some((id) => id.startsWith("pds36-")));
  assert.ok(!ids.some((id) => id.startsWith("txt36-nonpds") || id === "txt36-non-pds"));

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
    assertPublicSrc(tree.src);
  }

  for (const id of RETIRED_PDS36_IDS) {
    assert.equal(getSheet(id), undefined, id);
    assert.ok(!ids.includes(id), id);
  }

  assert.ok(!sheetsForPack("ezgo-txt-dcs").some((s) => isPdsSheet(s.id)));
  assert.ok(!sheetsForPack("ezgo-txt-tct").some((s) => isPdsSheet(s.id)));
  assert.ok(!sheetsForPack("ezgo-txt-36-non-pds").some((s) => isPdsSheet(s.id)));
});
