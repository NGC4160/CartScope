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
