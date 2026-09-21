import type { JobRecord } from "../data/types.ts";
import {
  SHARED_JOBS_API_PATH,
  SHARED_MIGRATED_KEY,
  parseSharedJobsDocument,
  shouldMigrateLocalSnapshot,
  type SharedJobsDocument,
} from "./shared-jobs.ts";

export type SharedJobsApiResponse = SharedJobsDocument & {
  ok?: boolean;
  empty?: boolean;
  configured?: boolean;
  wrote?: boolean;
  migrated?: boolean;
  error?: string;
};

type SharedPushTimer = ReturnType<typeof setTimeout>;

let sharedConfigured = true;
let sharedHydrated = false;
let sharedPushTimer: SharedPushTimer | null = null;
let pendingJobs: JobRecord[] | null = null;
let flushBound = false;
let skipPush = false;

export function resetSharedJobsClientForTests(): void {
  sharedConfigured = true;
  sharedHydrated = false;
  if (sharedPushTimer != null) {
    clearTimeout(sharedPushTimer);
    sharedPushTimer = null;
  }
  pendingJobs = null;
  skipPush = false;
}

function markSharedReady() {
  sharedHydrated = true;
}

function ensureFlushOnLeave() {
  if (typeof window === "undefined" || flushBound) return;
  flushBound = true;
  window.addEventListener("pagehide", () => {
    void flushSharedPush();
  });
}

function readMigratedFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SHARED_MIGRATED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMigratedFlag() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHARED_MIGRATED_KEY, "1");
  } catch {
    /* quota / private mode */
  }
}

async function fetchSharedJobs(): Promise<SharedJobsApiResponse | null> {
  const response = await fetch(SHARED_JOBS_API_PATH, { cache: "no-store" });
  const body = (await response.json().catch(() => null)) as SharedJobsApiResponse | null;
  if (!body) return null;
  return body;
}

async function pushSharedJobs(
  jobs: JobRecord[],
  migrate = false,
): Promise<SharedJobsDocument | null> {
  if (typeof window === "undefined" || !sharedConfigured) return null;
  try {
    const response = await fetch(SHARED_JOBS_API_PATH, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ jobs, migrate }),
    });
    const body = (await response.json().catch(() => null)) as SharedJobsApiResponse | null;
    if (body?.configured === false) {
      sharedConfigured = false;
      return null;
    }
    if (!response.ok || !body) return null;
    return parseSharedJobsDocument(body);
  } catch {
    return null;
  }
}

export function scheduleSharedPush(jobs: JobRecord[]): void {
  if (typeof window === "undefined" || skipPush) return;
  pendingJobs = jobs;
  if (!sharedHydrated || !sharedConfigured) return;
  ensureFlushOnLeave();
  if (sharedPushTimer != null) clearTimeout(sharedPushTimer);
  sharedPushTimer = setTimeout(() => {
    sharedPushTimer = null;
    const next = pendingJobs;
    if (!next) return;
    void pushSharedJobs(next);
  }, 350);
}

export async function flushSharedPush(): Promise<void> {
  if (typeof window === "undefined") return;
  if (sharedPushTimer != null) {
    clearTimeout(sharedPushTimer);
    sharedPushTimer = null;
  }
  const next = pendingJobs;
  if (sharedHydrated && sharedConfigured && next) {
    await pushSharedJobs(next);
  }
}

export async function hydrateSharedJobs(opts: {
  getJobs: () => JobRecord[];
  setJobs: (jobs: JobRecord[]) => void | Promise<void>;
  sessionMutated: boolean;
}): Promise<void> {
  if (typeof window === "undefined") {
    markSharedReady();
    return;
  }
  ensureFlushOnLeave();
  try {
    const body = await fetchSharedJobs();
    if (!body || body.ok === false) return;
    if (body.configured === false) {
      sharedConfigured = false;
      return;
    }

    if (opts.sessionMutated) {
      const local = opts.getJobs();
      if (local.length) scheduleSharedPush(local);
      return;
    }

    if (body.empty) {
      const local = opts.getJobs();
      if (!readMigratedFlag() && shouldMigrateLocalSnapshot(local.length)) {
        skipPush = true;
        const written = await pushSharedJobs(local, true);
        skipPush = false;
        if (written) {
          writeMigratedFlag();
          await opts.setJobs(written.jobs);
        }
      }
      return;
    }

    const parsed = parseSharedJobsDocument(body);
    if (!parsed) return;
    skipPush = true;
    await opts.setJobs(parsed.jobs);
    skipPush = false;
    writeMigratedFlag();
  } catch {
    // Stay on this tablet's localStorage / IndexedDB cache.
  } finally {
    skipPush = false;
    markSharedReady();
    if (pendingJobs && sharedConfigured) scheduleSharedPush(pendingJobs);
  }
}
