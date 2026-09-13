import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { JobRecord, PackCheckRecord, PackDraft } from "../data/types.ts";
import { packLayoutStampLines } from "./pack-layout.ts";
import {
  JOBS_STORAGE_KEY,
  flushJobsPersist,
  getJobStorage,
  jobOnThisTablet,
  jobStorage,
  jobsFromPersistedState,
  jobsMatchDurable,
  lastTabletWrite,
  markJobsSessionMutated,
  mergeJobState,
  parsePersistedJobs,
  partializeJobState,
  persistJobsPayload,
  persistTabletJobs,
  pickRicherJobsRaw,
  rawContainsJobIds,
  resetJobsPersistForTests,
  setJobsBackupStorage,
  snapshotJobs,
  writeClockFromRaw,
} from "./jobs-persist.ts";

type TabletDisk = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function makeDisk(): { disk: Map<string, string>; storage: TabletDisk } {
  const disk = new Map<string, string>();
  return {
    disk,
    storage: {
      getItem: (key) => disk.get(key) ?? null,
      setItem: (key, value) => {
        disk.set(key, String(value));
      },
      removeItem: (key) => {
        disk.delete(key);
      },
    },
  };
}

function hideBrowserStorage() {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
}

function installBrowserStorage(storage: TabletDisk) {
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
  });
}

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

beforeEach(() => {
  resetJobsPersistForTests();
});

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

