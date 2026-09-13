import type { JobRecord } from "@/data/types";

export const JOBS_STORAGE_KEY = "cartscope-jobs-v1";

const memory = new Map<string, string>();

/** Bumps on every durable payload so a stale localStorage blob cannot win a read. */
let writeClock = 0;

/** True after this tab created/saved a job. Late rehydrate must not replace memory. */
let sessionMutated = false;

/** Test-injected backup (IndexedDB stand-in). Production uses IndexedDB when present. */
let backupKv: JobStorageAdapter | null = null;

/** Last persistTabletRaw result — never ok for memory-only. */
let lastWrite: TabletWriteResult | null = null;

/** Serialize durable writes so a late clock-N payload cannot clobber clock-N+1. */
let writeTail: Promise<void> = Promise.resolve();

export const TABLET_PERSIST_FAILED =
  "Could not save this case on the tablet. Check storage and try Save again.";

export type JobStorageAdapter = {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void | TabletWriteResult>;
  removeItem: (name: string) => void;
};

export type TabletWriteResult = {
  ok: boolean;
  localStorage: boolean;
  backup: boolean;
};

/**
 * Zustand 5 `createJSONStorage(getStorage)` calls `getStorage()` once and caches
 * that object. A factory that returned `localStorage` or a new memory Map on SSR
 * pinned the Map for the module lifetime — client saves never reached the tablet.
 * This adapter is stable; each method tries `window.localStorage` at call time.
 */
function liveLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.getItem(JOBS_STORAGE_KEY);
      return window.localStorage;
    }
  } catch {
    /* private mode, iframe block, or SSR */
  }
  return null;
}

function safeLsGet(name: string): string | null {
  try {
    return liveLocalStorage()?.getItem(name) ?? null;
  } catch {
    return null;
  }
}

function idbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

const IDB_NAME = "cartscope-jobs";
const IDB_VERSION = 1;
const IDB_STORE = "kv";

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb"));
  });
}

function openJobsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb open"));
  });
}

async function withIdb<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openJobsDb();
  try {
    const tx = db.transaction(IDB_STORE, mode);
    return await idbRequest(fn(tx.objectStore(IDB_STORE)));
  } finally {
    db.close();
  }
}

