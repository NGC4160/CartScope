import assert from "node:assert/strict";
import test from "node:test";
import { isCleanVoltageField, sanitizeVoltageInput } from "./voltage-input.ts";

test("voltage input replaces, never concatenates 8.30 + 8.30", () => {
  assert.equal(sanitizeVoltageInput("8.30"), "8.30");
  assert.equal(sanitizeVoltageInput("8.308.30"), "8.30");
  assert.equal(sanitizeVoltageInput("48.248.2"), "48.2");
});

test("voltage input keeps a single decimal and digits only", () => {
  assert.equal(sanitizeVoltageInput("8,25"), "8.25");
  assert.equal(sanitizeVoltageInput("  7.95 V"), "7.95");
  assert.equal(sanitizeVoltageInput("-0.2"), "-0.2");
  assert.equal(sanitizeVoltageInput(""), "");
});

test("each field stays a clean number after typing", () => {
  assert.equal(isCleanVoltageField("8.30"), true);
  assert.equal(isCleanVoltageField("8.308.30"), false);
  assert.equal(isCleanVoltageField(""), true);
});
