import assert from "node:assert/strict";
import test from "node:test";
import type { DiagnosticStep } from "../data/types.ts";
import {
  commitMeterReading,
  meterExampleHint,
  meterPlaceholderText,
  resolveObservationPick,
  sanitizeMeterInput,
  saveAndContinueMeasurement,
  savedContinueNote,
} from "./meter-input.ts";

/** Club Car DS / Villager FE290 first meter check — 12 V battery, sitting. */
const fe290BatterySitting: Pick<DiagnosticStep, "measurement" | "pass" | "fail" | "branches"> = {
  measurement: {
    kind: "voltage",
    prompt: "12 V battery, key off",
    meterSetup: "DC volts on the battery posts.",
    unit: "V",
    expectedLabel: "12.4–12.8 V sitting",
    expectedMin: 12.4,
    expectedMax: 13.2,
    placeholder: "12.62",
  },
  pass: { kind: "step", id: "g-fuse" },
  fail: { kind: "diagnosis", id: "gdx-battery" },
};

test("placeholder 12.62 is a hint, not a typed value", () => {
  assert.equal(meterPlaceholderText(), "Type the number from your meter");
  assert.equal(meterExampleHint("12.62", "V"), "Example: 12.62 V");
  assert.equal(commitMeterReading("", { kind: "voltage" }).ok, false);
  const empty = saveAndContinueMeasurement(fe290BatterySitting, "");
  assert.equal(empty.ok, false);
  if (!empty.ok) {
    assert.deepEqual(empty.missingFields, ["Your number"]);
    assert.match(empty.message, /empty/i);
  }
});

test("save-continue accepts a typed decimal like 12.62 and advances FE290 first measurement", () => {
  const commit = commitMeterReading("12.62", { kind: "voltage" });
  assert.equal(commit.ok, true);
  if (commit.ok) {
    assert.equal(commit.raw, "12.62");
    assert.equal(commit.numeric, 12.62);
  }

  const saved = saveAndContinueMeasurement(fe290BatterySitting, "12.62");
  assert.equal(saved.ok, true);
  if (saved.ok) {
    assert.equal(saved.raw, "12.62");
    assert.equal(saved.numeric, 12.62);
    assert.equal(saved.verifyAgain, false);
    assert.equal(saved.result, "pass");
    assert.deepEqual(saved.next, { kind: "step", id: "g-fuse" });
    assert.match(savedContinueNote("12.62", fe290BatterySitting.measurement, saved, "Main fuse"), /Saved 12\.62 V/);
    assert.match(savedContinueNote("12.62", fe290BatterySitting.measurement, saved, "Main fuse"), /Main fuse/);
  }
});

test("save-continue parses comma decimals and units without concatenating", () => {
  assert.equal(sanitizeMeterInput("12,62", "voltage"), "12.62");
  assert.equal(sanitizeMeterInput("12.62 V", "voltage"), "12.62");
  assert.equal(sanitizeMeterInput("12.6212.62", "voltage"), "12.62");

  const comma = saveAndContinueMeasurement(fe290BatterySitting, "12,62");
  assert.equal(comma.ok, true);
  if (comma.ok) {
    assert.equal(comma.raw, "12.62");
    assert.deepEqual(comma.next, { kind: "step", id: "g-fuse" });
  }

  const withUnit = saveAndContinueMeasurement(fe290BatterySitting, "  12.62 V ");
  assert.equal(withUnit.ok, true);
  if (withUnit.ok) assert.equal(withUnit.raw, "12.62");
});

test("out-of-range first reading asks for a second check instead of stranding", () => {
  const low = saveAndContinueMeasurement(fe290BatterySitting, "11.80");
  assert.equal(low.ok, true);
  if (low.ok) {
    assert.equal(low.verifyAgain, true);
    assert.equal(low.unusual, true);
    assert.match(
      savedContinueNote("11.80", fe290BatterySitting.measurement, low),
      /Measure the same place again/,
    );
  }
});

test("resistance OL commits and a missing observation names the field", () => {
  const ol = commitMeterReading("ol", { kind: "resistance" });
  assert.equal(ol.ok, true);
  if (ol.ok) assert.equal(ol.raw, "OL");

  const obs: Pick<DiagnosticStep, "measurement" | "pass" | "fail"> = {
    measurement: {
      kind: "observation",
      prompt: "Setup is right",
      meterSetup: "Look with your eyes.",
      expectedLabel: "Setup is right",
      options: [
        { id: "yes", label: "Setup is right — keep going", result: "pass" },
        { id: "no", label: "A switch or cable is wrong", result: "fail" },
      ],
    },
    pass: { kind: "step", id: "g-bat" },
    fail: { kind: "diagnosis", id: "gdx-setup" },
  };
  const missing = saveAndContinueMeasurement(obs, "");
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.deepEqual(missing.missingFields, ["What you saw"]);
    assert.match(missing.message, /Setup is right — keep going/);
    assert.match(missing.message, /A switch or cable is wrong/);
    assert.match(missing.message, /Save is waiting/);
  }

  const picked = saveAndContinueMeasurement(obs, "", "yes");
  assert.equal(picked.ok, true);
  if (picked.ok) assert.deepEqual(picked.next, { kind: "step", id: "g-bat" });

  const failPick = saveAndContinueMeasurement(obs, "", "no");
  assert.equal(failPick.ok, true);
  if (failPick.ok) {
    assert.equal(failPick.verifyAgain, false);
    assert.equal(failPick.result, "fail");
    assert.deepEqual(failPick.next, { kind: "diagnosis", id: "gdx-setup" });
  }

  assert.equal(resolveObservationPick({ live: null, state: null, draft: "yes", pressed: null }), "yes");
  assert.equal(resolveObservationPick({ live: null, state: null, draft: null, pressed: "no" }), "no");
  assert.equal(resolveObservationPick({ live: "yes", state: null, draft: "no", pressed: null }), "yes");
  assert.equal(resolveObservationPick({ live: "", state: "", draft: null, pressed: null }), null);
});
