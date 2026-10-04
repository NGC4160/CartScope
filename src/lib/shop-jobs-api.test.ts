import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, afterEach, beforeEach, describe, test } from "node:test";
import type { JobRecord } from "../data/types.ts";
import { SHOP_GATE_COOKIE, SHOP_GATE_SECRET_ENV, signShopSession } from "./shop-gate.ts";
import { gatedSharedJobsGet, gatedSharedJobsPut } from "./shop-jobs-api.ts";
import { handleSharedJobsPut } from "./shared-jobs-api.ts";
import { setSharedJobsFilePathForTests } from "./shared-jobs-backend.ts";

function sampleJob(id = "job_lock_1"): JobRecord {
  return {
    id,
    createdAt: "2026-10-04T00:00:00.000Z",
    updatedAt: "2026-10-04T00:01:00.000Z",
    technician: "Hayden Silva",
    serialNumber: "",
    notes: "",
    modelId: "club-car-precedent-iq",
    symptomId: "no-operation",
    currentStepId: "setup",
    status: "in-progress",
    log: [],
    lastName: "SmokeTest",
    hcpJobNumber: "HCP-9999",
    cartYear: "2007",
    cartMake: "Club Car",
    cartModel: "Precedent IQ",
    batteryType: "lead-acid",
    complaintNote: "",
    fuelNote: "",
    casePhase: "pack",
  };
}

const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
const prevVercel = process.env.VERCEL;
const prevSecret = process.env[SHOP_GATE_SECRET_ENV];

describe("gated shared jobs API", () => {
  let dir = "";

  beforeEach(async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
    process.env[SHOP_GATE_SECRET_ENV] = "unit-test-shop-secret";
    dir = await mkdtemp(path.join(tmpdir(), "cartscope-gate-"));
    setSharedJobsFilePathForTests(path.join(dir, "cartscope-jobs.json"));
    await handleSharedJobsPut({ jobs: [sampleJob()] });
  });

  afterEach(async () => {
    setSharedJobsFilePathForTests(null);
    await rm(dir, { recursive: true, force: true });
  });

  after(() => {
    if (prevToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = prevToken;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    if (prevSecret === undefined) delete process.env[SHOP_GATE_SECRET_ENV];
    else process.env[SHOP_GATE_SECRET_ENV] = prevSecret;
  });

  test("unauthenticated GET cannot read customer names", async () => {
    const result = await gatedSharedJobsGet(new Request("http://shop.test/api/jobs"));
    assert.equal(result.status, 401);
    assert.equal(result.body.ok, false);
    assert.equal("jobs" in result.body, false);
    assert.doesNotMatch(JSON.stringify(result.body), /SmokeTest|HCP-9999|lastName/);
  });

  test("unauthenticated PUT cannot overwrite the job list", async () => {
    const result = await gatedSharedJobsPut(new Request("http://shop.test/api/jobs", { method: "PUT" }), {
      jobs: [],
    });
    assert.equal(result.status, 401);
    const token = signShopSession();
    const read = await gatedSharedJobsGet(
      new Request("http://shop.test/api/jobs", {
        headers: { cookie: `${SHOP_GATE_COOKIE}=${token}` },
      }),
    );
    assert.equal(read.status, 200);
    assert.equal((read.body.jobs as JobRecord[])[0]?.lastName, "SmokeTest");
  });

  test("unlocked GET returns the shop list", async () => {
    const token = signShopSession();
    const result = await gatedSharedJobsGet(
      new Request("http://shop.test/api/jobs", {
        headers: { cookie: `${SHOP_GATE_COOKIE}=${token}` },
      }),
    );
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal((result.body.jobs as JobRecord[])[0]?.hcpJobNumber, "HCP-9999");
  });
});
