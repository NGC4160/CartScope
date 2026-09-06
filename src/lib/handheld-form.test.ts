import assert from "node:assert/strict";
import test from "node:test";
import { handheldSaveBlockers } from "./handheld-form.ts";

test("handheld save names each missing field instead of going silent", () => {
  const blockers = handheldSaveBlockers({
    noConnect: false,
    connectReason: "",
    programFile: "",
    present: "",
    history: "",
    loggerNotUsed: false,
    logFile: "",
    noReadings: false,
    odometer: "",
    faultOdo: "",
    counterNotes: "",
    hasCounter: false,
  });
  const fields = blockers.map((b) => b.field);
  assert.ok(fields.includes("Program file name"));
  assert.ok(fields.includes("Present codes"));
  assert.ok(fields.includes("History codes"));
  assert.ok(fields.includes("Log file name"));
  assert.ok(fields.includes("Fault counters / odometer"));
});

test("could-not-connect only requires a short reason", () => {
  const blocked = handheldSaveBlockers({
    noConnect: true,
    connectReason: "no",
    programFile: "",
    present: "",
    history: "",
    loggerNotUsed: true,
    logFile: "",
    noReadings: true,
    odometer: "",
    faultOdo: "",
    counterNotes: "",
    hasCounter: false,
  });
  assert.equal(blocked[0]?.field, "Could not connect reason");

  const ready = handheldSaveBlockers({
    noConnect: true,
    connectReason: "Port rusted shut",
    programFile: "",
    present: "",
    history: "",
    loggerNotUsed: true,
    logFile: "",
    noReadings: true,
    odometer: "",
    faultOdo: "",
    counterNotes: "",
    hasCounter: false,
  });
  assert.deepEqual(ready, []);
});
