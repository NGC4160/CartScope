#!/usr/bin/env node
/**
 * Copy one dated jobs backup back onto cartscope-jobs.json.
 *
 *   node --experimental-strip-types scripts/restore-jobs-backup.mjs YYYY-MM-DD
 *
 * Uses the same store as the app: the private blob when BLOB_READ_WRITE_TOKEN
 * is set, otherwise .data/cartscope-jobs.json. Does not print job contents.
 */
import { restoreSharedJobs } from "../src/lib/jobs-backup.ts";

const date = process.argv[2];
if (!date || process.argv.length !== 3) {
  console.error("Usage: node --experimental-strip-types scripts/restore-jobs-backup.mjs YYYY-MM-DD");
  process.exit(2);
}

const result = await restoreSharedJobs(date);
if (!result.ok) {
  console.error(result.error);
  process.exit(1);
}
console.log(`Restored cartscope-jobs.json from backups/${date}.json`);
