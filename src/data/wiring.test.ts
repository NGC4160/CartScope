import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getSheet, packsWithWiring, sheetsForPack } from "./wiring.ts";

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

const ERIC_2017_SHEET_IDS = ["eric-main", "eric-instrument", "eric-batteries", "eric-lights"];

test("Precedent ERIC 2017 pack lists only ERIC Excel sheets, not the 2019 main harness", () => {
  const sheets = sheetsForPack("club-car-precedent-eric");
  const ids = sheets.map((s) => s.id);
  assert.deepEqual(ids, ERIC_2017_SHEET_IDS);
  assert.ok(!ids.includes("prec19-e-main"));
  assert.ok(!sheets.some((s) => s.title === "2019 Precedent electric — main wire bundle"));

  for (const id of ERIC_2017_SHEET_IDS) {
    const sheet = getSheet(id);
    assert.ok(sheet, id);
    assertPublicSrc(sheet.src);
  }

  const prec19 = getSheet("prec19-e-main");
  assert.ok(prec19);
  assert.equal(prec19.title, "2019 Precedent electric — main wire bundle");
  assert.ok(sheetsForPack("club-car-tempo-eric").some((s) => s.id === "prec19-e-main"));
});

const IQ_TG_SHEET_IDS = ["iq-tg1-p1", "iq-tg1-p2", "iq-tg1-p3", "iq-tg2-p1", "iq-tg2-p2"];
const DS_IQ_SHEET_IDS = ["iq-main", ...IQ_TG_SHEET_IDS];
const PRECEDENT_IQ_SHEET_IDS = ["iq-main", "iq-accessories", "iq-sonic", ...IQ_TG_SHEET_IDS];
const IQ_TG_MANUAL =
  "2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual";
const IQ_WIRE_MAP_SHEETS: Array<{
  id: string;
  title: string;
  manualRef: string;
  src: string;
}> = [
  {
    id: "iq-main",
    title: "Figure 11-1 / Figure 11-2 Precedent Electric Vehicle Wiring Diagram",
    manualRef: `${IQ_TG_MANUAL}, Figure 11-1 / Figure 11-2 Precedent Electric Vehicle Wiring Diagram, pages 11-2 / 11-3`,
    src: "/wiring/iq-main.jpg",
  },
  {
    id: "iq-accessories",
    title: "Figure 11-3 / Figure 11-4 Precedent Electric Vehicle Accessory Wiring Diagram",
    manualRef: `${IQ_TG_MANUAL}, Figure 11-3 / Figure 11-4 Precedent Electric Vehicle Accessory Wiring Diagram, pages 11-4 / 11-5`,
    src: "/wiring/iq-accessories.jpg",
  },
  {
    id: "iq-sonic",
    title: "Figure 11-5 Precedent Electric Vehicle Instrument Panel Wiring Diagram",
    manualRef: `${IQ_TG_MANUAL}, Figure 11-5 Precedent Electric Vehicle Instrument Panel Wiring Diagram, page 11-6`,
    src: "/wiring/iq-sonic.jpg",
  },
];
const IQ_TG_SHEETS: Array<{
  id: string;
  title: string;
  manualRef: string;
  src: string;
}> = [
  {
    id: "iq-tg1-p1",
    title: "Troubleshooting Guide 1, page 11-8",
    manualRef: `${IQ_TG_MANUAL}, Troubleshooting Guide 1, page 11-8`,
    src: "/wiring/iq-tg1-guide1-p1.png",
  },
  {
    id: "iq-tg1-p2",
    title: "Troubleshooting Guide 1, page 11-9",
    manualRef: `${IQ_TG_MANUAL}, Troubleshooting Guide 1, page 11-9`,
    src: "/wiring/iq-tg1-guide1-p2.png",
  },
  {
    id: "iq-tg1-p3",
    title: "Troubleshooting Guide 1, page 11-10",
    manualRef: `${IQ_TG_MANUAL}, Troubleshooting Guide 1, page 11-10`,
    src: "/wiring/iq-tg1-guide1-p3.png",
  },
  {
    id: "iq-tg2-p1",
    title: "Troubleshooting Guide 2, page 11-11",
    manualRef: `${IQ_TG_MANUAL}, Troubleshooting Guide 2, page 11-11`,
    src: "/wiring/iq-tg2-guide2-p1.png",
  },
  {
    id: "iq-tg2-p2",
    title: "Troubleshooting Guide 2, page 11-12",
    manualRef: `${IQ_TG_MANUAL}, Troubleshooting Guide 2, page 11-12`,
    src: "/wiring/iq-tg2-guide2-p2.png",
  },
];

