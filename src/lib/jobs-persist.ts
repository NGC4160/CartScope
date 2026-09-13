import type { JobRecord } from "@/data/types";

export const JOBS_STORAGE_KEY = "cartscope-jobs-v1";

const memory = new Map<string, string>();

/** localStorage when it exists; in-memory on SSR / blocked storage so persist stays enabled. */
export function getJobStorage(): {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
} {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.getItem(JOBS_STORAGE_KEY);
      return window.localStorage;
    }
  } catch {
    /* private mode, iframe block, or SSR */
  }
  return {
    getItem: (name) => memory.get(name) ?? null,
    setItem: (name, value) => {
      memory.set(name, value);
    },
    removeItem: (name) => {
      memory.delete(name);
    },
  };
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
