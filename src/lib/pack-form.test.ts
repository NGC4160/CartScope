import assert from "node:assert/strict";
import test from "node:test";
import {
  applyBulkAgeUnreadable,
  emptyPackCells,
  groupPackBlockers,
  packSaveBlockedReason,
  packSaveBlockers,
  parseBulkPackPaste,
  typedVoltage,
} from "./pack-form.ts";

function sixAt(volts: string) {
  return Array.from({ length: 6 }, () => ({ volts, ir: "", age: "", ageSkip: false }));
}

test("typed 8.50 is a reading; an empty box is not the example hint", () => {
  assert.equal(typedVoltage("8.50"), 8.5);
  assert.equal(typedVoltage(""), undefined);
  assert.equal(typedVoltage("  "), undefined);
});

test("ERIC Excel-style 6-pack lists every IR and age blocker", () => {
  const blockers = packSaveBlockers({
    lithium: false,
    cellCount: 6,
    cells: sixAt("8.50"),
    irSkip: true,
    irSkipReason: "",
    monitorV: "",
    noMonitor: false,
  });
  const fields = blockers.map((b) => b.field);
  assert.ok(fields.includes("IR skip reason"));
  for (let n = 1; n <= 6; n += 1) {
    assert.ok(fields.includes(`Battery ${n} age`), `missing age blocker for battery ${n}`);
    assert.equal(fields.includes(`Battery ${n} resting volts`), false);
  }
});

test("bulk age unreadable plus IR reason lets the 6-pack save", () => {
  const cells = applyBulkAgeUnreadable(sixAt("8.50"), true);
  assert.ok(cells.every((c) => c.ageSkip));
  const blockers = packSaveBlockers({
    lithium: false,
    cellCount: 6,
    cells,
    irSkip: true,
    irSkipReason: "IR meter not on the truck",
    monitorV: "",
    noMonitor: false,
  });
  assert.deepEqual(blockers, []);
});

test("empty voltages are named even when the shop example is 8.49", () => {
  const blockers = packSaveBlockers({
    lithium: false,
    cellCount: 2,
    cells: [
      { volts: "", ir: "4.1", age: "09/2024", ageSkip: false },
      { volts: "8.50", ir: "", age: "", ageSkip: false },
    ],
    irSkip: false,
    irSkipReason: "",
    monitorV: "",
    noMonitor: false,
  });
  const fields = blockers.map((b) => b.field);
  assert.deepEqual(fields, ["Battery 1 resting volts", "Battery 2 internal resistance", "Battery 2 age"]);
  const grouped = groupPackBlockers(blockers);
  assert.deepEqual(
    grouped.map((g) => g.heading),
    ["Battery 1", "Battery 2"],
  );
});

test("paste fills six YDRE-style rows from a voltage list", () => {
  const result = parseBulkPackPaste("8.40, 8.41, 8.38, 8.42, 8.39, 8.40", emptyPackCells(6), 6);
  assert.equal(result.applied, 6);
  assert.deepEqual(
    result.cells.map((c) => c.volts),
    ["8.40", "8.41", "8.38", "8.42", "8.39", "8.40"],
  );
  assert.equal(packSaveBlockers({
    lithium: false,
    cellCount: 6,
    cells: result.cells,
    irSkip: false,
    irSkipReason: "",
    monitorV: "",
    noMonitor: false,
  }).length > 0, true);
});

test("paste accepts one battery per line with volts, IR, and age", () => {
  const pasted = [
    "8.50\t12.1\t09/2024",
    "8.49\t12.0\t09/2024",
    "8.51\t11.8\t10/2023",
    "8.48\t12.2\t09/2024",
    "8.50\t12.4\t08/2024",
    "8.47\t12.1\t09/2024",
  ].join("\n");
  const result = parseBulkPackPaste(pasted, emptyPackCells(6), 6);
  assert.equal(result.applied, 6);
  assert.equal(result.cells[2]?.ir, "11.8");
  assert.equal(result.cells[2]?.age, "10/2023");
  assert.deepEqual(
    packSaveBlockers({
      lithium: false,
      cellCount: 6,
      cells: result.cells,
      irSkip: false,
      irSkipReason: "",
      monitorV: "",
      noMonitor: false,
    }),
    [],
  );
});

test("paste reads an IR unit suffix and keeps the typed number", () => {
  const result = parseBulkPackPaste("8.50\t12.1 mΩ\t09/2024", emptyPackCells(1), 1);
  assert.equal(result.applied, 1);
  assert.equal(result.cells[0]?.ir, "12.1");
  assert.equal(result.cells[0]?.irUnit, "mohm");
  const mega = parseBulkPackPaste("8.50\t0.5 MΩ\t09/2024", emptyPackCells(1), 1);
  assert.equal(mega.cells[0]?.ir, "0.5");
  assert.equal(mega.cells[0]?.irUnit, "megohm");
});

test("empty pack sticky reason names resting volts and age", () => {
  const blockers = packSaveBlockers({
    lithium: false,
    cellCount: 6,
    cells: emptyPackCells(6),
    irSkip: false,
    irSkipReason: "",
    monitorV: "",
    noMonitor: false,
  });
  const reason = packSaveBlockedReason(blockers);
  assert.match(reason, /resting volts/i);
  assert.match(reason, /age/i);
  assert.match(reason, /Battery 1 resting volts/);
});

test("short-load is optional and never a pack Save blocker", () => {
  const cells = Array.from({ length: 6 }, () => ({
    volts: "8.50",
    ir: "12.1",
    age: "09/2024",
    ageSkip: false,
  }));
  const blockers = packSaveBlockers({
    lithium: false,
    cellCount: 6,
    cells,
    irSkip: false,
    irSkipReason: "",
    monitorV: "",
    noMonitor: false,
  });
  assert.deepEqual(blockers, []);
  assert.equal(
    blockers.some((b) => /short load|load drop/i.test(b.field) || /short load|load drop/i.test(b.message)),
    false,
  );
});

test("shop-range volts with missing IR and age still name those fields", () => {
  const blockers = packSaveBlockers({
    lithium: false,
    cellCount: 6,
    cells: sixAt("8.50"),
    irSkip: false,
    irSkipReason: "",
    monitorV: "",
    noMonitor: false,
  });
  const reason = packSaveBlockedReason(blockers);
  assert.match(reason, /internal resistance/i);
  assert.match(reason, /age/i);
  assert.doesNotMatch(reason, /short load|load drop/i);
});

test("paste of eight values onto a six-battery pack keeps the first six", () => {
  const result = parseBulkPackPaste("8.1 8.2 8.3 8.4 8.5 8.6 8.7 8.8", emptyPackCells(6), 6);
  assert.equal(result.applied, 6);
  assert.equal(result.extraIgnored, 2);
  assert.equal(result.cells[5]?.volts, "8.6");
});
