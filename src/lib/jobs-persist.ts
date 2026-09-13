import type { JobRecord } from "@/data/types";

export const JOBS_STORAGE_KEY = "cartscope-jobs-v1";

const memory = new Map<string, string>();

export type JobStorageAdapter = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
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

export const jobStorage: JobStorageAdapter = {
  getItem(name) {
    const live = liveLocalStorage();
    if (live) return live.getItem(name);
    return memory.get(name) ?? null;
  },
  setItem(name, value) {
    const live = liveLocalStorage();
    if (live) {
      live.setItem(name, value);
      return;
    }
    memory.set(name, value);
  },
  removeItem(name) {
    const live = liveLocalStorage();
    if (live) {
      live.removeItem(name);
      return;
    }
    memory.delete(name);
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
  return JSON.stringify({ state: { jobs: snapshotJobs(jobs) }, version: 0 });
}

export function partializeJobState<T extends { jobs: JobRecord[] }>(state: T): { jobs: JobRecord[] } {
  return { jobs: snapshotJobs(state.jobs) };
}

export function mergeJobState<T extends { jobs: JobRecord[] }>(persisted: unknown, current: T): T {
  const jobs = jobsFromPersistedState(persisted);
  if (!jobs) return current;
  return { ...current, jobs };
}

export function jobOnThisTablet(jobs: readonly JobRecord[], jobId: string): JobRecord | undefined {
  return jobs.find((j) => j.id === jobId);
}
