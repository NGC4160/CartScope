import assert from "node:assert/strict";
import test from "node:test";
import { statusLabel } from "./case-flow.ts";
import type { JobRecord } from "../data/types.ts";

function job(patch: Partial<JobRecord>): JobRecord {
  return {
    id: "job_1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    technician: "Hayden",
    serialNumber: "",
    notes: "",
    modelId: "club-car-precedent-iq",
    symptomId: "no-operation",
    currentStepId: "pno-setup",
    status: "in-progress",
    log: [],
    lastName: "Lee",
    hcpJobNumber: "1",
    cartYear: "2008",
    cartMake: "Club Car",
    cartModel: "Precedent IQ",
    complaintNote: "",
    fuelNote: "",
    ...patch,
  } as JobRecord;
}

test("report phase is Ready to review, not Still working", () => {
  assert.equal(statusLabel(job({ casePhase: "report" })), "Ready to review");
  assert.equal(statusLabel(job({ status: "diagnosed" })), "Ready to review");
  assert.equal(statusLabel(job({ reportConfirmed: true })), "Complete");
  assert.equal(statusLabel(job({ casePhase: "steps", status: "in-progress" })), "Still working");
});
