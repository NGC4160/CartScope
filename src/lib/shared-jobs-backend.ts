import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseSharedJobsDocument, type SharedJobsDocument } from "./shared-jobs.ts";

export const SHARED_JOBS_BLOB_PATH = "cartscope-jobs.json";

let filePathOverride: string | null = null;

export function setSharedJobsFilePathForTests(next: string | null): void {
  filePathOverride = next;
}

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Local `npm run dev` / tests: one JSON file so two browser profiles can share. */
function shouldUseFileStore() {
  return !hasBlobToken() && process.env.VERCEL !== "1";
}

export function isSharedStoreConfigured() {
  return hasBlobToken() || shouldUseFileStore();
}

function filePath() {
  return filePathOverride ?? path.join(process.cwd(), ".data", SHARED_JOBS_BLOB_PATH);
}

async function readFileStore(): Promise<SharedJobsDocument | null> {
  try {
    const raw = await readFile(filePath(), "utf8");
    return parseSharedJobsDocument(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeFileStore(doc: SharedJobsDocument): Promise<void> {
  const dest = filePath();
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, JSON.stringify(doc), "utf8");
}

async function readBlobStore(): Promise<SharedJobsDocument | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(SHARED_JOBS_BLOB_PATH, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  if (!text.trim()) return null;
  return parseSharedJobsDocument(JSON.parse(text));
}

async function writeBlobStore(doc: SharedJobsDocument): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(SHARED_JOBS_BLOB_PATH, JSON.stringify(doc), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function readSharedJobs(): Promise<SharedJobsDocument | null> {
  if (shouldUseFileStore()) return readFileStore();
  return readBlobStore();
}

export async function writeSharedJobs(doc: SharedJobsDocument): Promise<void> {
  if (shouldUseFileStore()) {
    await writeFileStore(doc);
    return;
  }
  await writeBlobStore(doc);
}

export async function writeSharedJobsIfEmpty(
  doc: SharedJobsDocument,
): Promise<{ wrote: boolean; current: SharedJobsDocument }> {
  const existing = await readSharedJobs();
  if (existing) return { wrote: false, current: existing };
  await writeSharedJobs(doc);
  return { wrote: true, current: doc };
}