test("DS IQ pack lists the shared IQ main wiring diagram, not accessory or instrument sheets", () => {
  const sheets = sheetsForPack("club-car-ds-iq");
  const ids = sheets.map((s) => s.id);
  assert.deepEqual(ids, DS_IQ_SHEET_IDS);
  assert.equal(ids[0], "iq-main");
  assert.ok(!ids.includes("iq-accessories"));
  assert.ok(!ids.includes("iq-sonic"));
  assert.ok(!sheets.some((s) => s.title === IQ_WIRE_MAP_SHEETS[1].title));
  assert.ok(!sheets.some((s) => s.title === IQ_WIRE_MAP_SHEETS[2].title));
  assert.ok(!sheets.some((s) => s.title === "IQ System — lights and extras"));
  assert.ok(!sheets.some((s) => s.title === "IQ System — weld spots and one-way parts"));

  for (const expected of IQ_WIRE_MAP_SHEETS) {
    const sheet = getSheet(expected.id);
    assert.ok(sheet, expected.id);
    assert.equal(sheet.title, expected.title);
    assert.equal(sheet.manualRef, expected.manualRef);
    assert.equal(sheet.src, expected.src);
    assert.doesNotMatch(sheet.title, /IQ System —/);
    assert.doesNotMatch(sheet.title, /main wire map|lights and extras|weld spots/);
    assert.doesNotMatch(sheet.manualRef, /2006–07 Precedent IQ M&S/);
    assert.doesNotMatch(sheet.manualRef, /Wiring Diagrams 11-/);
    assert.doesNotMatch(sheet.manualRef, /Figure 11-6/);
    assertPublicSrc(sheet.src);
  }

  const main = getSheet("iq-main");
  assert.ok(main);
  assert.equal(main.src, "/wiring/iq-main.jpg");

  const sonic = getSheet("iq-sonic");
  assert.ok(sonic);
  assert.match(sonic.manualRef, /Figure 11-5/);
  assert.match(sonic.manualRef, /page 11-6/);
  assert.doesNotMatch(sonic.title, /Figure 11-6/);

  assert.deepEqual(
    sheetsForPack("club-car-precedent-iq").map((s) => s.id),
    PRECEDENT_IQ_SHEET_IDS,
  );
});

test("DS IQ and Precedent IQ append Troubleshooting Guide 1 then Guide 2 with printed titles", () => {
  for (const expected of IQ_TG_SHEETS) {
    const sheet = getSheet(expected.id);
    assert.ok(sheet, expected.id);
    assert.equal(sheet.title, expected.title);
    assert.equal(sheet.manualRef, expected.manualRef);
    assert.equal(sheet.src, expected.src);
    assert.equal(sheet.kind, "control");
    assert.equal(sheet.landscape, false);
    assert.match(sheet.title, /^Troubleshooting Guide [12], page 11-\d+$/);
    assert.match(sheet.manualRef, /2006–2007 Precedent IQ System Electric Golf Car Maintenance and Service Manual/);
    assert.doesNotMatch(sheet.title, /tree|fault plate|wire map/i);
    assertPublicSrc(sheet.src);
  }

  const dsIds = sheetsForPack("club-car-ds-iq").map((s) => s.id);
  assert.deepEqual(dsIds, DS_IQ_SHEET_IDS);
  assert.deepEqual(dsIds.slice(1), IQ_TG_SHEET_IDS);

  const precIds = sheetsForPack("club-car-precedent-iq").map((s) => s.id);
  assert.deepEqual(precIds, PRECEDENT_IQ_SHEET_IDS);
  assert.deepEqual(precIds.slice(0, 3), ["iq-main", "iq-accessories", "iq-sonic"]);
  assert.deepEqual(precIds.slice(3), IQ_TG_SHEET_IDS);

  const foreignPacks = [
    "club-car-precedent-excel",
    "club-car-precedent-eric",
    "club-car-villager-iqplus",
    "club-car-tempo-eric",
  ];
  for (const packId of foreignPacks) {
    assert.ok(
      !sheetsForPack(packId).some((s) => IQ_TG_SHEET_IDS.includes(s.id)),
      packId,
    );
  }

  for (const packId of packsWithWiring()) {
    if (packId === "club-car-ds-iq" || packId === "club-car-precedent-iq") continue;
    assert.ok(
      !sheetsForPack(packId).some((s) => IQ_TG_SHEET_IDS.includes(s.id)),
      packId,
    );
  }
});

