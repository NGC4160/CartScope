import assert from "node:assert/strict";
import test from "node:test";
import { closedOpen, obs, yesNo } from "../data/helpers.ts";
import {
  buildAttempt,
  needsUnusualVerify,
  resultFromAttempt,
  unusualVerifyBanner,
} from "./diagnostics.ts";
import { saveAndContinueMeasurement } from "./meter-input.ts";

/** Same spark check the EZ-GO TXT gas pack builds (`g-spark`). */
const txtGasSpark = obs(
  "g-spark",
  "Spark at the plug",
  "You need a blue-white spark.",
  "Factory book: EZ-GO TXT gasoline — Ignition / spark",
  ["ign"],
  "Is there a strong spark at the plug while cranking?",
  "Spark tester grounded to the head.",
  "Blue-white spark",
  yesNo("Strong spark", "No spark / weak orange spark"),
  { kind: "step", id: "g-fuel" },
  { kind: "diagnosis", id: "gdx-ignition" },
);

test("TXT gas spark: no/weak spark is a saveable fail, not a bad meter number", () => {
  const no = txtGasSpark.measurement.options?.find((o) => o.id === "no");
  assert.equal(no?.label, "No spark / weak orange spark");
  assert.equal(no?.result, "fail");
  assert.notEqual(no?.unusual, true);

  const attempt = buildAttempt(txtGasSpark.measurement, "", 1, "no");
  assert.equal(attempt.inRange, false);
  assert.equal(attempt.unusual, false);
  assert.equal(needsUnusualVerify(txtGasSpark.measurement, attempt, 1), false);
  assert.deepEqual(resultFromAttempt(txtGasSpark.measurement, attempt), { result: "fail" });

  const saved = saveAndContinueMeasurement(txtGasSpark, "", "no");
  assert.equal(saved.ok, true);
  if (saved.ok) {
    assert.equal(saved.verifyAgain, false);
    assert.equal(saved.result, "fail");
    assert.deepEqual(saved.next, { kind: "diagnosis", id: "gdx-ignition" });
    assert.match(saved.raw, /No spark \/ weak orange spark/);
  }
});

test("TXT gas spark: strong spark still passes through to fuel", () => {
  const saved = saveAndContinueMeasurement(txtGasSpark, "", "yes");
  assert.equal(saved.ok, true);
  if (saved.ok) {
    assert.equal(saved.verifyAgain, false);
    assert.equal(saved.result, "pass");
    assert.deepEqual(saved.next, { kind: "step", id: "g-fuel" });
  }
});

test("choice fail findings (fuel, continuity) save on the first tap", () => {
  const fuel = obs(
    "g-fuel",
    "Fuel at the carb",
    "Check fuel.",
    "Factory book",
    [],
    "Is fresh fuel reaching the carb?",
    "Look at the bowl.",
    "Fuel is there and fresh",
    yesNo("Fuel path is good — keep going", "No fuel / old / flooded"),
    { kind: "step", id: "g-comp" },
    { kind: "diagnosis", id: "gdx-fuel" },
  );
  const fuelFail = saveAndContinueMeasurement(fuel, "", "no");
  assert.equal(fuelFail.ok, true);
  if (fuelFail.ok) {
    assert.equal(fuelFail.verifyAgain, false);
    assert.equal(fuelFail.result, "fail");
  }

  const spec = {
    kind: "continuity" as const,
    prompt: "Coil path",
    meterSetup: "Beep the path.",
    expectedLabel: "Connected (good)",
    options: closedOpen(),
  };
  const open = buildAttempt(spec, "", 1, "open");
  assert.equal(open.unusual, false);
  assert.equal(needsUnusualVerify(spec, open, 1), false);
  assert.deepEqual(resultFromAttempt(spec, open), { result: "fail" });
});

test("meter numbers outside the book range still ask for a second check", () => {
  const spec = {
    kind: "voltage" as const,
    prompt: "Sitting volts",
    meterSetup: "DC volts.",
    unit: "V",
    expectedLabel: "12.4–12.8 V sitting",
    expectedMin: 12.4,
    expectedMax: 13.2,
  };
  const low = buildAttempt(spec, "11.80", 1);
  assert.equal(low.unusual, true);
  assert.equal(needsUnusualVerify(spec, low, 1), true);
  assert.equal(needsUnusualVerify(spec, low, 3), false);
});

test("verify banner names expected vs selected for spark and meter conflicts", () => {
  const sparkCopy = unusualVerifyBanner(
    txtGasSpark.measurement,
    { raw: "No spark / weak orange spark", optionId: "no" },
    1,
  );
  assert.match(sparkCopy.title, /Blue-white spark/);
  assert.doesNotMatch(sparkCopy.title, /That number looks wrong/);
  assert.match(sparkCopy.body, /Blue-white spark/);
  assert.match(sparkCopy.body, /No spark \/ weak orange spark/);
  assert.match(sparkCopy.body, /fail finding/);

  const meterCopy = unusualVerifyBanner(
    {
      kind: "voltage",
      prompt: "Sitting volts",
      meterSetup: "DC volts.",
      unit: "V",
      expectedLabel: "12.4–12.8 V sitting",
      expectedMin: 12.4,
      expectedMax: 13.2,
    },
    { raw: "11.80" },
    1,
  );
  assert.match(meterCopy.title, /12\.4–12\.8 V sitting/);
  assert.doesNotMatch(meterCopy.title, /That number looks wrong/);
  assert.match(meterCopy.body, /11\.80 V/);
  assert.match(meterCopy.body, /12\.4–12\.8 V sitting/);
});

test("yesNo fail options are not marked unusual by default", () => {
  const [pass, fail] = yesNo("Strong spark", "No spark / weak orange spark");
  assert.equal(pass?.result, "pass");
  assert.equal(fail?.result, "fail");
  assert.notEqual(fail?.unusual, true);
});
