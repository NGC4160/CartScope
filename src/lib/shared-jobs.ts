import type { JobRecord, JobStatus } from "../data/types.ts";
import { snapshotJobs } from "./jobs-persist.ts";

export const SHARED_JOBS_VERSION = 1;
export const SHARED_JOBS_API_PATH = "/api/jobs";
export const SHARED_MIGRATED_KEY = "cartscope-jobs-shared-migrated-v1";

const JOB_STATUSES: ReadonlySet<JobStatus> = new Set(["in-progress", "diagnosed", "complete"]);

export type SharedJobsDocument = {
  version: typeof SHARED_JOBS_VERSION;
  updatedAt: number;
  jobs: JobRecord[];
};

export type SharedJobsPayload = {
  jobs: JobRecord[];
};

function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && JOB_STATUSES.has(value as JobStatus);
}

/**
 * Keep the on-device JobRecord shape. Do not rewrite Who checked it,
 * Helper notes, or observations — those rules live in the store / report.
 */
export function sanitizeLoadedJob(value: unknown): JobRecord | null {
  if (!value || typeof value !== "object") return null;
  let cloned: JobRecord;
  try {
    cloned = snapshotJobs([value as JobRecord])[0]!;
  } catch {
    return null;
  }
  if (!cloned || typeof cloned.id !== "string" || !cloned.id.trim()) return null;
  if (typeof cloned.modelId !== "string" || !cloned.modelId.trim()) return null;
  if (typeof cloned.symptomId !== "string" || !cloned.symptomId.trim()) return null;
  if (typeof cloned.currentStepId !== "string" || !cloned.currentStepId.trim()) return null;
  if (!isJobStatus(cloned.status)) return null;
  if (typeof cloned.createdAt !== "string") cloned.createdAt = "";
  if (typeof cloned.updatedAt !== "string") cloned.updatedAt = cloned.createdAt;
  if (typeof cloned.technician !== "string") cloned.technician = "";
  if (typeof cloned.serialNumber !== "string") cloned.serialNumber = "";
  if (typeof cloned.notes !== "string") cloned.notes = "";
  if (!Array.isArray(cloned.log)) cloned.log = [];
  if (cloned.techObservation !== undefined && typeof cloned.techObservation !== "string") {
    cloned.techObservation = "";
  }
  return cloned;
}

export function sanitizeLoadedJobs(value: unknown): JobRecord[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const jobs: JobRecord[] = [];
  for (const item of value) {
    const job = sanitizeLoadedJob(item);
    if (!job || seen.has(job.id)) continue;
    seen.add(job.id);
    jobs.push(job);
  }
  return jobs;
}

/**
 * Accept a stored document or a PUT body. Returns null when the payload is
 * not an object. An empty jobs list is valid (someone cleared the shop list).
 */
export function parseSharedJobsDocument(value: unknown): SharedJobsDocument | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const jobs = Array.isArray(record.jobs) ? sanitizeLoadedJobs(record.jobs) : [];
  const updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now();
  return {
    version: SHARED_JOBS_VERSION,
    updatedAt,
    jobs,
  };
}

export function toSharedJobsDocument(
  payload: SharedJobsPayload,
  updatedAt = Date.now(),
): SharedJobsDocument {
  return {
    version: SHARED_JOBS_VERSION,
    updatedAt,
    jobs: sanitizeLoadedJobs(payload.jobs),
  };
}

/** True only when this browser already had case files before this session. */
export function shouldMigrateLocalSnapshot(localJobCount: number): boolean {
  return localJobCount > 0;
}