const YDRE_DC_WIRE_MAP_IDS = ["ydre-dc-1", "ydre-dc-2", "ydre-dc-mcu"];
const YDRE_DC_CH9_TREE_IDS = [
  "ydre-dc-ch9-traction-motor",
  "ydre-dc-ch9-mcu-reset-harness-dc",
  "ydre-dc-ch9-buzzer-rated-speed",
  "ydre-dc-ch9-solenoid-no-click",
  "ydre-dc-ch9-solenoid-clicks",
  "ydre-dc-ch9-no-regen-rollaway",
];
const YDRE_DC_CH9_Z2_IDS = ["ydre-dc-ch9-z2-failure-chart-a", "ydre-dc-ch9-z2-failure-chart-b"];
const YDRE_DC_CH9_GENIUS_IDS = Array.from({ length: 7 }, (_, i) => `ydre-dc-ch9-genius-faults-9-${38 + i}`);
const YDRE_DC_SHEET_IDS = [
  ...YDRE_DC_WIRE_MAP_IDS,
  "ydre-dc-ch9-flowchart-z2",
  ...YDRE_DC_CH9_TREE_IDS,
  ...YDRE_DC_CH9_Z2_IDS,
  ...YDRE_DC_CH9_GENIUS_IDS,
];
const YDRE_AC_SHEET_IDS = ["ydre-ac-1", "ydre-ac-mcu-1", "ydre-ac-mcu-2"];

const YDRE_DC_CH9_SHEETS: Array<{
  id: string;
  title: string;
  manualRef: string;
  src: string;
  kind: "control" | "pinout";
}> = [
  {
    id: "ydre-dc-ch9-flowchart-z2",
    title: "YDRE DC MODELS ELECTRICAL TROUBLESHOOTING FLOWCHART (Z-2 Diagnostic Tester)",
    manualRef: "Figure 9-18, page 9-25",
    src: "/wiring/ydre-dc-ch9-fig9-18-electrical-flowchart-z2.png",
    kind: "control",
  },
  {
    id: "ydre-dc-ch9-traction-motor",
    title: "TRACTION MOTOR — Troubleshooting – YDRE (Battery Models)",
    manualRef: "Chapter 9, page 9-18 (YDRE section)",
    src: "/wiring/ydre-dc-ch9-9-18-traction-motor.png",
    kind: "control",
  },
  {
    id: "ydre-dc-ch9-mcu-reset-harness-dc",
    title: "RESETTING MOTOR CONTROL UNIT / MCU MAIN HARNESS CONNECTOR – DC MODELS",
    manualRef: "Figure 9-16, page 9-19",
    src: "/wiring/ydre-dc-ch9-9-19-mcu-reset-harness-dc.png",
    kind: "pinout",
  },
  {
    id: "ydre-dc-ch9-buzzer-rated-speed",
    title: "REVERSE WARNING BUZZER DOES NOT WORK / CAR WILL NOT RUN AT RATED SPEED",
    manualRef: "Chapter 9, page 9-21",
    src: "/wiring/ydre-dc-ch9-9-21-buzzer-rated-speed-trees.png",
    kind: "control",
  },
  {
    id: "ydre-dc-ch9-solenoid-no-click",
    title: "CAR WILL NOT OPERATE IN EITHER DIRECTION – SOLENOID DOES NOT OPERATE",
    manualRef: "Chapter 9, page 9-22",
    src: "/wiring/ydre-dc-ch9-9-22-solenoid-does-not-operate.png",
    kind: "control",
  },
  {
    id: "ydre-dc-ch9-solenoid-clicks",
    title: "CAR WILL NOT OPERATE IN EITHER DIRECTION – SOLENOID DOES OPERATE",
    manualRef: "Chapter 9, page 9-23",
    src: "/wiring/ydre-dc-ch9-9-23-solenoid-does-operate.png",
    kind: "control",
  },
  {
    id: "ydre-dc-ch9-no-regen-rollaway",
    title: "NO REGENERATIVE BRAKING OR ROLLAWAY PROTECTION",
    manualRef: "Chapter 9, page 9-24",
    src: "/wiring/ydre-dc-ch9-9-24-no-regen-rollaway.png",
    kind: "control",
  },
  {
    id: "ydre-dc-ch9-z2-failure-chart-a",
    title: "Z-2 TESTER FAILURE CHART – DC MODELS (sheet A)",
    manualRef: "Figure 9-24 + chart, page 9-28",
    src: "/wiring/ydre-dc-ch9-9-28-z2-tester-failure-chart-a.png",
    kind: "control",
  },
  {
    id: "ydre-dc-ch9-z2-failure-chart-b",
    title: "Z-2 TESTER FAILURE CHART – DC MODELS (sheet B)",
    manualRef: "Chapter 9, page 9-29",
    src: "/wiring/ydre-dc-ch9-9-29-z2-tester-failure-chart-b.png",
    kind: "control",
  },
  ...YDRE_DC_CH9_GENIUS_IDS.map((id, i) => {
    const page = 38 + i;
    const heading =
      page === 38
        ? "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps"
        : "TROUBLESHOOTING USING GENIUS — Faults and Troubleshooting steps (cont.)";
    return {
      id,
      title: `${heading}, page 9-${page}`,
      manualRef: `YDRA/E Service Manual, ${heading}, page 9-${page}`,
      src: `/wiring/ydre-dc-ch9-9-${page}-genius-faults.png`,
      kind: "control" as const,
    };
  }),
];

