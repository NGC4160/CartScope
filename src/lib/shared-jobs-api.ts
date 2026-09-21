import { parseSharedJobsDocument, toSharedJobsDocument } from "./shared-jobs.ts";
import {
  isSharedStoreConfigured,
  readSharedJobs,
  writeSharedJobs,
  writeSharedJobsIfEmpty,
} from "./shared-jobs-backend.ts";

export type SharedJobsApiBody = {
  ok: boolean;
  empty?: boolean;
  configured?: boolean;
  wrote?: boolean;
  migrated?: boolean;
  error?: string;
  version?: number;
  updatedAt?: number;
  jobs?: unknown;
};

export type SharedJobsApiResult = {
  status: number;
  body: SharedJobsApiBody;
};

export async function handleSharedJobsGet(): Promise<SharedJobsApiResult> {
  if (!isSharedStoreConfigured()) {
    return { status: 200, body: { ok: true, empty: true, configured: false } };
  }
  try {
    const doc = await readSharedJobs();
    if (!doc) return { status: 200, body: { ok: true, empty: true, configured: true } };
    return { status: 200, body: { ok: true, empty: false, configured: true, ...doc } };
  } catch (error) {
    console.error("Shared jobs read failed", error);
    return {
      status: 502,
      body: {
        ok: false,
        empty: false,
        configured: true,
        error: "Shared jobs store could not be read",
      },
    };
  }
}

export async function handleSharedJobsPut(body: unknown): Promise<SharedJobsApiResult> {
  if (!isSharedStoreConfigured()) {
    return {
      status: 503,
      body: {
        ok: false,
        configured: false,
        error:
          "Shared jobs store is not configured. Add a Vercel Blob store and set BLOB_READ_WRITE_TOKEN.",
      },
    };
  }

  const parsed = parseSharedJobsDocument(body);
  if (!parsed) {
    return { status: 400, body: { ok: false, error: "Jobs payload was not an object" } };
  }

  const migrate =
    Boolean(body) && typeof body === "object" && (body as { migrate?: unknown }).migrate === true;
  const next = toSharedJobsDocument(parsed, Date.now());

  try {
    if (migrate) {
      const result = await writeSharedJobsIfEmpty(next);
      return {
        status: 200,
        body: {
          ok: true,
          empty: false,
          configured: true,
          wrote: result.wrote,
          migrated: result.wrote,
          ...result.current,
        },
      };
    }
    await writeSharedJobs(next);
    return {
      status: 200,
      body: {
        ok: true,
        empty: false,
        configured: true,
        wrote: true,
        ...next,
      },
    };
  } catch (error) {
    console.error("Shared jobs write failed", error);
    return {
      status: 502,
      body: {
        ok: false,
        configured: true,
        error: "Shared jobs store could not be written",
      },
    };
  }
}
