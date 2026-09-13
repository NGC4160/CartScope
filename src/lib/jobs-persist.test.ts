import assert from "node:assert/strict";
import test from "node:test";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { JobRecord, PackCheckRecord, PackDraft } from "../data/types.ts";
import { packLayoutStampLines } from "./pack-layout.ts";
import {
  JOBS_STORAGE_KEY,
  getJobStorage,
  jobOnThisTablet,
  jobsFromPersistedState,
  mergeJobState,
  parsePersistedJobs,
  partializeJobState,
  persistJobsPayload,
  snapshotJobs,
} from "./jobs-persist.ts";

function fieldModifiedDraft(): PackDraft {
  return {
    cells: Array.from({ length: 4 }, () => ({
      volts: "12.80",
      ir: "8",
      irUnit: "mohm" as const,
      age: "03/2024",
      ageSkip: false,
    })),
    layoutSource: "field-modified",
    asFoundCount: "4",
    asFoundCellV: "12",
    paste: "12.80\t8\t03/2024\n12.80\t8\t03/2024\n12.80\t8\t03/2024\n12.80\t8\t03/2024",
  };
}

function fieldModifiedPackCheck(): PackCheckRecord {
  return {
    at: "2026-09-13T00:00:00.000Z",
    chemistry: "lead-acid",
    cellCount: 4,
    nominalV: 12,
    layoutSource: "field-modified",
    factoryCellCount: 6,
    factoryNominalV: 8,
    asFoundCellCount: 4,
    asFoundNominalV: 12,
    cells: Array.from({ length: 4 }, (_, index) => ({
      index,
      volts: "12.80",
      ir: "8",
      irUnit: "mohm" as const,
      ageMonthYear: "03/2024",
    })),
    verdict: "pass",
    issues: [],
  };
}

function fieldModifiedJob(id = "job_fieldmod"): JobRecord {
  return {
    id,
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:01:00.000Z",
    technician: "Hayden Silva",
    serialNumber: "",
    notes: "",
    modelId: "yamaha-ydre-dc",
    symptomId: "no-operation",
    currentStepId: "yno-split",
    status: "in-progress",
    log: [],
    lastName: "Fieldmod",
    hcpJobNumber: "HCP-5212",
    cartYear: "2012",
    cartMake: "Yamaha",
    cartModel: "YDRE",
    batteryType: "lead-acid",
    complaintNote: "",
    fuelNote: "",
    casePhase: "codes",
    packCheck: fieldModifiedPackCheck(),
    packDraft: fieldModifiedDraft(),
  };
}

test("field-modified packCheck and packDraft survive persist JSON round-trip", () => {
  const job = fieldModifiedJob();
  const raw = persistJobsPayload([job]);
  assert.match(raw, /"version":0/);
  assert.equal(JOBS_STORAGE_KEY, "cartscope-jobs-v1");
  const jobs = parsePersistedJobs(raw);
  assert.ok(jobs);
  const found = jobOnThisTablet(jobs, job.id);
  assert.ok(found, "hydrated jobs must still have this id");
  assert.equal(found.modelId, "yamaha-ydre-dc");
  assert.equal(found.packCheck?.layoutSource, "field-modified");
  assert.equal(found.packCheck?.factoryCellCount, 6);
  assert.equal(found.packCheck?.factoryNominalV, 8);
  assert.equal(found.packCheck?.asFoundCellCount, 4);
  assert.equal(found.packCheck?.asFoundNominalV, 12);
  assert.equal(found.packCheck?.cells.length, 4);
  assert.equal(found.packCheck?.cells[0]?.volts, "12.80");
  assert.equal(found.packDraft?.layoutSource, "field-modified");
  assert.equal(found.packDraft?.asFoundCount, "4");
  assert.equal(found.packDraft?.asFoundCellV, "12");
  assert.equal(found.packDraft?.cells.length, 4);
  assert.deepEqual(packLayoutStampLines(found.packCheck!), [
    "Factory book layout: 6 × 8 V",
    "Field-modified as-found: 4 × 12 V (48 V pack)",
  ]);
});

test("partialize snapshots only jobs so action functions never enter storage", () => {
  const job = fieldModifiedJob();
  const partial = partializeJobState({
    jobs: [job],
    createJob: () => job,
  });
  assert.deepEqual(Object.keys(partial), ["jobs"]);
  assert.equal(partial.jobs[0]?.id, job.id);
  assert.equal(partial.jobs[0]?.packCheck?.asFoundCellCount, 4);
  const json = JSON.stringify(partial);
  assert.doesNotMatch(json, /createJob/);
});

test("merge keeps current jobs when persist payload is empty or malformed", () => {
  const current = { jobs: [fieldModifiedJob()], save: () => {} };
  assert.equal(mergeJobState(undefined, current).jobs[0]?.id, "job_fieldmod");
  assert.equal(mergeJobState({ nope: true }, current).jobs[0]?.id, "job_fieldmod");
  const restored = mergeJobState({ jobs: [fieldModifiedJob("job_reloaded")] }, { jobs: [] });
  assert.equal(jobOnThisTablet(restored.jobs, "job_reloaded")?.packDraft?.asFoundCount, "4");
});

test("snapshotJobs strips non-JSON values without dropping the job", () => {
  const job = fieldModifiedJob();
  const asJob = snapshotJobs([
    { ...job, extra: undefined, nest: { ok: 1, skip: undefined } } as JobRecord,
  ]);
  assert.equal(asJob[0]?.id, job.id);
  assert.equal(asJob[0]?.packCheck?.cells.length, 4);
  assert.equal("extra" in (asJob[0] as object), false);
});

test("jobsFromPersistedState rejects a non-array jobs field", () => {
  assert.equal(jobsFromPersistedState({ jobs: { id: "job_x" } }), undefined);
  assert.equal(jobsFromPersistedState(null), undefined);
  assert.equal(parsePersistedJobs("not-json"), undefined);
  assert.equal(parsePersistedJobs(""), undefined);
});

test("skipHydration persist rehydrate keeps a field-modified job by id", async () => {
  const mem = new Map<string, string>();
  const storage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, String(v));
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "window", { value: { localStorage: storage }, configurable: true });

  type Mini = { jobs: JobRecord[]; save: (job: JobRecord) => void };
  const useMini = create<Mini>()(
    persist(
      (set, get) => ({
        jobs: [],
        save: (job) => set({ jobs: [job, ...get().jobs] }),
      }),
      {
        name: JOBS_STORAGE_KEY,
        storage: createJSONStorage(() => getJobStorage()),
        partialize: partializeJobState,
        merge: mergeJobState,
        skipHydration: true,
      },
    ),
  );

  const job = fieldModifiedJob();
  useMini.getState().save(job);
  const raw = storage.getItem(JOBS_STORAGE_KEY);
  const persisted = parsePersistedJobs(raw);
  assert.ok(jobOnThisTablet(persisted ?? [], job.id));

  useMini.setState({ jobs: [] });
  assert.ok(raw);
  storage.setItem(JOBS_STORAGE_KEY, raw);
  await useMini.persist.rehydrate();
  const after = jobOnThisTablet(useMini.getState().jobs, job.id);
  assert.ok(after, "rehydrate must restore the field-modified job");
  assert.equal(after.packCheck?.asFoundCellCount, 4);
  assert.equal(after.packDraft?.asFoundCellV, "12");
  assert.equal(after.packCheck?.cells.length, 4);
  assert.deepEqual(packLayoutStampLines(after.packCheck!), [
    "Factory book layout: 6 × 8 V",
    "Field-modified as-found: 4 × 12 V (48 V pack)",
  ]);
});