export async function readJobsBackup(name: string): Promise<string | null> {
  if (backupKv) {
    return backupKv.getItem(name);
  }
  if (!idbAvailable()) return null;
  try {
    const value = await withIdb("readonly", (store) => store.get(name));
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function backupContainsValue(read: string | null, value: string): boolean {
  if (read !== value) return false;
  const ids = (parsePersistedJobs(value) ?? []).map((job) => job.id);
  return rawContainsJobIds(read, ids);
}

export async function writeJobsBackup(name: string, value: string): Promise<boolean> {
  if (backupKv) {
    try {
      await backupKv.setItem(name, value);
      const read = await backupKv.getItem(name);
      return backupContainsValue(typeof read === "string" ? read : null, value);
    } catch {
      return false;
    }
  }
  if (!idbAvailable()) return false;
  try {
    await withIdb("readwrite", (store) => store.put(value, name));
    const read = await readJobsBackup(name);
    return backupContainsValue(read, value);
  } catch {
    return false;
  }
}

function removeJobsBackup(name: string): void {
  if (backupKv) {
    try {
      backupKv.removeItem(name);
    } catch {
      /* ignore */
    }
    return;
  }
  if (!idbAvailable()) return;
  void withIdb("readwrite", (store) => store.delete(name)).catch(() => undefined);
}

export function setJobsBackupStorage(adapter: JobStorageAdapter | null): void {
  backupKv = adapter;
}

export function markJobsSessionMutated(): void {
  sessionMutated = true;
}

export function jobsSessionMutated(): boolean {
  return sessionMutated;
}

export function lastTabletWrite(): TabletWriteResult | null {
  return lastWrite;
}

/** Drain queued durable writes (zustand persist setItem is async). */
export function flushJobsPersist(): Promise<void> {
  return writeTail;
}

export function resetJobsPersistForTests(): void {
  memory.clear();
  writeClock = 0;
  sessionMutated = false;
  backupKv = null;
  lastWrite = null;
  writeTail = Promise.resolve();
}

function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeTail.then(fn, fn);
  writeTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function writeClockFromRaw(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return 0;
    const state = (parsed as { state?: unknown }).state;
    if (!state || typeof state !== "object") return 0;
    const clock = (state as { writeClock?: unknown }).writeClock;
    return typeof clock === "number" && Number.isFinite(clock) ? clock : 0;
  } catch {
    return 0;
  }
}

export function rawContainsJobIds(raw: string | null | undefined, ids: readonly string[]): boolean {
  const jobs = parsePersistedJobs(raw);
  if (!jobs) return false;
  return ids.every((id) => jobs.some((job) => job.id === id));
}

export function jobsMatchDurable(
  raw: string | null | undefined,
  jobs: readonly JobRecord[],
): boolean {
  return rawContainsJobIds(
    raw,
    jobs.map((job) => job.id),
  );
}

export function pickRicherJobsRaw(...raws: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  let bestClock = -1;
  let bestNewest = -1;
  let bestCount = -1;
  for (const raw of raws) {
    const jobs = parsePersistedJobs(raw);
    if (!raw || !jobs) continue;
    const clock = writeClockFromRaw(raw);
    const newest = jobs.reduce((max, job) => Math.max(max, Date.parse(job.updatedAt) || 0), 0);
    const count = jobs.length;
    const richer =
      clock > bestClock ||
      (clock === bestClock && newest > bestNewest) ||
      (clock === bestClock && newest === bestNewest && count > bestCount);
    if (richer) {
      best = raw;
      bestClock = clock;
      bestNewest = newest;
      bestCount = count;
    }
  }
  return best;
}

function jobUpdatedAtMs(job: JobRecord): number {
  return Date.parse(job.updatedAt) || 0;
}

function localStorageHolds(name: string, value: string, ids: readonly string[]): boolean {
  const read = safeLsGet(name);
  return read === value && rawContainsJobIds(read, ids);
}

function clearLocalStorageKey(name: string): void {
  try {
    liveLocalStorage()?.removeItem(name);
  } catch {
    /* ignore */
  }
}

/**
 * Jobs that must stay in localStorage: the newest updatedAt (the case just
 * saved). Ties keep the earlier list index — createJob prepends the new job.
 */
export function protectJobIds(jobs: readonly JobRecord[]): string[] {
  if (!jobs.length) return [];
  let best = 0;
  let bestMs = jobUpdatedAtMs(jobs[0]!);
  for (let i = 1; i < jobs.length; i++) {
    const ms = jobUpdatedAtMs(jobs[i]!);
    if (ms > bestMs) {
      best = i;
      bestMs = ms;
    }
  }
  return [jobs[best]!.id];
}

function dropPrunableJob(jobs: JobRecord[], keepIds: ReadonlySet<string>): JobRecord[] | null {
  const candidates = jobs
    .map((job, index) => ({ job, index }))
    .filter(({ job }) => !keepIds.has(job.id));
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const aDone = a.job.status === "complete" ? 0 : 1;
    const bDone = b.job.status === "complete" ? 0 : 1;
    if (aDone !== bDone) return aDone - bDone;
    const aMs = jobUpdatedAtMs(a.job);
    const bMs = jobUpdatedAtMs(b.job);
    if (aMs !== bMs) return aMs - bMs;
    return a.index - b.index;
  });
  const dropIndex = candidates[0]!.index;
  return jobs.filter((_, index) => index !== dropIndex);
}

function writeLocalStorageOnce(name: string, value: string, ids: readonly string[]): boolean {
  const live = liveLocalStorage();
  if (!live) return false;
  try {
    live.setItem(name, value);
  } catch {
    try {
      live.removeItem(name);
      live.setItem(name, value);
    } catch {
      return false;
    }
  }
  return localStorageHolds(name, value, ids);
}

/**
 * Write and read-back verify. QuotaExceeded is not the only failure: some
 * tablets no-op setItem when the key is already near quota and leave the old
 * blob in place. Always free the key and retry when verify fails.
 */
function tryWriteLocalStorage(name: string, value: string, ids: readonly string[]): boolean {
  if (writeLocalStorageOnce(name, value, ids)) return true;
  clearLocalStorageKey(name);
  return writeLocalStorageOnce(name, value, ids);
}

/**
 * Land `keepIds` in localStorage. If the full list cannot fit, drop completed
 * jobs first, then oldest updatedAt — never the just-saved job — and rewrite
 * until that job verifies or localStorage cannot hold it.
 */
function writeLocalStorageOrPrune(name: string, value: string, keepIds: readonly string[]): boolean {
  if (tryWriteLocalStorage(name, value, keepIds)) return true;
  let jobs = parsePersistedJobs(value);
  if (!jobs) return false;
  const keep = new Set(keepIds.length ? keepIds : protectJobIds(jobs));
  if (!keep.size) return false;
  while (true) {
    const next = dropPrunableJob(jobs, keep);
    if (!next) break;
    jobs = next;
    const pruned = persistJobsPayload(jobs);
    if (tryWriteLocalStorage(name, pruned, [...keep])) return true;
  }
  return rawContainsJobIds(safeLsGet(name), [...keep]);
}

async function writeBackupVerified(
  name: string,
  value: string,
  ids: readonly string[],
): Promise<boolean> {
  const wrote = await writeJobsBackup(name, value);
  if (!wrote) return false;
  const read = await readJobsBackup(name);
  return typeof read === "string" && read === value && rawContainsJobIds(read, ids);
}