describe("job persist storage", { concurrency: false }, () => {
  test("skipHydration persist rehydrate keeps a field-modified job by id", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const { storage } = makeDisk();
    installBrowserStorage(storage);
    try {
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
      await flushJobsPersist();
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
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("SSR-cached persist adapter writes Field-modified jobs to localStorage and survives hard reload", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

    try {
      hideBrowserStorage();
      assert.equal(getJobStorage(), jobStorage);
      // Zustand 5 createJSONStorage assigns storage = getStorage() immediately.
      const ssrBound = createJSONStorage(() => getJobStorage());
      assert.ok(ssrBound);

      const { disk, storage } = makeDisk();
      installBrowserStorage(storage);
      assert.equal(
        getJobStorage(),
        jobStorage,
        "factory must keep the same adapter after window appears",
      );

      type Mini = { jobs: JobRecord[]; save: (job: JobRecord) => void };
      const persistOpts = {
        name: JOBS_STORAGE_KEY,
        storage: ssrBound,
        partialize: partializeJobState,
        merge: mergeJobState,
        skipHydration: true as const,
      };
      const useMini = create<Mini>()(
        persist(
          (set, get) => ({
            jobs: [],
            save: (job) => set({ jobs: [job, ...get().jobs] }),
          }),
          persistOpts,
        ),
      );

      const job = fieldModifiedJob();
      useMini.getState().save(job);
      await flushJobsPersist();

      const raw = storage.getItem(JOBS_STORAGE_KEY);
      assert.ok(raw, "save must land in window.localStorage, not the SSR memory Map");
      assert.ok(disk.has(JOBS_STORAGE_KEY));
      const persisted = parsePersistedJobs(raw);
      assert.ok(jobOnThisTablet(persisted ?? [], job.id));
      assert.equal(jobOnThisTablet(persisted ?? [], job.id)?.packCheck?.cells.length, 4);

      hideBrowserStorage();
      assert.equal(
        jobStorage.getItem(JOBS_STORAGE_KEY),
        null,
        "save must not write the in-memory Map when localStorage exists",
      );

      // New store instance after a hard reload. Bind persist on SSR again, then
      // rehydrate on the client from the same localStorage disk.
      const reloadBound = createJSONStorage(() => getJobStorage());
      installBrowserStorage(storage);
      const useReloaded = create<Mini>()(
        persist(
          (set, get) => ({
            jobs: [],
            save: (job) => set({ jobs: [job, ...get().jobs] }),
          }),
          {
            name: JOBS_STORAGE_KEY,
            storage: reloadBound,
            partialize: partializeJobState,
            merge: mergeJobState,
            skipHydration: true,
          },
        ),
      );
      assert.equal(useReloaded.getState().jobs.length, 0);
      await useReloaded.persist.rehydrate();
      const after = jobOnThisTablet(useReloaded.getState().jobs, job.id);
      assert.ok(after, "hard reload must restore the field-modified job from localStorage");
      assert.equal(after.packCheck?.layoutSource, "field-modified");
      assert.equal(after.packCheck?.factoryCellCount, 6);
      assert.equal(after.packCheck?.factoryNominalV, 8);
      assert.equal(after.packCheck?.asFoundCellCount, 4);
      assert.equal(after.packCheck?.asFoundNominalV, 12);
      assert.equal(after.packCheck?.cells.length, 4);
      assert.equal(after.packCheck?.cells[0]?.volts, "12.80");
      assert.equal(after.packDraft?.layoutSource, "field-modified");
      assert.equal(after.packDraft?.asFoundCount, "4");
      assert.equal(after.packDraft?.asFoundCellV, "12");
      assert.equal(after.packDraft?.cells.length, 4);
      assert.deepEqual(packLayoutStampLines(after.packCheck!), [
        "Factory book layout: 6 × 8 V",
        "Field-modified as-found: 4 × 12 V (48 V pack)",
      ]);
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("mutation durable-writes the full jobs list and read-back verifies the key", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const { disk, storage } = makeDisk();
    installBrowserStorage(storage);
    try {
      const older = fieldModifiedJob("job_hbpyoadfzt");
      older.packCheck = {
        ...older.packCheck!,
        layoutSource: "factory-book",
        asFoundCellCount: undefined,
      };
      const olderRaw = persistJobsPayload([older]);
      storage.setItem(JOBS_STORAGE_KEY, olderRaw);
      assert.ok(rawContainsJobIds(olderRaw, [older.id]));

      type Mini = { jobs: JobRecord[]; save: (job: JobRecord) => void };
      const useMini = create<Mini>()(
        persist(
          (set, get) => ({
            jobs: [older],
            save: (job) => {
              const jobs = [job, ...get().jobs.filter((j) => j.id !== job.id)];
              set({ jobs });
              void persistTabletJobs(jobs);
            },
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

      const next = fieldModifiedJob("job_zrnbe7jojv");
      useMini.getState().save(next);
      await flushJobsPersist();

      const raw = storage.getItem(JOBS_STORAGE_KEY);
      assert.ok(raw, "create/save must write cartscope-jobs-v1");
      assert.ok(disk.has(JOBS_STORAGE_KEY));
      assert.ok(jobsMatchDurable(raw, useMini.getState().jobs));
      assert.ok(rawContainsJobIds(raw, [older.id, next.id]));
      assert.match(raw, /job_zrnbe7jojv/);
      assert.match(raw, /field-modified/);
      assert.match(raw, /asFoundCellCount":4/);
      const found = jobOnThisTablet(parsePersistedJobs(raw) ?? [], next.id);
      assert.equal(found?.packCheck?.layoutSource, "field-modified");
      assert.equal(found?.packCheck?.asFoundCellCount, 4);
      assert.ok(writeClockFromRaw(raw)! > writeClockFromRaw(olderRaw)!);
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("cannot silently keep a stale localStorage blob while memory has newer jobs", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const staleJob = fieldModifiedJob("job_hbpyoadfzt");
    let frozen = persistJobsPayload([staleJob]);
    const backup = makeDisk();
    const sabotaged: TabletDisk = {
      getItem: () => frozen,
      setItem: () => {
        /* pretend write — DevTools still shows the older job */
      },
      removeItem: () => {},
    };
    installBrowserStorage(sabotaged);
    setJobsBackupStorage(backup.storage);
    try {
      const next = fieldModifiedJob("job_zrnbe7jojv");
      const result = await persistTabletJobs([next, staleJob]);
      assert.equal(result.ok, true, "verified backup is durable success");
      assert.equal(result.localStorage, false, "verify must fail when getItem stays stale");
      assert.equal(result.backup, true, "fallback must receive the full list");
      assert.equal(frozen.includes("job_zrnbe7jojv"), false, "stale origin key is unchanged");
      const backupRaw = backup.storage.getItem(JOBS_STORAGE_KEY);
      assert.ok(rawContainsJobIds(backupRaw, [next.id, staleJob.id]));
      assert.match(String(backupRaw), /field-modified/);
      const richer = pickRicherJobsRaw(frozen, backupRaw);
      assert.ok(jobOnThisTablet(parsePersistedJobs(richer) ?? [], next.id));
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("quota throw retries after clearing, then falls back instead of memory-only", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const disk = new Map<string, string>();
    let throwsLeft = 3;
    const backup = makeDisk();
    const storage: TabletDisk = {
      getItem: (key) => disk.get(key) ?? null,
      setItem: (key, value) => {
        if (throwsLeft > 0) {
          throwsLeft -= 1;
          const err = new Error("The quota has been exceeded.");
          err.name = "QuotaExceededError";
          throw err;
        }
        disk.set(key, String(value));
      },
      removeItem: (key) => {
        disk.delete(key);
      },
    };
    installBrowserStorage(storage);
    setJobsBackupStorage(backup.storage);
    try {
      const next = fieldModifiedJob("job_zrnbe7jojv");
      const result = await persistTabletJobs([next]);
      assert.equal(result.ok, true);
      const raw = storage.getItem(JOBS_STORAGE_KEY) ?? backup.storage.getItem(JOBS_STORAGE_KEY);
      assert.ok(rawContainsJobIds(raw, [next.id]));
      assert.match(String(raw), /asFoundCellCount":4/);
      if (!result.localStorage) {
        assert.equal(result.backup, true);
      }
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("LS verify fail must not report ok via memory-only", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const staleJob = fieldModifiedJob("job_hbpyoadfzt");
    const frozen = persistJobsPayload([staleJob]);
    const sabotaged: TabletDisk = {
      getItem: () => frozen,
      setItem: () => {},
      removeItem: () => {},
    };
    installBrowserStorage(sabotaged);
    try {
      const next = fieldModifiedJob("job_e6umrx8qx8");
      const result = await persistTabletJobs([next]);
      assert.equal(result.localStorage, false);
      assert.equal(result.backup, false);
      assert.equal(result.ok, false, "memory-only must never count as durable ok");
      assert.equal(lastTabletWrite()?.ok, false);
      assert.equal(frozen.includes("job_e6umrx8qx8"), false);
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("IDB backup is awaited and verified when LS fails", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const staleJob = fieldModifiedJob("job_hbpyoadfzt");
    const frozen = persistJobsPayload([staleJob]);
    installBrowserStorage({
      getItem: () => frozen,
      setItem: () => {},
      removeItem: () => {},
    });
    const disk = new Map<string, string>();
    let finished = false;
    setJobsBackupStorage({
      getItem: (key) => disk.get(key) ?? null,
      setItem: async (key, value) => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        disk.set(key, value);
        finished = true;
      },
      removeItem: (key) => {
        disk.delete(key);
      },
    });
    try {
      const next = fieldModifiedJob("job_e6umrx8qx8");
      const pending = persistTabletJobs([next]);
      assert.equal(finished, false, "save must wait for backup verify");
      const result = await pending;
      assert.equal(finished, true);
      assert.equal(result.ok, true);
      assert.equal(result.localStorage, false);
      assert.equal(result.backup, true);
      const backupRaw = disk.get(JOBS_STORAGE_KEY);
      assert.ok(rawContainsJobIds(backupRaw, [next.id]));
      assert.match(String(backupRaw), /field-modified/);
      assert.match(String(backupRaw), /asFoundCellCount":4/);
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("stale LS + successful IDB still rehydrates the Field-modified job", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const staleJob = fieldModifiedJob("job_hbpyoadfzt");
    staleJob.packCheck = {
      ...staleJob.packCheck!,
      layoutSource: "factory-book",
      asFoundCellCount: undefined,
    };
    const staleRaw = persistJobsPayload([staleJob]);
    const next = fieldModifiedJob("job_e6umrx8qx8");
    const freshRaw = persistJobsPayload([next, staleJob]);
    const { storage } = makeDisk();
    storage.setItem(JOBS_STORAGE_KEY, staleRaw);
    const backup = makeDisk();
    backup.storage.setItem(JOBS_STORAGE_KEY, freshRaw);
    installBrowserStorage(storage);
    setJobsBackupStorage(backup.storage);
    try {
      type Mini = { jobs: JobRecord[]; save: (job: JobRecord) => void };
      const useReloaded = create<Mini>()(
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
      assert.equal(useReloaded.getState().jobs.length, 0);
      await useReloaded.persist.rehydrate();
      const after = jobOnThisTablet(useReloaded.getState().jobs, next.id);
      assert.ok(after, "hydrate must restore Field-modified job from IDB, not stale LS");
      assert.equal(after.packCheck?.layoutSource, "field-modified");
      assert.equal(after.packCheck?.asFoundCellCount, 4);
      assert.equal(after.packCheck?.cells.length, 4);
      assert.equal(after.packCheck?.cells[0]?.volts, "12.80");
      assert.deepEqual(packLayoutStampLines(after.packCheck!), [
        "Factory book layout: 6 × 8 V",
        "Field-modified as-found: 4 × 12 V (48 V pack)",
      ]);
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("quota path retries, prunes oldest, then durable-succeeds when possible", async () => {
    const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const disk = new Map<string, string>();
    const older = fieldModifiedJob("job_oldquota");
    older.updatedAt = "2026-09-01T00:00:00.000Z";
    const next = fieldModifiedJob("job_e6umrx8qx8");
    const storage: TabletDisk = {
      getItem: (key) => disk.get(key) ?? null,
      setItem: (key, value) => {
        if (String(value).includes("job_oldquota") && String(value).includes("job_e6umrx8qx8")) {
          const err = new Error("The quota has been exceeded.");
          err.name = "QuotaExceededError";
          throw err;
        }
        disk.set(key, String(value));
      },
      removeItem: (key) => {
        disk.delete(key);
      },
    };
    installBrowserStorage(storage);
    try {
      const result = await persistTabletJobs([next, older]);
      assert.equal(result.ok, true);
      assert.equal(result.localStorage, true);
      const raw = storage.getItem(JOBS_STORAGE_KEY);
      assert.ok(rawContainsJobIds(raw, [next.id]));
      assert.match(String(raw), /field-modified/);
      assert.match(String(raw), /asFoundCellCount":4/);
    } finally {
      if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  test("session mutation merge keeps memory jobs when disk is older", () => {
    const current = { jobs: [fieldModifiedJob("job_zrnbe7jojv")] };
    const stale = { jobs: [fieldModifiedJob("job_hbpyoadfzt")] };
    markJobsSessionMutated();
    const merged = mergeJobState(stale, current);
    assert.equal(merged.jobs[0]?.id, "job_zrnbe7jojv");
    assert.equal(jobOnThisTablet(merged.jobs, "job_hbpyoadfzt"), undefined);
  });
});
