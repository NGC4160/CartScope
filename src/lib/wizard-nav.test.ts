import assert from "node:assert/strict";
import test from "node:test";
import { jobHeaderGaps } from "./job-header.ts";
import {
  benchPathHasJob,
  benchUrl,
  canStartChecks,
  canVisitWizardStep,
  openJobHeader,
  resolveStartJob,
  stepAfterComplaintSelected,
  wizardStaysOpen,
} from "./wizard-nav.ts";

test("wizard stays mounted after the first job is created so Start can navigate", () => {
  assert.equal(wizardStaysOpen({ jobCount: 0, fresh: false, holdOpen: false }), true);
  assert.equal(wizardStaysOpen({ jobCount: 1, fresh: false, holdOpen: false }), false);
  assert.equal(wizardStaysOpen({ jobCount: 1, fresh: false, holdOpen: true }), true);
  assert.equal(wizardStaysOpen({ jobCount: 1, fresh: true, holdOpen: false }), true);
});

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
    technician: "",
  });
  assert.deepEqual(empty, ["lastName", "hcpJobNumber", "batteryType", "technician"]);
  assert.equal(canStartChecks(empty), false);
  assert.equal(
    resolveStartJob({
      hasModel: true,
      symptomId,
      startStepId: "pno-setup",
      gaps: empty,
    }).ok,
    false,
  );

  const filled = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "electric",
    batteryType: "lead-acid",
    technician: "Alex",
  });
  assert.deepEqual(filled, []);
  assert.equal(canStartChecks(filled), true);

  const started = resolveStartJob({
    hasModel: true,
    symptomId,
    startStepId: "pno-setup",
    gaps: filled,
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
    technician: "",
  });
  assert.deepEqual(empty, ["lastName", "hcpJobNumber", "technician"]);
  assert.equal(canStartChecks(empty), false);

  const filled = jobHeaderGaps({
    lastName: "Smith",
    hcpJobNumber: "17411",
    powertrain: "gasoline",
    batteryType: "",
    technician: "Alex",
  });
  assert.deepEqual(filled, []);
  assert.equal(canStartChecks(filled), true);

  const started = resolveStartJob({
    hasModel: true,
    symptomId,
    startStepId: "g-setup",
    gaps: filled,
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "g-setup");
    assert.equal(benchUrl("job_fe290"), "/bench/job_fe290");
  }
});

test("bench path helper recognizes the Check 1 URL after Start", () => {
  assert.equal(benchPathHasJob("/bench/job_abc", "job_abc"), true);
  assert.equal(benchPathHasJob("/bench/job_abc/extra", "job_abc"), true);
  assert.equal(benchPathHasJob("/", "job_abc"), false);
  assert.equal(benchPathHasJob("/bench/other", "job_abc"), false);
});
