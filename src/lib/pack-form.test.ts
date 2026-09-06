import assert from "node:assert/strict";
import test from "node:test";
import { applyBulkAgeUnreadable, packSaveBlockers, typedVoltage } from "./pack-form.ts";

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
});
