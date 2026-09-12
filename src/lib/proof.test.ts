import assert from "node:assert/strict";
import test from "node:test";
import { getPack } from "../data/index.ts";
import type { JobRecord } from "../data/types.ts";
import { evaluateProof } from "./proof.ts";

function job(partial: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job_proof",
    createdAt: "2026-09-12T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
    technician: "Hayden",
    serialNumber: "",
    notes: "",
    modelId: "yamaha-ydre-dc",
    symptomId: "no-operation",
    currentStepId: "yno-split",
    status: "in-progress",
    log: [],
    lastName: "Alvarez",
    hcpJobNumber: "880411",
    ...partial,
  };
}

test("no diagnosis and no pack proof does not recommend parts", () => {
  const pack = getPack("yamaha-ydre-dc");
  assert.ok(pack);
  const proof = evaluateProof(job(), pack);
  assert.equal(proof.enoughProof, false);
  assert.equal(proof.provenCause, null);
  assert.equal(proof.recommendedRepair, null);
  assert.equal(proof.mayShowParts, false);
});

test("a controller diagnosis without saved meters does not unlock parts", () => {
  const pack = getPack("yamaha-ydre-dc");
  assert.ok(pack);
  const proof = evaluateProof(job({ diagnosisId: "ydx-controller", status: "diagnosed" }), pack);
  assert.equal(proof.enoughProof, false);
  assert.equal(proof.mayShowParts, false);
  assert.equal(proof.recommendedRepair, null);
  assert.equal(proof.provenCause, null);
});

test("a failed pack blocks controller parts even if a controller diagnosis is set", () => {
  const pack = getPack("yamaha-ydre-dc");
  assert.ok(pack);
  const proof = evaluateProof(
    job({
      batteryType: "lead-acid",
      diagnosisId: "ydx-controller",
      packCheck: {
        at: "2026-09-12T00:00:00.000Z",
        chemistry: "lead-acid",
        cellCount: 6,
        nominalV: 8,
        cells: [{ index: 0, volts: "6.10" }],
        verdict: "fail",
        issues: ["Pack too low"],
      },
    }),
    pack,
  );
  assert.equal(proof.packStatus, "fail");
  assert.equal(proof.mayBlameController, false);
  assert.equal(proof.mayShowParts, false);
  assert.match(proof.conflicts.join(" "), /Do not blame the controller/);
  assert.equal(proof.recommendedRepair, null);
});
