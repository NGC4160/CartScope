import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_IR_UNIT,
  formatIrReading,
  irToMilliohms,
  irUnitName,
  irUnitSymbol,
  parseIrReading,
  parseIrUnitToken,
  resolveIrUnit,
} from "./ir-unit.ts";

test("shop default for pack IR is milliohms", () => {
  assert.equal(DEFAULT_IR_UNIT, "mohm");
  assert.equal(resolveIrUnit(undefined), "mohm");
  assert.equal(resolveIrUnit("nope"), "mohm");
  assert.equal(irUnitSymbol("mohm"), "mΩ");
  assert.equal(irUnitName("mohm"), "milliohms");
  assert.equal(irUnitSymbol("megohm"), "MΩ");
  assert.equal(irUnitName("megohm"), "megaohms");
});

test("parse pasted or typed IR keeps the number and reads the unit", () => {
  assert.deepEqual(parseIrReading("12.1"), { value: "12.1", unit: undefined });
  assert.deepEqual(parseIrReading("12.1 mΩ"), { value: "12.1", unit: "mohm" });
  assert.deepEqual(parseIrReading("12.1 mOhm"), { value: "12.1", unit: "mohm" });
  assert.deepEqual(parseIrReading("0.5 MΩ"), { value: "0.5", unit: "megohm" });
  assert.deepEqual(parseIrReading("2 megaohms"), { value: "2", unit: "megohm" });
  assert.equal(parseIrUnitToken("milliohms"), "mohm");
  assert.equal(parseIrUnitToken("megaohms"), "megohm");
});

test("switching unit does not convert the stored number", () => {
  assert.equal(formatIrReading("4.2", "mohm"), "IR 4.2 mΩ");
  assert.equal(formatIrReading("4.2", "megohm"), "IR 4.2 MΩ");
  assert.equal(formatIrReading("4.2 mΩ", "megohm"), "IR 4.2 mΩ");
  assert.equal(formatIrReading("", "mohm"), "IR —");
  assert.equal(formatIrReading("4.2", "mohm", true), "IR not measured");
});

test("spread math converts megaohms to milliohms so mixed units are not compared raw", () => {
  assert.equal(irToMilliohms("4.2", "mohm"), 4.2);
  assert.equal(irToMilliohms("0.004", "megohm"), 4_000_000);
});
