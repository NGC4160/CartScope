import assert from "node:assert/strict";
import test from "node:test";
import { jobHeaderGaps } from "./job-header.ts";
import {
  benchUrl,
  canStartChecks,
  canVisitWizardStep,
  openJobHeader,
  resolveStartJob,
  stepAfterComplaintSelected,
} from "./wizard-nav.ts";

test("complaint selected always opens the job header step", () => {
  assert.equal(openJobHeader(null), null);
  assert.equal(openJobHeader("no-operation"), 4);
  assert.equal(stepAfterComplaintSelected(), 4);
  assert.equal(
    canVisitWizardStep(4, { manufacturer: "club-car", hasModel: true, symptomId: "no-operation" }),
    true,
  );
  assert.equal(
    canVisitWizardStep(4, { manufacturer: "club-car", hasModel: true, symptomId: null }),
    false,
  );
});

test("electric DS IQ no-run: complaint → header → fill → Start reaches bench", () => {
  const symptomId = "no-operation";
  const step = openJobHeader(symptomId) ?? stepAfterComplaintSelected();
  assert.equal(step, 4);

  const empty = jobHeaderGaps({
    lastName: "",
    hcpJobNumber: "",
    powertrain: "electric",
    batteryType: "",
  });
  assert.deepEqual(empty, ["lastName", "hcpJobNumber", "batteryType"]);
  assert.equal(canStartChecks(empty), false);
  assert.equal(
    resolveStartJob({
      hasModel: true,
      symptomId,
      startStepId: "pno-setup",
      lastName: "",
      hcpJobNumber: "",
      powertrain: "electric",
      batteryType: "",
    }).ok,
    false,
  );

  const filled = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "electric",
    batteryType: "lead-acid",
  });
  assert.deepEqual(filled, []);
  assert.equal(canStartChecks(filled), true);

  const started = resolveStartJob({
    hasModel: true,
    symptomId,
    startStepId: "pno-setup",
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "electric",
    batteryType: "lead-acid",
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "pno-setup");
    assert.equal(benchUrl("job_test1"), "/bench/job_test1");
  }
});

test("gas FE290 no-crank: header then Start reaches bench without battery type", () => {
  const symptomId = "no-crank";
  assert.equal(openJobHeader(symptomId), 4);

  const empty = jobHeaderGaps({
    lastName: "",
    hcpJobNumber: "",
    powertrain: "gasoline",
    batteryType: "",
  });
  assert.deepEqual(empty, ["lastName", "hcpJobNumber"]);
  assert.equal(canStartChecks(empty), false);

  const filled = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "gasoline",
    batteryType: "",
  });
  assert.deepEqual(filled, []);
  assert.equal(canStartChecks(filled), true);

  const started = resolveStartJob({
    hasModel: true,
    symptomId,
    startStepId: "g-setup",
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "gasoline",
    batteryType: "",
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "g-setup");
    assert.equal(benchUrl("job_fe290"), "/bench/job_fe290");
  }
});
