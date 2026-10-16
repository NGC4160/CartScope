import { timingSafeEqual } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { logServer } from "./server-log.ts";
import {
  readSharedJobsRaw,
  sharedJobsFilePath,
  sharedJobsUseFileStore,
  writeSharedJobsRaw,
} from "./shared-jobs-backend.ts";

export type JobsBackupResult = {
  ok: true;
  wrote: boolean;
  date: string;
  missing: boolean;
};

export function backupObjectPath(date: string): string {
  return `backups/${date}.json`;
}

export function utcBackupDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isUtcBackupDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function secretsEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function authorizeCronRequest(request: Request): { ok: true } | { ok: false; status: number; error: string } {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) {
    if (process.env.VERCEL === "1") {
      return { ok: false, status: 401, error: "Cron secret is not set." };
    }
    return { ok: true };
  }
  const header = request.headers.get("authorization") ?? "";
  if (!secretsEqual(header, `Bearer ${secret}`)) {
    return { ok: false, status: 401, error: "Cron request was not authorized." };
  }
  return { ok: true };
}

function fileBackupPath(date: string): string {
  return path.join(path.dirname(sharedJobsFilePath()), "backups", `${date}.json`);
}

async function fileExists(dest: string): Promise<boolean> {
  try {
    await access(dest);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function blobExists(pathname: string): Promise<boolean> {
  const { head } = await import("@vercel/blob");
  try {
    await head(pathname);
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === "BlobNotFoundError") return false;
    throw error;
  }
}

async function readBackupRaw(date: string): Promise<string | null> {
  if (sharedJobsUseFileStore()) {
    const dest = fileBackupPath(date);
    try {
      return await readFile(dest, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  const { get } = await import("@vercel/blob");
  const result = await get(backupObjectPath(date), { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return text.trim() ? text : null;
}

export async function backupSharedJobs(now = new Date()): Promise<JobsBackupResult> {
  const date = utcBackupDate(now);
  const pathname = backupObjectPath(date);
  if (sharedJobsUseFileStore()) {
    const dest = fileBackupPath(date);
    if (await fileExists(dest)) return { ok: true, wrote: false, date, missing: false };
    const raw = await readSharedJobsRaw();
    if (!raw) return { ok: true, wrote: false, date, missing: true };
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, raw, "utf8");
    return { ok: true, wrote: true, date, missing: false };
  }

  if (await blobExists(pathname)) return { ok: true, wrote: false, date, missing: false };
  const raw = await readSharedJobsRaw();
  if (!raw) return { ok: true, wrote: false, date, missing: true };
  const { put } = await import("@vercel/blob");
  await put(pathname, raw, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
  });
  return { ok: true, wrote: true, date, missing: false };
}

export async function restoreSharedJobs(date: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isUtcBackupDate(date)) return { ok: false, error: "Backup date must be YYYY-MM-DD." };
  const raw = await readBackupRaw(date);
  if (raw == null || !raw.trim()) return { ok: false, error: `No backup for ${date}.` };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Backup is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !Array.isArray((parsed as { jobs?: unknown }).jobs)) {
    return { ok: false, error: "Backup does not contain a jobs list." };
  }
  await writeSharedJobsRaw(raw);
  return { ok: true };
}

export async function handleJobsBackupGet(request: Request): Promise<{
  status: number;
  body: { ok: boolean; wrote?: boolean; date?: string; missing?: boolean; error?: string };
}> {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return { status: auth.status, body: { ok: false, error: auth.error } };
  try {
    const result = await backupSharedJobs();
    return {
      status: 200,
      body: { ok: true, wrote: result.wrote, date: result.date, missing: result.missing },
    };
  } catch (error) {
    logServer("error", "jobs_backup_failed", { error });
    return { status: 502, body: { ok: false, error: "Jobs backup could not be written." } };
  }
}
