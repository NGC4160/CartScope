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
    assert.equal(
      tree.title,
      `Fig. ${NON_PDS_FIGS[i]} Detailed Troubleshooting Diagram (Sheet ${i + 1} of 8)`,
    );
    assert.match(tree.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
    assert.match(tree.manualRef, /28646-G01/);
    assert.match(tree.manualRef, new RegExp(`Fig\\. ${NON_PDS_FIGS[i]}`));
    assert.match(tree.manualRef, /Detailed Troubleshooting Diagram/);
    assert.match(tree.manualRef, new RegExp(`Sheet ${i + 1} of 8`));
    assert.match(tree.manualRef, new RegExp(NON_PDS_PAGES[i]));
    assert.match(tree.manualRef, /Non-PDS/);
    assert.doesNotMatch(tree.title, /TXT 36 V Non-PDS — troubleshooting tree/);
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
    assert.equal(
      tree.title,
      `Fig. ${PDS_FIGS[i]} Detailed Troubleshooting Diagram (Sheet ${i + 1} of 10)`,
    );
    assert.match(tree.manualRef, /2001\+ EZ-GO TXT 36 V Service Manual/);
    assert.match(tree.manualRef, /28646-G01/);
    assert.match(tree.manualRef, new RegExp(`Fig\\. ${PDS_FIGS[i]}`));
    assert.match(tree.manualRef, /Detailed Troubleshooting Diagram/);
    assert.match(tree.manualRef, new RegExp(`Sheet ${i + 1} of 10`));
    assert.match(tree.manualRef, new RegExp(PDS_PAGES[i]));
    assert.match(tree.manualRef, /\(PDS\)/);
    assert.doesNotMatch(tree.title, /TXT 36 V PDS — troubleshooting tree/);
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

const ERIC_2014_SHEET_IDS = [
  "prec14-eric-28-1",
  "prec14-eric-28-3",
  "prec14-eric-28-4",
  "prec14-eric-28-5",
  "prec14-eric-28-7",
  "prec14-eric-tg1-p1",
  "prec14-eric-tg1-p2",
  "prec14-eric-tg2-p1",
  "prec14-eric-tg2-p2",
];
const ERIC_2017_SHEET_IDS = ["eric-main", "eric-instrument", "eric-batteries", "eric-lights"];
const ERIC_BATCH6_IDS = [
  "prec17-eric-fig12-1",
  "prec17-eric-fig12-2",
  "prec17-eric-fig12-3",
  "prec17-eric-fig12-4",
];

test("Precedent ERIC pack leads with 2014 ERIC plates, then 2017 ERIC Excel sheets, not the 2019 main harness", () => {
  const sheets = sheetsForPack("club-car-precedent-eric");
  const ids = sheets.map((s) => s.id);
  assert.deepEqual(ids, [...ERIC_2014_SHEET_IDS, ...ERIC_2017_SHEET_IDS, ...ERIC_BATCH6_IDS]);
  assert.ok(!ids.includes("prec19-e-main"));
  assert.ok(!sheets.some((s) => s.title === "2019 Precedent electric — main wire bundle"));

  for (const id of [...ERIC_2014_SHEET_IDS, ...ERIC_2017_SHEET_IDS, ...ERIC_BATCH6_IDS]) {
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
const DS_IQ_BATCH6_IDS = [
  "ds2003-fig11-1",
  "ds2003-fig11-2",
  "ds2003-fig11-3",
  "ds2003-fig11-4",
  "ds2003-fig11-5",
  "ds2003-fig11-6",
];
const PRECEDENT_IQ_BATCH6_IDS = [
  "prec08-iq-fig11-1",
  "prec08-iq-fig11-2",
  "prec09-iq-tps-fig11-1",
  "prec09-iq-tps-fig11-2",
  "prec09-iq-mcor-fig12-1",
  "prec09-iq-mcor-fig12-2",
];
const DS_IQ_SHEET_IDS = ["iq-main", ...IQ_TG_SHEET_IDS, ...DS_IQ_BATCH6_IDS];
const PRECEDENT_IQ_SHEET_IDS = [
  "iq-main",
  "iq-accessories",
  "iq-sonic",
  ...IQ_TG_SHEET_IDS,
  ...PRECEDENT_IQ_BATCH6_IDS,
];
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
  assert.deepEqual(dsIds.slice(1, 1 + IQ_TG_SHEET_IDS.length), IQ_TG_SHEET_IDS);

  const precIds = sheetsForPack("club-car-precedent-iq").map((s) => s.id);
  assert.deepEqual(precIds, PRECEDENT_IQ_SHEET_IDS);
  assert.deepEqual(precIds.slice(0, 3), ["iq-main", "iq-accessories", "iq-sonic"]);
  assert.deepEqual(precIds.slice(3, 3 + IQ_TG_SHEET_IDS.length), IQ_TG_SHEET_IDS);

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
const EZGO_TXT_DCS_SHEET_IDS = ["dcs-connector", "dcs-wiring", DCS_E6_ID, "dcs-g21", "dcs-l3", "dcs-l4"];
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

const L6S6_SHEET_IDS = [
  "l6s6-fig10",
  "l6s6-fig8-fig9",
  "l6s6-fig11",
  "l6s6-fig12",
  "l6s6-fig13",
  "l6s6-fig14",
  "l6s6-l-fig2",
  "l6s6-l-fig5",
  "l6s6-l-fig6-7",
];

const L6S6_SHEETS: Array<{ id: string; title: string; src: string }> = [
  {
    id: "l6s6-fig10",
    title: "Fig. 10 48 Volt Wiring Diagram",
    src: "/wiring/express-l6s6-fig10-48v-wiring.jpg",
  },
  {
    id: "l6s6-fig8-fig9",
    title: "Fig. 8 48 volt Fault Codes / Fig. 9 Controller Connectors and Connections",
    src: "/wiring/express-l6s6-fig8-fault-codes-fig9-connectors.jpg",
  },
  {
    id: "l6s6-l-fig2",
    title: "Fig. 2 Wiring Diagram",
    src: "/wiring/express-l6s6-l-fig2-wiring.jpg",
  },
];

test("Express L6 and S6 share SM 625621 plates and stay off S4", () => {
  assert.deepEqual(sheetsForPack("ezgo-express-l6").map((s) => s.id), L6S6_SHEET_IDS);
  assert.deepEqual(sheetsForPack("ezgo-express-s6").map((s) => s.id), L6S6_SHEET_IDS);
  assert.ok(!sheetsForPack("ezgo-express-s4").some((s) => L6S6_SHEET_IDS.includes(s.id)));
  assert.ok(!L6S6_SHEET_IDS.some((id) => sheetsForPack("ezgo-express-s4").some((s) => s.id === id)));

  for (const expected of L6S6_SHEETS) {
    const sheet = getSheet(expected.id);
    assert.ok(sheet, expected.id);
    assert.equal(sheet.title, expected.title);
    assert.equal(sheet.src, expected.src);
    assert.match(sheet.manualRef, /625621/);
    assertPublicSrc(sheet.src);
  }

  for (const id of L6S6_SHEET_IDS) {
    const sheet = getSheet(id);
    assert.ok(sheet, id);
    assertPublicSrc(sheet.src);
  }
});

const PREC14_EXCEL_SHEET_IDS = [
  "prec14-excel-13-4",
  "prec14-excel-13-1",
  "prec14-excel-13-2",
  "prec14-excel-tg1-p1",
  "prec14-excel-tg1-p2",
  "prec14-excel-tg2-p1",
  "prec14-excel-tg2-p2",
];

test("2014 Precedent Excel / PowerDrive plates lead the Excel pack with printed titles", () => {
  const ids = sheetsForPack("club-car-precedent-excel").map((s) => s.id);
  assert.deepEqual(ids.slice(0, PREC14_EXCEL_SHEET_IDS.length), PREC14_EXCEL_SHEET_IDS);
  assert.ok(ids.includes("excel-main"));

  const main = getSheet("prec14-excel-13-4");
  assert.ok(main);
  assert.equal(main.title, "Figure 13-4 / Figure 13-5 Wiring Diagram – Excel System with MCOR3");
  assert.match(main.manualRef, /105062901/);
  assert.match(main.manualRef, /PowerDrive/);
  assert.equal(main.landscape, true);
  assertPublicSrc(main.src);

  const tg1 = getSheet("prec14-excel-tg1-p1");
  assert.ok(tg1);
  assert.equal(tg1.title, "Troubleshooting Guide 1, page 13-9");
  assertPublicSrc(tg1.src);

  assert.ok(!sheetsForPack("club-car-precedent-iq").some((s) => s.id.startsWith("prec14-")));
  assert.ok(!sheetsForPack("club-car-precedent-eric").some((s) => s.id.startsWith("prec14-excel-")));
});

test("2014 Precedent ERIC plates use Section 28 printed titles and stay off Excel / IQ", () => {
  const main = getSheet("prec14-eric-28-1");
  assert.ok(main);
  assert.equal(main.title, "Figure 28-1 / Figure 28-2 Wiring Diagram – Excel System with ERIC Charging");
  assert.match(main.manualRef, /105062901/);
  assert.match(main.manualRef, /28-4/);
  assertPublicSrc(main.src);

  const tg2 = getSheet("prec14-eric-tg2-p2");
  assert.ok(tg2);
  assert.equal(tg2.title, "Troubleshooting Guide 2, page 28-16");
  assertPublicSrc(tg2.src);

  assert.ok(!sheetsForPack("club-car-precedent-excel").some((s) => s.id.startsWith("prec14-eric-")));
  assert.ok(!sheetsForPack("club-car-precedent-iq").some((s) => s.id.startsWith("prec14-eric-")));
});

test("2014 Precedent gasoline plates land on the gas pack with printed TPS titles", () => {
  const ids = sheetsForPack("club-car-precedent-gas").map((s) => s.id);
  assert.deepEqual(ids.slice(0, 3), ["prec14-gas-19-1", "prec14-gas-19-3", "prec14-gas-19-5"]);

  const tps = getSheet("prec14-gas-19-1");
  assert.ok(tps);
  assert.equal(tps.title, "Figure 19-1 / Figure 19-2 Wiring Diagram – Precedent Gasoline Vehicle with TPS");
  assert.match(tps.manualRef, /105062901/);
  assertPublicSrc(tps.src);

  assert.ok(!sheetsForPack("club-car-precedent-excel").some((s) => s.id.startsWith("prec14-gas-")));
});

const STAR_SHEET_IDS = [
  "star-curtis1243-2007",
  "sirius-combo-314",
  "sirius-combo-315",
  "sirius-headlight-316",
  "sirius-turn-317",
  "sirius-cruise-324",
];

test("Star Sirius pack lists community Curtis 1243 chassis then factory Sirius body plates", () => {
  assert.deepEqual(sheetsForPack("star-sirius").map((s) => s.id), STAR_SHEET_IDS);

  const chassis = getSheet("star-curtis1243-2007");
  assert.ok(chassis);
  assert.match(chassis.title, /Curtis 1243/);
  assert.match(chassis.title, /Cartaholics community/);
  assert.match(chassis.manualRef, /community/i);
  assert.match(chassis.manualRef, /1243-43301/);
  assert.equal(chassis.landscape, true);
  assertPublicSrc(chassis.src);

  const head = getSheet("sirius-headlight-316");
  assert.ok(head);
  assert.equal(head.title, "Sirius Headlight Wiring Diagram, page 316");
  assert.match(head.manualRef, /V 1\.06/);
  assertPublicSrc(head.src);

  for (const packId of packsWithWiring()) {
    if (packId === "star-sirius") continue;
    assert.ok(!sheetsForPack(packId).some((s) => STAR_SHEET_IDS.includes(s.id)), packId);
  }

  assert.equal(getSheet("icon-revenge-wiring"), undefined);
  assert.ok(!packsWithWiring().includes("icon-revenge"));
  assert.ok(!packsWithWiring().includes("icon-gas"));
});

const EMERGE_GE403_IDS = ["emerge-ge403-2008", "emerge-0709-lighting"];
const EMERGE_1268_IDS = [
  "emerge-curtis1268-2009-2014",
  "emerge-1011-control-9-7",
  "emerge-1011-lighting-9-8",
];
const EMERGE_SEVCON_IDS = [
  "emerge-sevcon-2015",
  "emerge-sevcon-2016-2019",
  "emerge-2018-se-9-7-1",
  "emerge-2018-ssle-9-7-2",
  "emerge-sevcon-2023",
];
const EVO_AC_IDS = ["evo-1232se-system", "evo-1232se-35pin", "evo-touchscreen"];
const EVO_D5_IDS = [
  "evo-d5-ac-system",
  "evo-d5-comm",
  "evo-d5-touch-panel",
  "evo-d5-comm-sound",
  "evo-d5-lithium-layout",
  "evo-d5-lithium-circuit",
];
const BB_CURTIS_IDS = [
  "bb-curtis-fig3",
  "bb-curtis-35pin",
  "bb-curtis-table2-p1",
  "bb-curtis-table2-p2",
  "bb-curtis-fig4",
  "bb-curtis-fig5",
  "bb-curtis-fig6",
];

function assertPackOnly(packId: string, ids: string[]) {
  assert.deepEqual(sheetsForPack(packId).map((s) => s.id), ids);
  for (const other of packsWithWiring()) {
    if (other === packId) continue;
    assert.ok(!sheetsForPack(other).some((s) => ids.includes(s.id)), other);
  }
}

test("Tomberlin EMerge GE403 / Curtis 1268 / Sevcon packs use printed binder titles and stay isolated", () => {
  assertPackOnly("tomberlin-emerge-ge403", EMERGE_GE403_IDS);
  assertPackOnly("tomberlin-emerge-curtis1268", EMERGE_1268_IDS);
  assertPackOnly("tomberlin-emerge-sevcon", EMERGE_SEVCON_IDS);

  const ge403 = getSheet("emerge-ge403-2008");
  assert.ok(ge403);
  assert.match(ge403.title, /GE4003/);
  assert.match(ge403.manualRef, /2008/);
  assert.equal(ge403.landscape, false);
  assertPublicSrc(ge403.src);

  const lighting = getSheet("emerge-0709-lighting");
  assert.ok(lighting);
  assert.equal(lighting.title, "Lighting circuit");
  assertPublicSrc(lighting.src);

  const c1268 = getSheet("emerge-curtis1268-2009-2014");
  assert.ok(c1268);
  assert.match(c1268.title, /Curtis 1268/);
  assert.equal(c1268.landscape, true);
  assertPublicSrc(c1268.src);

  const control = getSheet("emerge-1011-control-9-7");
  assert.ok(control);
  assert.equal(control.title, "Control circuit, MERGE 9-7");
  assert.match(control.manualRef, /9-7/);
  assertPublicSrc(control.src);

  const se = getSheet("emerge-2018-se-9-7-1");
  assert.ok(se);
  assert.equal(se.title, "SE Schematic, 9-7-1");
  assertPublicSrc(se.src);

  const p75 = getSheet("emerge-sevcon-2023");
  assert.ok(p75);
  assert.match(p75.title, /page 75/);
  assertPublicSrc(p75.src);
});

test("Evolution AC 1232SE and D5 packs use printed plate titles and stay isolated", () => {
  assertPackOnly("evolution-ac", EVO_AC_IDS);
  assertPackOnly("evolution-d5", EVO_D5_IDS);

  const sys = getSheet("evo-1232se-system");
  assert.ok(sys);
  assert.equal(sys.title, "1232SE SYSTEM DIAGRAM");
  assertPublicSrc(sys.src);

  const pin = getSheet("evo-1232se-35pin");
  assert.ok(pin);
  assert.equal(pin.title, "35pins connector for AC controller");
  assertPublicSrc(pin.src);

  const ts = getSheet("evo-touchscreen");
  assert.ok(ts);
  assert.equal(ts.title, "TOUCHSCREEN WIRING DIAGRAM");
  assert.equal(ts.landscape, true);
  assertPublicSrc(ts.src);

  const d5 = getSheet("evo-d5-ac-system");
  assert.ok(d5);
  assert.equal(d5.title, "AC SYSTEM DIAGRAM-V1.0");
  assert.equal(d5.landscape, true);
  assertPublicSrc(d5.src);

  const lith = getSheet("evo-d5-lithium-circuit");
  assert.ok(lith);
  assert.equal(lith.title, "LITHIUM BATTERY PACK INTERNAL CIRCUIT DIAGRAM-V1.0");
  assertPublicSrc(lith.src);

  assert.equal(getSheet("evo-d5-light-kits"), undefined);
});

test("Yamaha YTF1 plate is a catalog gap fill and is not remapped onto YDRA/YDRE", () => {
  assert.deepEqual(sheetsForPack("yamaha-ytf1").map((s) => s.id), ["ytf1-wiring"]);
  const sheet = getSheet("ytf1-wiring");
  assert.ok(sheet);
  assert.equal(sheet.title, "YTF1 WIRING DIAGRAM");
  assert.match(sheet.manualRef, /JW6 11-1 STANDARD/);
  assertPublicSrc(sheet.src);

  assert.ok(!sheetsForPack("yamaha-ydra").some((s) => s.id === "ytf1-wiring"));
  assert.ok(!sheetsForPack("yamaha-ydre-ac").some((s) => s.id === "ytf1-wiring"));
  assert.ok(!sheetsForPack("yamaha-ydre-dc").some((s) => s.id === "ytf1-wiring"));
});

test("Bad Boy Curtis 1232E pack lists Figure 3 / 35-pin / Table 2 / throttle figures only", () => {
  assertPackOnly("badboy-curtis-1232e", BB_CURTIS_IDS);

  const fig3 = getSheet("bb-curtis-fig3");
  assert.ok(fig3);
  assert.equal(fig3.title, "Figure 3: Basic Wiring Diagram");
  assert.match(fig3.manualRef, /os 31/);
  assertPublicSrc(fig3.src);

  const table2 = getSheet("bb-curtis-table2-p1");
  assert.ok(table2);
  assert.equal(table2.title, "Table 2 Low Power Connections");
  assertPublicSrc(table2.src);

  const fig5 = getSheet("bb-curtis-fig5");
  assert.ok(fig5);
  assert.equal(fig5.title, "Figure 5: Wiring for Type 2 Throttles");
  assertPublicSrc(fig5.src);

  assert.ok(packsWithWiring().includes("badboy-ambush-gas"));
  assert.ok(packsWithWiring().includes("badboy-ambush-electric"));
  assert.ok(packsWithWiring().includes("badboy-recoil-is"));
  assert.ok(!packsWithWiring().includes("badboy-ambush"));
  assert.ok(!packsWithWiring().includes("badboy-recoil"));
});

const BB_AMBUSH_GAS_IDS = ["bb-ambush-fig2", "bb-ambush-fig5", "bb-ambush-fig6"];
const BB_AMBUSH_ELEC_IDS = ["bb-ambush-fig10", "bb-ambush-fig22-23", "bb-ambush-fig5", "bb-ambush-fig6"];
const BB_AMBUSH_SHARED_IDS = ["bb-ambush-fig5", "bb-ambush-fig6"];
const BB_RECOIL_IDS = ["bb-recoil-electrical", "bb-recoil-battery"];
const DS2000_VGLIDE_IDS = ["ds2000-vglide-fig11-2", "ds2000-vglide-fig11-3"];
const DS2000_PDPLUS_IDS = [
  "ds2000-pdplus-fig11-1",
  "ds2000-pdplus-fig11-2",
  "ds2000-pdplus-fig11-3",
  "ds2000-pdplus-fig11-4",
  "ds2000-pdplus-fig11-5",
  "ds2000-pdplus-fig11-6",
  "ds2000-pdplus-fig11-7",
  "ds2000-pdplus-fig11-8",
  "ds2000-pdplus-fig11-9",
];
const DS2000_PD48_IDS = [
  "ds2000-pd48-fig11-2",
  "ds2000-pd48-fig11-3",
  "ds2000-pd48-fig11-4",
  "ds2000-pd48-fig11-5",
  "ds2000-pd48-fig11-6",
];

test("Bad Boy Ambush gas / electric packs use printed Section J / T titles", () => {
  assert.deepEqual(sheetsForPack("badboy-ambush-gas").map((s) => s.id), BB_AMBUSH_GAS_IDS);
  assert.deepEqual(sheetsForPack("badboy-ambush-electric").map((s) => s.id), BB_AMBUSH_ELEC_IDS);

  const gas = getSheet("bb-ambush-fig2");
  assert.ok(gas);
  assert.equal(gas.title, "Fig. 2 Gas Powertrain And 4WD Electrical Schematic");
  assert.match(gas.manualRef, /page J-2/);
  assertPublicSrc(gas.src);

  const harness = getSheet("bb-ambush-fig5");
  assert.ok(harness);
  assert.equal(harness.title, "Fig. 5 Main Harness Wiring Diagram");
  assertPublicSrc(harness.src);

  const elec = getSheet("bb-ambush-fig10");
  assert.ok(elec);
  assert.equal(elec.title, "Fig. 10 Electric Powertrain Electrical Schematic");
  assertPublicSrc(elec.src);

  const pins = getSheet("bb-ambush-fig22-23");
  assert.ok(pins);
  assert.match(pins.title, /Fig\. 22/);
  assert.match(pins.title, /Fig\. 23/);
  assert.equal(pins.kind, "pinout");
  assertPublicSrc(pins.src);

  assert.ok(!sheetsForPack("badboy-ambush-gas").some((s) => s.id === "bb-ambush-fig10"));
  assert.ok(!sheetsForPack("badboy-ambush-electric").some((s) => s.id === "bb-ambush-fig2"));
  assert.ok(!sheetsForPack("badboy-curtis-1232e").some((s) => BB_AMBUSH_GAS_IDS.includes(s.id)));
  assert.ok(!sheetsForPack("badboy-curtis-1232e").some((s) => s.id === "bb-ambush-fig10"));

  for (const packId of packsWithWiring()) {
    if (packId === "badboy-ambush-gas" || packId === "badboy-ambush-electric") continue;
    assert.ok(
      !sheetsForPack(packId).some((s) => BB_AMBUSH_SHARED_IDS.includes(s.id)),
      packId,
    );
  }
});

test("Bad Boy Recoil iS 72 V pack lists Electrical Information and Battery Layout only", () => {
  assertPackOnly("badboy-recoil-is", BB_RECOIL_IDS);

  const info = getSheet("bb-recoil-electrical");
  assert.ok(info);
  assert.equal(info.title, "Electrical Information – Recoil");
  assert.match(info.manualRef, /FRONT-SLAVE/);
  assertPublicSrc(info.src);

  const batt = getSheet("bb-recoil-battery");
  assert.ok(batt);
  assert.equal(batt.title, "Battery Layout");
  assert.match(batt.manualRef, /page 46/);
  assertPublicSrc(batt.src);
});

test("Club Car DS 2000 plates fill gaps and keep 1995–96 titles on the same packs", () => {
  const vglide = sheetsForPack("club-car-ds-vglide").map((s) => s.id);
  assert.deepEqual(vglide.slice(0, 3), ["vglide-schematic", "vglide-control", "vglide-power"]);
  assert.deepEqual(vglide.slice(3), DS2000_VGLIDE_IDS);

  const pdplus = sheetsForPack("club-car-ds-pdplus").map((s) => s.id);
  assert.deepEqual(pdplus.slice(0, 2), ["pdplus-main", "pdplus-zplug"]);
  assert.deepEqual(pdplus.slice(2), DS2000_PDPLUS_IDS);

  const pd48 = sheetsForPack("club-car-ds-electric").map((s) => s.id);
  assert.deepEqual(pd48.slice(0, 2), ["pd48-multistep", "pd48-cvpot"]);
  assert.deepEqual(pd48.slice(2), DS2000_PD48_IDS);

  const v3 = getSheet("ds2000-vglide-fig11-3");
  assert.ok(v3);
  assert.equal(v3.title, "2000 V-Glide 36 V — Figure 11-3 Vehicle Wiring Diagram");
  assert.match(v3.manualRef, /2000 V-Glide/);
  assertPublicSrc(v3.src);

  const pin23 = getSheet("ds2000-pdplus-fig11-4");
  assert.ok(pin23);
  assert.equal(pin23.title, "2000 PowerDrive Plus — Figure 11-4 23-Pin Connector Plug");
  assert.equal(pin23.kind, "pinout");
  assertPublicSrc(pin23.src);

  const dsVillager = getSheet("ds2000-pd48-fig11-2");
  assert.ok(dsVillager);
  assert.match(dsVillager.title, /DS and Villager 4/);
  assertPublicSrc(dsVillager.src);

  assert.equal(getSheet("vglide-schematic")?.title, "V-Glide 36 V — control, power, and charge map (Fig. 19-2)");
  assert.equal(getSheet("pdplus-zplug")?.title, "PowerDrive Plus — controller plug pins (Fig. 21-4)");
  assert.equal(getSheet("pd48-multistep")?.title, "PowerDrive System 48 — stepped gas-pedal sensor wires (Fig. 20-2)");

  assert.ok(!sheetsForPack("club-car-ds-iq").some((s) => s.id.startsWith("ds2000-")));
  for (const packId of packsWithWiring()) {
    if (packId === "club-car-ds-vglide") continue;
    assert.ok(!sheetsForPack(packId).some((s) => DS2000_VGLIDE_IDS.includes(s.id)), packId);
  }
  for (const packId of packsWithWiring()) {
    if (packId === "club-car-ds-pdplus") continue;
    assert.ok(!sheetsForPack(packId).some((s) => DS2000_PDPLUS_IDS.includes(s.id)), packId);
  }
  for (const packId of packsWithWiring()) {
    if (packId === "club-car-ds-electric") continue;
    assert.ok(!sheetsForPack(packId).some((s) => DS2000_PD48_IDS.includes(s.id)), packId);
  }
});

const GEM_2013_IDS = [
  "gem-2013-electrical-system",
  "gem-2013-ts-ab",
  "gem-2013-ts-c",
  "gem-2013-battery",
  "gem-2013-psdm",
  "gem-2013-power-dist",
  "gem-2013-charging",
  "gem-2013-charging-e6",
  "gem-2013-fast-charge",
  "gem-2013-fast-charge-e6",
  "gem-2013-park-brake",
  "gem-2013-dcdc",
  "gem-2013-contactor",
  "gem-2013-contactor-e6",
  "gem-2013-controller",
  "gem-2013-display",
  "gem-2013-display-2",
  "gem-2013-display-3",
  "gem-2013-horn",
  "gem-2013-heater",
  "gem-2013-dash-fan",
  "gem-2013-light-bar",
  "gem-2013-audio",
  "gem-2013-front-lights",
  "gem-2013-rear-lights",
  "gem-2013-rear-lights-2",
  "gem-2013-rear-except-ny",
  "gem-2013-rear-ny",
  "gem-2013-turn",
  "gem-2013-wiper",
  "gem-2013-conv-harn",
  "gem-2013-conv-pins",
  "gem-2013-hl-harn",
  "gem-2013-hl-pins",
  "gem-2013-front-harn",
  "gem-2013-front-pins",
  "gem-2013-ip-harn",
  "gem-2013-ip-pins",
  "gem-2013-ctrl-harn",
  "gem-2013-ctrl-harn-2",
  "gem-2013-ctrl-pins",
  "gem-2013-main-harn",
  "gem-2013-main-harn-2",
  "gem-2013-main-pins",
  "gem-2013-tail-harn",
  "gem-2013-tail-pins",
];

test("GEM 2013 e-Series pack uses printed 9924112 titles and stays isolated", () => {
  assertPackOnly("gem-eseries-2013", GEM_2013_IDS);

  const block = getSheet("gem-2013-electrical-system");
  assert.ok(block);
  assert.equal(block.title, "ELECTRICAL SYSTEM");
  assert.match(block.manualRef, /9924112/);
  assert.match(block.manualRef, /5\.3/);
  assertPublicSrc(block.src);

  const ts = getSheet("gem-2013-ts-ab");
  assert.ok(ts);
  assert.equal(ts.title, "DRIVE AND POWER SYSTEM TROUBLESHOOTING DIAGRAMS");
  assertPublicSrc(ts.src);

  const ctrl = getSheet("gem-2013-controller");
  assert.ok(ctrl);
  assert.equal(ctrl.title, "MOTOR CONTROLLER SYSTEM");
  assertPublicSrc(ctrl.src);

  const e6 = getSheet("gem-2013-contactor-e6");
  assert.ok(e6);
  assert.match(e6.title, /e6/);
  assert.match(e6.title, /eL XD/);
  assertPublicSrc(e6.src);

  const pins = getSheet("gem-2013-ctrl-pins");
  assert.ok(pins);
  assert.equal(pins.kind, "pinout");
  assertPublicSrc(pins.src);

  assert.equal(getSheet("gem-2013-abbrev"), undefined);
});

const EVIS_2020_IDS = [
  "evis-2020-fig2",
  "evis-2020-fig3",
  "evis-2020-fig4",
  "evis-2020-fig9",
  "evis-2020-fig1",
  "evis-2020-fig19",
];

test("Tracker EViS 72 V 2020 pack uses printed 10002660-C titles and stays isolated", () => {
  assertPackOnly("tracker-evis-2020", EVIS_2020_IDS);

  const harness = getSheet("evis-2020-fig2");
  assert.ok(harness);
  assert.equal(harness.title, "Fig. 2 Main Harness Wiring Diagram");
  assert.match(harness.manualRef, /10002660-C/);
  assert.match(harness.manualRef, /44/);
  assertPublicSrc(harness.src);

  const sch = getSheet("evis-2020-fig3");
  assert.ok(sch);
  assert.equal(sch.title, "Fig. 3 Electrical Schematic");
  assertPublicSrc(sch.src);

  const sch2 = getSheet("evis-2020-fig4");
  assert.ok(sch2);
  assert.equal(sch2.title, "Fig. 4 Electrical Schematic (continued)");
  assertPublicSrc(sch2.src);

  const pins = getSheet("evis-2020-fig9");
  assert.ok(pins);
  assert.equal(pins.title, "Fig. 9 Front - Slave and Rear - Master");
  assert.equal(pins.kind, "pinout");
  assertPublicSrc(pins.src);

  assert.equal(getSheet("evis-2020-fig5"), undefined);
  assert.equal(getSheet("evis-800sx"), undefined);
});

const EZGO_2FIVE_IDS = ["2five-fig20", "2five-fig21"];
const EZGO_EARLY_IDS = ["early-k1", "early-n1", "early-n9"];
const EZGO_RXV_BATCH5_IDS = ["rxv-fig29", "rxv-fig30", "rxv-fig31", "rxv-fig32"];
const EZGO_TXT48_BATCH5_IDS = ["txt48-fig8", "txt48-fig9"];
const EZGO_FLEET2014_IDS = ["fleet2014-fig1", "fleet2014-fig10", "fleet2014-fig11"];
const EZGO_S4_BATCH5_IDS = ["s4-fig7", "s4-fig8", "s4-fig9", "s4-fig10", "s4-fig11", "s4-fig15"];

test("EZ-GO 2Five pack uses printed Section K titles and stays isolated", () => {
  assertPackOnly("ezgo-2five", EZGO_2FIVE_IDS);

  const main = getSheet("2five-fig20");
  assert.ok(main);
  assert.equal(main.title, "Fig. 20 Main Wiring Harness (AFTER 1 FEBRUARY 2012)");
  assert.match(main.manualRef, /K-10/);
  assertPublicSrc(main.src);

  const acc = getSheet("2five-fig21");
  assert.ok(acc);
  assert.equal(acc.title, "Fig. 21 Accessory Wiring Harness");
  assert.equal(acc.kind, "accessory");
  assertPublicSrc(acc.src);

  assert.equal(getSheet("2five-fig22"), undefined);
});

test("EZ-GO electric 1989–1994 pack uses printed K/N titles and stays isolated", () => {
  assertPackOnly("ezgo-electric-1989-1994", EZGO_EARLY_IDS);

  const k1 = getSheet("early-k1");
  assert.ok(k1);
  assert.equal(k1.title, "FIG. K-1 ELECTRIC VEHICLE WIRING DIAGRAM");
  assert.match(k1.manualRef, /K-2/);
  assertPublicSrc(k1.src);

  const n1 = getSheet("early-n1");
  assert.ok(n1);
  assert.equal(n1.title, "FIG. N-1 CONTROL AND POWER CIRCUITS");
  assertPublicSrc(n1.src);

  const n9 = getSheet("early-n9");
  assert.ok(n9);
  assert.equal(n9.title, "FIG. N-9 WIRING DIAGRAM");
  assertPublicSrc(n9.src);

  assert.equal(getSheet("early-k9"), undefined);
});

test("EZ-GO Batch 5 gap-fill plates land only on the matching existing packs", () => {
  const rxv = sheetsForPack("ezgo-rxv-ac").map((s) => s.id);
  assert.deepEqual(rxv.slice(0, 4), ["rxv-k1", "rxv-k2", "rxv-k3", "rxv-k4"]);
  assert.deepEqual(rxv.slice(4), EZGO_RXV_BATCH5_IDS);
  const fig29 = getSheet("rxv-fig29");
  assert.ok(fig29);
  assert.equal(fig29.title, "Fig. 29 Main Wiring Harness Diagram (after 23 January 2012)");
  assertPublicSrc(fig29.src);

  const tct = sheetsForPack("ezgo-txt-tct").map((s) => s.id);
  assert.deepEqual(tct.slice(-2), EZGO_TXT48_BATCH5_IDS);
  const fig9 = getSheet("txt48-fig9");
  assert.ok(fig9);
  assert.equal(fig9.title, "Fig. 9 Controller Wiring Diagram");
  assertPublicSrc(fig9.src);

  const gas = sheetsForPack("ezgo-txt-gas").map((s) => s.id);
  assert.deepEqual(gas.slice(4, 7), EZGO_FLEET2014_IDS);
  const fleet1 = getSheet("fleet2014-fig1");
  assert.ok(fleet1);
  assert.equal(fleet1.title, "Fig. 1 Electrical System Wiring Diagram");
  assert.match(fleet1.manualRef, /27481-G01/);
  assertPublicSrc(fleet1.src);

  const s4 = sheetsForPack("ezgo-express-s4").map((s) => s.id);
  assert.deepEqual(s4.slice(-6), EZGO_S4_BATCH5_IDS);
  const j1 = getSheet("s4-fig8");
  assert.ok(j1);
  assert.equal(j1.title, "Fig. 8 J-1 Pin Connector Diagnostics");
  assert.equal(j1.kind, "pinout");
  assertPublicSrc(j1.src);

  const dcsG21 = getSheet("dcs-g21");
  assert.ok(dcsG21);
  assert.equal(dcsG21.title, "Fig. G-21 Wiring Diagram");
  assert.equal(dcsG21.landscape, true);
  assertPublicSrc(dcsG21.src);
  const dcsL3 = getSheet("dcs-l3");
  assert.ok(dcsL3);
  assert.equal(dcsL3.title, "Fig. L-3 Powerwise™ Wiring Diagram");
  assertPublicSrc(dcsL3.src);

  const batch5Only = [
    ...EZGO_2FIVE_IDS,
    ...EZGO_EARLY_IDS,
    ...EZGO_RXV_BATCH5_IDS,
    ...EZGO_TXT48_BATCH5_IDS,
    ...EZGO_FLEET2014_IDS,
    ...EZGO_S4_BATCH5_IDS,
    "dcs-g21",
    "dcs-l3",
    "dcs-l4",
  ];
  for (const packId of packsWithWiring()) {
    const ids = sheetsForPack(packId).map((s) => s.id);
    for (const id of batch5Only) {
      if (packId === "ezgo-2five" && EZGO_2FIVE_IDS.includes(id)) continue;
      if (packId === "ezgo-electric-1989-1994" && EZGO_EARLY_IDS.includes(id)) continue;
      if (packId === "ezgo-rxv-ac" && EZGO_RXV_BATCH5_IDS.includes(id)) continue;
      if (packId === "ezgo-txt-tct" && EZGO_TXT48_BATCH5_IDS.includes(id)) continue;
      if (packId === "ezgo-txt-gas" && EZGO_FLEET2014_IDS.includes(id)) continue;
      if (packId === "ezgo-express-s4" && EZGO_S4_BATCH5_IDS.includes(id)) continue;
      if (packId === "ezgo-txt-dcs" && (id === "dcs-g21" || id === "dcs-l3" || id === "dcs-l4")) continue;
      assert.ok(!ids.includes(id), `${packId} should not have ${id}`);
    }
  }
});

const PREC14_EXCEL_BATCH6_IDS = [
  "prec08-excel-fig12-1",
  "prec08-excel-fig12-2",
  "prec09-excel-tps-fig13-4",
  "prec09-excel-tps-fig13-5",
  "prec09-excel-mcor-fig14-4",
  "prec09-excel-mcor-fig14-5",
];
const PREC_GAS_BATCH6_IDS = [
  "prec17-gas-fig18-1",
  "prec17-gas-fig18-2",
  "prec17-gas-fig18-3",
  "prec17-gas-fig18-4",
];

test("Jesse-binder Batch 6 gap-fill plates land only on the matching existing packs", () => {
  const ds = sheetsForPack("club-car-ds-iq").map((s) => s.id);
  assert.deepEqual(ds.slice(-DS_IQ_BATCH6_IDS.length), DS_IQ_BATCH6_IDS);
  const dsMain = getSheet("ds2003-fig11-6");
  assert.ok(dsMain);
  assert.equal(dsMain.title, "Figure 11-6 Wiring Diagram");
  assert.equal(dsMain.kind, "full");
  assert.equal(dsMain.landscape, false);
  assertPublicSrc(dsMain.src);
  const obc = getSheet("ds2003-fig11-1");
  assert.ok(obc);
  assert.equal(obc.title, "Figure 11-1 Onboard Computer Circuit");
  assert.equal(obc.kind, "control");
  assertPublicSrc(obc.src);

  const precIq = sheetsForPack("club-car-precedent-iq").map((s) => s.id);
  assert.deepEqual(precIq.slice(-PRECEDENT_IQ_BATCH6_IDS.length), PRECEDENT_IQ_BATCH6_IDS);
  const iq08 = getSheet("prec08-iq-fig11-1");
  assert.ok(iq08);
  assert.equal(iq08.title, "Figure 11-1 Wiring Diagram – IQ System");
  assertPublicSrc(iq08.src);
  const iqTps = getSheet("prec09-iq-tps-fig11-1");
  assert.ok(iqTps);
  assert.equal(iqTps.title, "Figure 11-1 Wiring Diagram – IQ System with TPS");
  assertPublicSrc(iqTps.src);
  const iqMcor = getSheet("prec09-iq-mcor-fig12-1");
  assert.ok(iqMcor);
  assert.equal(iqMcor.title, "Figure 12-1 Wiring Diagram – IQ System with MCOR");
  assertPublicSrc(iqMcor.src);

  const excel = sheetsForPack("club-car-precedent-excel").map((s) => s.id);
  assert.deepEqual(excel.slice(-PREC14_EXCEL_BATCH6_IDS.length), PREC14_EXCEL_BATCH6_IDS);
  const excel08 = getSheet("prec08-excel-fig12-1");
  assert.ok(excel08);
  assert.equal(excel08.title, "Figure 12-1 Wiring Diagram – Excel System");
  assertPublicSrc(excel08.src);
  const excelTps = getSheet("prec09-excel-tps-fig13-4");
  assert.ok(excelTps);
  assert.equal(excelTps.title, "Figure 13-4 Wiring Diagram – Excel System with TPS");
  assertPublicSrc(excelTps.src);
  const excelMcor = getSheet("prec09-excel-mcor-fig14-4");
  assert.ok(excelMcor);
  assert.equal(excelMcor.title, "Figure 14-4 Wiring Diagram – Excel System with MCOR");
  assertPublicSrc(excelMcor.src);

  const eric = sheetsForPack("club-car-precedent-eric").map((s) => s.id);
  assert.deepEqual(eric.slice(-ERIC_BATCH6_IDS.length), ERIC_BATCH6_IDS);
  const ericMain = getSheet("prec17-eric-fig12-1");
  assert.ok(ericMain);
  assert.equal(ericMain.title, "Figure 12-1 Wiring Diagram – Excel System with ERIC Charging");
  assertPublicSrc(ericMain.src);
  const ericBatt = getSheet("prec17-eric-fig12-4");
  assert.ok(ericBatt);
  assert.equal(ericBatt.title, "Figure 12-4 Battery Wiring Diagram – Precedent with ERIC Charging");
  assert.equal(ericBatt.kind, "charge");
  assertPublicSrc(ericBatt.src);

  const gas = sheetsForPack("club-car-precedent-gas").map((s) => s.id);
  assert.deepEqual(gas.slice(-PREC_GAS_BATCH6_IDS.length), PREC_GAS_BATCH6_IDS);
  const efi = getSheet("prec17-gas-fig18-1");
  assert.ok(efi);
  assert.equal(efi.title, "Figure 18-1 Wiring Diagram for Precedent EFI Gasoline Vehicle");
  assertPublicSrc(efi.src);
  const efiEng = getSheet("prec17-gas-fig18-4");
  assert.ok(efiEng);
  assert.equal(efiEng.title, "Figure 18-4 Wiring Diagram – EFI and Engine");
  assertPublicSrc(efiEng.src);

  const txtGas = sheetsForPack("ezgo-txt-gas").map((s) => s.id);
  assert.equal(txtGas.at(-1), "ezgas-2007-fig9");
  const acc = getSheet("ezgas-2007-fig9");
  assert.ok(acc);
  assert.equal(acc.title, "Fig. 9 Accessory Wiring Diagram");
  assert.equal(acc.kind, "accessory");
  assert.match(acc.manualRef, /605586/);
  assertPublicSrc(acc.src);
  assert.equal(getSheet("ezgas-2007-fig1"), undefined);

  const marathon = sheetsForPack("ezgo-marathon-gas").map((s) => s.id);
  assert.equal(marathon.at(-1), "marathon-fig-l1");
  const l1 = getSheet("marathon-fig-l1");
  assert.ok(l1);
  assert.equal(l1.title, "FIG. L-1 ELECTRICAL SYSTEM WIRING DIAGRAM");
  assertPublicSrc(l1.src);

  const batch6Only: Record<string, string[]> = {
    "club-car-ds-iq": DS_IQ_BATCH6_IDS,
    "club-car-precedent-iq": PRECEDENT_IQ_BATCH6_IDS,
    "club-car-precedent-excel": PREC14_EXCEL_BATCH6_IDS,
    "club-car-precedent-eric": ERIC_BATCH6_IDS,
    "club-car-precedent-gas": PREC_GAS_BATCH6_IDS,
    "ezgo-txt-gas": ["ezgas-2007-fig9"],
    "ezgo-marathon-gas": ["marathon-fig-l1"],
  };
  const allBatch6 = Object.values(batch6Only).flat();
  const titles = allBatch6.map((id) => {
    const sheet = getSheet(id);
    assert.ok(sheet, id);
    return sheet.title;
  });
  assert.equal(new Set(titles).size, titles.length);
  for (const packId of packsWithWiring()) {
    for (const sheet of sheetsForPack(packId)) {
      if (allBatch6.includes(sheet.id)) continue;
      assert.ok(!titles.includes(sheet.title), `title collision: ${sheet.title}`);
    }
  }

  for (const packId of packsWithWiring()) {
    const ids = sheetsForPack(packId).map((s) => s.id);
    for (const id of allBatch6) {
      const owner = Object.entries(batch6Only).find(([, list]) => list.includes(id))?.[0];
      if (packId === owner) continue;
      assert.ok(!ids.includes(id), `${packId} should not have ${id}`);
    }
  }
});