test("YDRE DC pack keeps the three wire maps, then Ch.9 flowchart / trees / Z-2 / Genius plates", () => {
  const sheets = sheetsForPack("yamaha-ydre-dc");
  const ids = sheets.map((s) => s.id);
  assert.deepEqual(ids, YDRE_DC_SHEET_IDS);
  assert.deepEqual(ids.slice(0, 3), YDRE_DC_WIRE_MAP_IDS);
  assert.equal(ids[3], "ydre-dc-ch9-flowchart-z2");
  assert.deepEqual(ids.slice(4, 10), YDRE_DC_CH9_TREE_IDS);
  assert.deepEqual(ids.slice(10, 12), YDRE_DC_CH9_Z2_IDS);
  assert.deepEqual(ids.slice(12), YDRE_DC_CH9_GENIUS_IDS);

  for (const id of YDRE_AC_SHEET_IDS) {
    assert.ok(!ids.includes(id), id);
  }
  assert.ok(!sheets.some((s) => /YDRE AC/i.test(s.title)));

  const cart = getSheet("ydre-dc-1");
  assert.ok(cart);
  assert.equal(cart.title, "YDRE DC MODELS WIRING DIAGRAM, Figure 8-19");
  assert.equal(cart.manualRef, "YDRA/E Service Manual, YDRE DC MODELS WIRING DIAGRAM, Figure 8-19, page 8-15");
  assert.equal(cart.src, "/wiring/ydre-dc-1.jpg");
  assert.doesNotMatch(cart.title, /cart wire map/i);
  assertPublicSrc(cart.src);

  const cruise = getSheet("ydre-dc-2");
  assert.ok(cruise);
  assert.equal(cruise.title, "YDRE DC MODELS WIRING DIAGRAM — YDRE Cruise, Figure 8-20");
  assert.equal(
    cruise.manualRef,
    "YDRA/E Service Manual, YDRE DC MODELS WIRING DIAGRAM — YDRE Cruise, Figure 8-20, page 8-16",
  );
  assert.equal(cruise.src, "/wiring/ydre-dc-2.jpg");
  assert.doesNotMatch(cruise.manualRef, /page 8-20/);
  assert.doesNotMatch(cruise.title, /cart wire map/i);
  assertPublicSrc(cruise.src);

  const mcu = getSheet("ydre-dc-mcu");
  assert.ok(mcu);
  assert.equal(mcu.title, "MAIN CONTROLLER WIRING DIAGRAM – DC MODELS, Figure 8-24");
  assert.equal(
    mcu.manualRef,
    "YDRA/E Service Manual, MAIN CONTROLLER WIRING DIAGRAM – DC MODELS, Figure 8-24, page 8-20",
  );
  assert.equal(mcu.src, "/wiring/ydre-dc-mcu.jpg");
  assert.doesNotMatch(mcu.title, /Fig\. 8-20/);
  assert.doesNotMatch(mcu.manualRef, /Figure 8-20/);
  assert.doesNotMatch(mcu.title, /controller wire map/i);
  assertPublicSrc(mcu.src);

  for (const expected of YDRE_DC_CH9_SHEETS) {
    const sheet = getSheet(expected.id);
    assert.ok(sheet, expected.id);
    assert.equal(sheet.title, expected.title);
    assert.equal(sheet.manualRef, expected.manualRef);
    assert.equal(sheet.src, expected.src);
    assert.equal(sheet.kind, expected.kind);
    assert.equal(sheet.landscape, false);
    assertPublicSrc(sheet.src);
  }

  const foreignPacks = ["yamaha-ydre-ac", "yamaha-ydra", "ezgo-txt-dcs", "ezgo-pds-36"];
  for (const packId of foreignPacks) {
    const foreign = sheetsForPack(packId);
    assert.ok(!foreign.some((s) => s.id.startsWith("ydre-dc-ch9-")), packId);
    assert.ok(!foreign.some((s) => YDRE_DC_SHEET_IDS.includes(s.id)), packId);
  }

  assert.deepEqual(sheetsForPack("yamaha-ydre-ac").map((s) => s.id), YDRE_AC_SHEET_IDS);
  assert.ok(!sheetsForPack("yamaha-ydre-ac").some((s) => YDRE_DC_SHEET_IDS.includes(s.id)));
});