async function writeTabletNow(
  name: string,
  value: string,
  ids?: readonly string[],
): Promise<TabletWriteResult> {
  const parsed = parsePersistedJobs(value) ?? [];
  const expectedIds = ids ?? parsed.map((job) => job.id);
  const keepIds = protectJobIds(parsed);
  const lsOk = writeLocalStorageOrPrune(name, value, keepIds.length ? keepIds : expectedIds);
  let backupOk = false;
  if (!lsOk) {
    backupOk = await writeBackupVerified(name, value, expectedIds);
  } else {
    void writeJobsBackup(name, value);
  }
  if (!lsOk && !backupOk) {
    memory.set(name, value);
  } else {
    memory.delete(name);
  }
  const result: TabletWriteResult = {
    ok: lsOk || backupOk,
    localStorage: lsOk,
    backup: backupOk,
  };
  lastWrite = result;
  return result;
}

/**
 * Write the full jobs list, then read it back. `ok` is only true after a
 * verified localStorage write and/or a verified, awaited IndexedDB backup.
 * Memory-only never counts as success.
 */
export function persistTabletRaw(
  name: string,
  value: string,
  ids?: readonly string[],
): Promise<TabletWriteResult> {
  return enqueueWrite(() => writeTabletNow(name, value, ids));
}

/** Durable-write the tablet job list. localStorage is pruned until the current job verifies. */
export function persistTabletJobs(jobs: JobRecord[]): Promise<TabletWriteResult> {
  return persistTabletRaw(
    JOBS_STORAGE_KEY,
    persistJobsPayload(jobs),
    jobs.map((job) => job.id),
  );
}

export function readLiveJobsRaw(name = JOBS_STORAGE_KEY): string | null {
  return safeLsGet(name);
}

function readTabletRaw(name: string): string | null | Promise<string | null> {
  const fromLs = safeLsGet(name);
  const fromMem = memory.get(name) ?? null;
  if (backupKv) {
    const fromBackup = backupKv.getItem(name);
    if (fromBackup instanceof Promise) {
      return fromBackup.then((backup) => pickRicherJobsRaw(fromLs, fromMem, backup));
    }
    return pickRicherJobsRaw(fromLs, fromMem, fromBackup);
  }
  if (idbAvailable()) {
    return readJobsBackup(name).then((backup) => pickRicherJobsRaw(fromLs, fromMem, backup));
  }
  return pickRicherJobsRaw(fromLs, fromMem);
}

export const jobStorage: JobStorageAdapter = {
  getItem(name) {
    return readTabletRaw(name);
  },
  setItem(name, value) {
    const jobs = parsePersistedJobs(value);
    if (jobs) return persistTabletJobs(jobs);
    return persistTabletRaw(name, value);
  },
  removeItem(name) {
    try {
      liveLocalStorage()?.removeItem(name);
    } catch {
      /* ignore */
    }
    memory.delete(name);
    removeJobsBackup(name);
  },
};

/** Always the same adapter. Safe to pass to Zustand 5 `createJSONStorage`. */
export function getJobStorage(): JobStorageAdapter {
  return jobStorage;
}

/** JSON-safe clone so persist cannot drop the whole tablet store on a bad field. */
export function snapshotJobs(jobs: JobRecord[]): JobRecord[] {
  return JSON.parse(JSON.stringify(jobs)) as JobRecord[];
}

export function jobsFromPersistedState(persisted: unknown): JobRecord[] | undefined {
  if (!persisted || typeof persisted !== "object") return undefined;
  const jobs = (persisted as { jobs?: unknown }).jobs;
  if (!Array.isArray(jobs)) return undefined;
  return jobs as JobRecord[];
}

/** Read jobs from a zustand persist blob (`{ state, version }`) or a bare `{ jobs }`. */
export function parsePersistedJobs(raw: string | null | undefined): JobRecord[] | undefined {
  if (raw == null || raw === "") return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "state" in parsed) {
      return jobsFromPersistedState((parsed as { state: unknown }).state);
    }
    return jobsFromPersistedState(parsed);
  } catch {
    return undefined;
  }
}

export function persistJobsPayload(jobs: JobRecord[]): string {
  writeClock += 1;
  return JSON.stringify({ state: { jobs: snapshotJobs(jobs), writeClock }, version: 0 });
}

export function partializeJobState<T extends { jobs: JobRecord[] }>(
  state: T,
): { jobs: JobRecord[] } {
  return { jobs: snapshotJobs(state.jobs) };
}

export function mergeJobState<T extends { jobs: JobRecord[] }>(persisted: unknown, current: T): T {
  if (sessionMutated) return current;
  const jobs = jobsFromPersistedState(persisted);
  if (!jobs) return current;
  return { ...current, jobs };
}

export function jobOnThisTablet(jobs: readonly JobRecord[], jobId: string): JobRecord | undefined {
  return jobs.find((j) => j.id === jobId);
}
