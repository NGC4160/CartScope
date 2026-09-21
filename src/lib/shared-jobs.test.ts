import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, afterEach, beforeEach, describe, test } from "node:test";
import type { JobRecord } from "../data/types.ts";
import { handleSharedJobsGet, handleSharedJobsPut } from "./shared-jobs-api.ts";
import { setSharedJobsFilePathForTests, writeSharedJobs } from "./shared-jobs-backend.ts";
import {
  SHARED_JOBS_VERSION,
  parseSharedJobsDocument,
  sanitizeLoadedJob,
  sanitizeLoadedJobs,
  shouldMigrateLocalSnapshot,
  toSharedJobsDocument,
} from "./shared-jobs.ts";

function sampleJob(id = "job_shared_1"): JobRecord {
  return {
    id,
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-21T00:01:00.000Z",
    technician: "Hayden Silva",
    serialNumber: "",
    notes: "",
    modelId: "yamaha-ydre-dc",
    symptomId: "no-operation",
    currentStepId: "yno-split",
    status: "in-progress",
    log: [],
    lastName: "Martinez",
    hcpJobNumber: "HCP-5212",
    cartYear: "2012",
    cartMake: "Yamaha",
    cartModel: "YDRE",
    batteryType: "lead-acid",
    complaintNote: "Dead in the lot",
    fuelNote: "",
    casePhase: "codes",
    techObservation: "Solenoid clicks, no spark at the plug.",
    packCheck: {
      at: "2026-09-21T00:00:30.000Z",
      chemistry: "lead-acid",
      cellCount: 6,
      nominalV: 8,
      layoutSource: "factory-book",
      cells: [],
      verdict: "pass",
      issues: [],
    },
    codeSave: {
      at: "2026-09-21T00:00:45.000Z",
      present: "13",
      history: "",
      photoNote: "",
      couldNotConnect: false,
      cleared: false,
    },
    aiLog: [
      { at: "2026-09-21T00:00:50.000Z", role: "assistant", text: "Saved under What the tech saw." },
    ],
  };
}

describe("shared jobs document", () => {
  test("returns null for non-objects", () => {
    assert.equal(parseSharedJobsDocument(null), null);
    assert.equal(parseSharedJobsDocument("nope"), null);
    assert.equal(parseSharedJobsDocument(12), null);
  });

  test("keeps an empty jobs list instead of inventing cases", () => {
    const parsed = parseSharedJobsDocument({ jobs: [] });
    assert.ok(parsed);
    assert.equal(parsed.jobs.length, 0);
    assert.equal(parsed.version, SHARED_JOBS_VERSION);
  });

  test("stamps version 1 and does not invent HCP fields", () => {
    const doc = toSharedJobsDocument({ jobs: [sampleJob()] });
    assert.equal(doc.version, 1);
    assert.equal("lastHcpSyncAt" in doc, false);
    assert.equal("hcpJobs" in doc, false);
    assert.equal(doc.jobs[0]?.hcpJobNumber, "HCP-5212");
    assert.equal(doc.jobs[0]?.lastName, "Martinez");
  });

  test("sanitize keeps Who checked it, Helper notes, pack, and codes", () => {
    const job = sampleJob();
    const cleaned = sanitizeLoadedJob(job);
    assert.ok(cleaned);
    assert.equal(cleaned.technician, "Hayden Silva");
    assert.equal(cleaned.techObservation, "Solenoid clicks, no spark at the plug.");
    assert.equal(cleaned.aiLog?.[0]?.text, "Saved under What the tech saw.");
    assert.equal(cleaned.packCheck?.verdict, "pass");
    assert.equal(cleaned.codeSave?.present, "13");
    assert.notEqual(cleaned.technician, cleaned.techObservation);
  });

  test("sanitize does not put a Helper observation into Who checked it", () => {
    const saw = "Speed sensor fault";
    const cleaned = sanitizeLoadedJob({
      ...sampleJob(),
      technician: "Ryan",
      techObservation: saw,
      aiLog: [{ at: "2026-09-21T00:00:50.000Z", role: "user", text: saw }],
    });
    assert.ok(cleaned);
    assert.equal(cleaned.technician, "Ryan");
    assert.equal(cleaned.techObservation, saw);
  });

  test("sanitize drops junk entries and duplicate ids", () => {
    const jobs = sanitizeLoadedJobs([
      sampleJob("job_a"),
      { nope: true },
      sampleJob("job_a"),
      sampleJob("job_b"),
    ]);
    assert.deepEqual(
      jobs.map((job) => job.id),
      ["job_a", "job_b"],
    );
  });

  test("only migrates when this tablet already has case files", () => {
    assert.equal(shouldMigrateLocalSnapshot(0), false);
    assert.equal(shouldMigrateLocalSnapshot(2), true);
  });
});

describe("shared jobs API file store", () => {
  const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
  const prevVercel = process.env.VERCEL;
  let dir = "";

  beforeEach(async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
    dir = await mkdtemp(path.join(tmpdir(), "cartscope-shared-"));
    setSharedJobsFilePathForTests(path.join(dir, "cartscope-jobs.json"));
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
  });

  test("GET reports empty when the blob file is missing", async () => {
    const result = await handleSharedJobsGet();
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.empty, true);
    assert.equal(result.body.configured, true);
  });

  test("PUT last-write replaces the shop list", async () => {
    const first = await handleSharedJobsPut({ jobs: [sampleJob("job_a")] });
    assert.equal(first.status, 200);
    assert.equal(first.body.wrote, true);
    const second = await handleSharedJobsPut({ jobs: [sampleJob("job_b")] });
    assert.equal(second.status, 200);
    const read = await handleSharedJobsGet();
    assert.equal(read.body.empty, false);
    assert.deepEqual(
      (read.body.jobs as JobRecord[]).map((job) => job.id),
      ["job_b"],
    );
  });

  test("migrate writes only when the store is empty", async () => {
    const first = await handleSharedJobsPut({ jobs: [sampleJob("job_local")], migrate: true });
    assert.equal(first.body.migrated, true);
    const second = await handleSharedJobsPut({ jobs: [sampleJob("job_other")], migrate: true });
    assert.equal(second.body.migrated, false);
    assert.equal(second.body.wrote, false);
    const read = await handleSharedJobsGet();
    assert.deepEqual(
      (read.body.jobs as JobRecord[]).map((job) => job.id),
      ["job_local"],
    );
  });

  test("unconfigured on Vercel without a blob token keeps localStorage as fallback", async () => {
    process.env.VERCEL = "1";
    const get = await handleSharedJobsGet();
    assert.equal(get.status, 200);
    assert.equal(get.body.configured, false);
    const put = await handleSharedJobsPut({ jobs: [sampleJob()] });
    assert.equal(put.status, 503);
    assert.equal(put.body.configured, false);
    assert.match(String(put.body.error), /BLOB_READ_WRITE_TOKEN/);
  });

  test("file store writes JSON the second browser can read", async () => {
    await writeSharedJobs(toSharedJobsDocument({ jobs: [sampleJob("job_file")] }));
    const raw = await readFile(path.join(dir, "cartscope-jobs.json"), "utf8");
    const parsed = parseSharedJobsDocument(JSON.parse(raw));
    assert.equal(parsed?.jobs[0]?.id, "job_file");
    assert.equal(parsed?.jobs[0]?.technician, "Hayden Silva");
    assert.equal(parsed?.jobs[0]?.techObservation, "Solenoid clicks, no spark at the plug.");
  });
});