const DCS_E6_ID = "dcs-e6-ten-pin-troubleshooting";
const EZGO_TXT_DCS_SHEET_IDS = ["dcs-connector", "dcs-wiring", DCS_E6_ID];
const DCS_WIRE_MAP_SHEETS: Array<{
  id: string;
  title: string;
  manualRef: string;
  src: string;
  kind: "pinout" | "full";
}> = [
  {
    id: "dcs-connector",
    title: "Fig. E-7 Checking Voltage on Ten Pin Connector",
    manualRef:
      "TXT 96–01 DCS Service Manual (28407-G01), Fig. E-7 Checking Voltage on Ten Pin Connector, page E-6 — Electronic Speed Control (DCS)",
    src: "/wiring/dcs-connector.jpg",
    kind: "pinout",
  },
  {
    id: "dcs-wiring",
    title: "Fig. E-16 Wiring Diagram",
    manualRef:
      "TXT 96–01 DCS Service Manual (28407-G01), Fig. E-16 Wiring Diagram, page E-14 — Electronic Speed Control (DCS)",
    src: "/wiring/dcs-wiring.jpg",
    kind: "full",
  },
];

test("TXT DCS pack keeps the two wire maps, then Fig. E-6 ten-pin troubleshooting tree", () => {
  for (const expected of DCS_WIRE_MAP_SHEETS) {
    const wireMap = getSheet(expected.id);
    assert.ok(wireMap, expected.id);
    assert.equal(wireMap.title, expected.title);
    assert.equal(wireMap.manualRef, expected.manualRef);
    assert.equal(wireMap.src, expected.src);
    assert.equal(wireMap.kind, expected.kind);
    assert.equal(wireMap.landscape, false);
    assert.match(wireMap.manualRef, /28407-G01/);
    assert.doesNotMatch(wireMap.title, /TXT DCS —/);
    assert.doesNotMatch(wireMap.title, /controller 10-pin|controller wires/i);
    assert.doesNotMatch(wireMap.manualRef, /Section E$/);
    assert.doesNotMatch(wireMap.manualRef, /TXT 96–01 DCS Service Manual, Section E/);
    assertPublicSrc(wireMap.src);
  }

  const sheet = getSheet(DCS_E6_ID);
  assert.ok(sheet);
  assert.equal(sheet.id, DCS_E6_ID);
  assert.equal(sheet.title, "Fig. E-6 Ten Pin Connector Troubleshooting Diagram");
  assert.equal(
    sheet.manualRef,
    "TXT 96–01 DCS Service Manual (28407-G01), Fig. E-6 Ten Pin Connector Troubleshooting Diagram, page E-5 — Electronic Speed Control (DCS)",
  );
  assert.equal(sheet.src, "/wiring/dcs-e6-ten-pin-troubleshooting.png");
  assert.equal(sheet.kind, "control");
  assert.equal(sheet.landscape, false);
  assert.match(sheet.manualRef, /28407-G01/);
  assert.match(sheet.manualRef, /Fig\. E-6/);
  assert.match(sheet.manualRef, /E-5/);
  assert.doesNotMatch(sheet.title, /wire map/i);
  assertPublicSrc(sheet.src);

  const ids = sheetsForPack("ezgo-txt-dcs").map((s) => s.id);
  assert.deepEqual(ids, EZGO_TXT_DCS_SHEET_IDS);
  assert.deepEqual(ids.slice(0, 2), ["dcs-connector", "dcs-wiring"]);
  assert.equal(ids[2], DCS_E6_ID);

  for (const packId of packsWithWiring()) {
    if (packId === "ezgo-txt-dcs") continue;
    assert.ok(
      !sheetsForPack(packId).some((s) => s.id === DCS_E6_ID),
      packId,
    );
  }

  assert.ok(!sheetsForPack("ezgo-pds-36").some((s) => s.id === DCS_E6_ID));
  assert.ok(!sheetsForPack("ezgo-txt-tct").some((s) => s.id === DCS_E6_ID));
  assert.ok(!sheetsForPack("ezgo-txt-36-non-pds").some((s) => s.id === DCS_E6_ID));
});
