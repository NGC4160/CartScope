import assert from "node:assert/strict";
import test from "node:test";
import type { JobRecord } from "../data/types.ts";
import { applyJumpToStep } from "./jump-step.ts";

function job(patch: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job_1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    technician: "Ryan",
    serialNumber: "IQ1",
    notes: "",
    modelId: "club-car-ds-iq",
    symptomId: "no-operation",
    currentStepId: "pno-setup",
    status: "in-progress",
    log: [],
    lastName: "Bayux",
    hcpJobNumber: "HCP-1",
    casePhase: "steps",
    meterDraft: { stepId: "pno-setup", raw: "", selected: "yes" },
    packDraft: { cells: [{ volts: "8.4", ir: "3.2", irUnit: "mohm", age: "03/2026", ageSkip: false }] },
    ...patch,
  };
}

test("jump keeps Who checked it and the meter / pack draft", () => {
  const next = applyJumpToStep(job(), "pno-fr", "direction switch stuck", "2026-01-02T00:00:00.000Z");
  assert.equal(next.currentStepId, "pno-fr");
  assert.equal(next.technician, "Ryan");
  assert.deepEqual(next.meterDraft, { stepId: "pno-setup", raw: "", selected: "yes" });
  assert.equal(next.packDraft?.cells[0]?.volts, "8.4");
  assert.equal(next.pathRedirects?.[0]?.toStepId, "pno-fr");
  assert.equal(next.pending, undefined);
});

test("jump out of a report peek returns to steps without wiping the tech name", () => {
  const next = applyJumpToStep(job({ casePhase: "report" }), "pno-fr", "switch path", "2026-01-02T00:00:00.000Z");
  assert.equal(next.casePhase, "steps");
  assert.equal(next.technician, "Ryan");
});

test("jump from Pack check enters the factory step instead of staying on pack", () => {
  const next = applyJumpToStep(
    job({ casePhase: "pack", currentStepId: "pno-setup" }),
    "pno-fr",
    "direction switch from pack",
    "2026-01-02T00:00:00.000Z",
  );
  assert.equal(next.casePhase, "steps");
  assert.equal(next.currentStepId, "pno-fr");
  assert.equal(next.technician, "Ryan");
  assert.equal(next.packDraft?.cells[0]?.volts, "8.4");
  assert.deepEqual(next.meterDraft, { stepId: "pno-setup", raw: "", selected: "yes" });
});

test("jump from handheld codes enters the factory step", () => {
  const next = applyJumpToStep(job({ casePhase: "codes" }), "pno-fr", "solenoid path", "2026-01-02T00:00:00.000Z");
  assert.equal(next.casePhase, "steps");
  assert.equal(next.currentStepId, "pno-fr");
});

test("jump reason from a Helper observation does not become Who checked it", () => {
  const saw = "Checked FE350 setup; no power at starter-generator terminal.";
  const next = applyJumpToStep(
    job({ technician: "Hayden Silva", techObservation: saw }),
    "g-starter",
    saw,
    "2026-01-02T00:00:00.000Z",
  );
  assert.equal(next.technician, "Hayden Silva");
  assert.equal(next.techObservation, saw);
  assert.equal(next.pathRedirects?.[0]?.reason, saw);
});
