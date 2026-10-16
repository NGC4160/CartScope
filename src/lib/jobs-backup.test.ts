import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, afterEach, beforeEach, describe, test } from "node:test";
import { promisify } from "node:util";
import { backupSharedJobs, handleJobsBackupGet, restoreSharedJobs } from "./jobs-backup.ts";
import { setSharedJobsFilePathForTests, writeSharedJobsRaw } from "./shared-jobs-backend.ts";

const execFileAsync = promisify(execFile);
const DAY = new Date("2026-10-16T15:04:00.000Z");
const ORIGINAL = JSON.stringify({
  version: 1,
  updatedAt: 1,
  jobs: [{ id: "job_backup", lastName: "Alvarez", modelId: "yamaha-ydre-dc" }],
});
const REPLACEMENT = JSON.stringify({
  version: 1,
  updatedAt: 2,
  jobs: [{ id: "job_other", lastName: "Other" }],
});

const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
const prevVercel = process.env.VERCEL;
const prevCron = process.env.CRON_SECRET;
let dir = "";

describe("jobs backup", () => {
  beforeEach(async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
    delete process.env.CRON_SECRET;
    dir = await mkdtemp(path.join(tmpdir(), "cartscope-backup-"));
    setSharedJobsFilePathForTests(path.join(dir, "cartscope-jobs.json"));
  });

  afterEach(async () => {
    setSharedJobsFilePathForTests(null);
    await rm(dir, { recursive: true, force: true });
  });

  after(() => {
    if (prevToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = prevToken;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    if (prevCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevCron;
  });

  test("a second backup the same day does not overwrite", async () => {
    await writeSharedJobsRaw(ORIGINAL);
    const first = await backupSharedJobs(DAY);
    assert.equal(first.wrote, true);
    assert.equal(first.date, "2026-10-16");
    const backupPath = path.join(dir, "backups", "2026-10-16.json");
    assert.equal(await readFile(backupPath, "utf8"), ORIGINAL);

    await writeSharedJobsRaw(REPLACEMENT);
    const second = await backupSharedJobs(DAY);
    assert.equal(second.wrote, false);
    assert.equal(await readFile(backupPath, "utf8"), ORIGINAL);
  });

  test("a missing shop file does not create an empty backup", async () => {
    const result = await backupSharedJobs(DAY);
    assert.equal(result.wrote, false);
    assert.equal(result.missing, true);
    await assert.rejects(readFile(path.join(dir, "backups", "2026-10-16.json"), "utf8"));
    await writeSharedJobsRaw(ORIGINAL);
    const later = await backupSharedJobs(DAY);
    assert.equal(later.wrote, true);
    assert.equal(await readFile(path.join(dir, "backups", "2026-10-16.json"), "utf8"), ORIGINAL);
  });

  test("restore puts the dated copy back", async () => {
    await writeSharedJobsRaw(ORIGINAL);
    await backupSharedJobs(DAY);
    await writeSharedJobsRaw(REPLACEMENT);
    const restored = await restoreSharedJobs("2026-10-16");
    assert.equal(restored.ok, true);
    assert.equal(await readFile(path.join(dir, "cartscope-jobs.json"), "utf8"), ORIGINAL);
  });

  test("restore rejects a date that is not a real day", async () => {
    const result = await restoreSharedJobs("2026-02-31");
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /YYYY-MM-DD/);
  });

  test("the cron handler does not return job bodies", async () => {
    await writeSharedJobsRaw(ORIGINAL);
    const open = await handleJobsBackupGet(new Request("http://shop.test/api/cron/backup-jobs"));
    assert.equal(open.status, 200);
    assert.equal(open.body.wrote, true);
    assert.equal("jobs" in open.body, false);
    assert.doesNotMatch(JSON.stringify(open.body), /Alvarez/);

    process.env.VERCEL = "1";
    const blocked = await handleJobsBackupGet(new Request("http://shop.test/api/cron/backup-jobs"));
    assert.equal(blocked.status, 401);
    delete process.env.VERCEL;

    process.env.CRON_SECRET = "cron-unit-secret";
    const denied = await handleJobsBackupGet(new Request("http://shop.test/api/cron/backup-jobs"));
    assert.equal(denied.status, 401);
    const allowed = await handleJobsBackupGet(
      new Request("http://shop.test/api/cron/backup-jobs", {
        headers: { authorization: "Bearer cron-unit-secret" },
      }),
    );
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.wrote, false);
  });

  test("the restore script copies the dated file back", async () => {
    const work = await mkdtemp(path.join(tmpdir(), "cartscope-restore-script-"));
    try {
      await mkdir(path.join(work, ".data", "backups"), { recursive: true });
      await writeFile(path.join(work, ".data", "cartscope-jobs.json"), REPLACEMENT, "utf8");
      await writeFile(path.join(work, ".data", "backups", "2026-10-16.json"), ORIGINAL, "utf8");
      const env = { ...process.env };
      delete env.BLOB_READ_WRITE_TOKEN;
      delete env.VERCEL;
      const script = path.join(process.cwd(), "scripts/restore-jobs-backup.mjs");
      const { stdout } = await execFileAsync(
        process.execPath,
        ["--experimental-strip-types", script, "2026-10-16"],
        { cwd: work, env },
      );
      assert.match(stdout, /Restored cartscope-jobs\.json/);
      assert.equal(await readFile(path.join(work, ".data", "cartscope-jobs.json"), "utf8"), ORIGINAL);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });
});

test("the restore script exits 2 without a date", async () => {
  const env = { ...process.env };
  delete env.BLOB_READ_WRITE_TOKEN;
  delete env.VERCEL;
  await assert.rejects(
    execFileAsync(process.execPath, ["--experimental-strip-types", "scripts/restore-jobs-backup.mjs"], { env }),
    (error: NodeJS.ErrnoException & { code?: number }) => error.code === 2,
  );
});
