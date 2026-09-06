import assert from "node:assert/strict";
import test from "node:test";
import { formatPackCellLine, irSpreadNote } from "./pack-rules.ts";

test("pack line labels the IR unit that was saved", () => {
  assert.match(
    formatPackCellLine({ index: 0, volts: "8.50", ir: "12.1", irUnit: "mohm" }),
    /IR 12\.1 mΩ/,
  );
  assert.match(
    formatPackCellLine({ index: 1, volts: "8.50", ir: "0.5", irUnit: "megohm" }),
    /IR 0\.5 MΩ/,
  );
  assert.match(
    formatPackCellLine({ index: 2, volts: "8.50", ir: "12.1" }),
    /IR 12\.1 mΩ/,
  );
});

test("IR spread compares mixed units in milliohms and does not treat 4.2 MΩ as 4.2 mΩ", () => {
  const note = irSpreadNote([
    { ir: "4.2", unit: "mohm" },
    { ir: "4.2", unit: "megohm" },
  ]);
  assert.ok(note);
  assert.match(note ?? "", /uneven/i);
});
