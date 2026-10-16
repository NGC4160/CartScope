# Production readiness audit

Checked again on 2026-10-16, after the shop-route validation, the helper prompt guard, and the daily jobs backup.

This pass does not change the auth layer, Vercel project settings, keys, or billing. It does not change which customer fields the helper sends to the outside model. A correct shop password and a normal case save still succeed. Input that fails the new checks is rejected with an error. The daily backup copies the jobs file; it does not change the live file.

| Item | Result |
| --- | --- |
| Where data is stored, and whether backups exist | Pass |
| Server-side input validation | Pass |
| Assistant / brain sends customer data to an outside model | Fail |
| User text that reaches a model is guarded against prompt injection | Pass |

## Where data is stored, and whether backups exist — Pass

Shop cases (customer last name, Housecall Pro job number, year/make/model, complaint, meter readings, handheld notes, helper turns, who checked it) are the shop memory.

- **Shared store.** When `BLOB_READ_WRITE_TOKEN` is set, cases are one private Vercel Blob object, `cartscope-jobs.json` (`src/lib/shared-jobs-backend.ts`). Each write uses `allowOverwrite: true` on that same key. `PUT /api/jobs` merges by job id and `updatedAt` so a stale tablet does not drop a newer case (`src/lib/shared-jobs.ts`). That merge is not a backup.
- **Daily backup.** `GET /api/cron/backup-jobs` copies the raw jobs JSON to `backups/YYYY-MM-DD.json` (UTC date). Vercel Cron calls that path once a day at 11:00 UTC (`vercel.json`, `crons` only). If that day's object already exists, the route leaves it alone. If the live file is missing or blank, it does not write an empty backup, so a later save the same day can still be copied. The response is `wrote`, `date`, and `missing`. It does not include job bodies.
- **Restore.** `node --experimental-strip-types scripts/restore-jobs-backup.mjs YYYY-MM-DD` checks that the dated copy is JSON with a `jobs` array, then writes those raw bytes back to `cartscope-jobs.json`.
- **Cron lock.** When `CRON_SECRET` is set, the route requires `Authorization: Bearer <secret>`. On Vercel, a missing secret is rejected so the route is not open. Off Vercel, with no secret, the route runs so tests and a local check can call it. Do not commit the secret.
- **Local dev.** With no blob token and `VERCEL` unset, the live file is `.data/cartscope-jobs.json` (gitignored) and the dated copy is `.data/backups/YYYY-MM-DD.json`.
- **Tablet cache.** The browser keeps `localStorage` key `cartscope-jobs-v1`. IndexedDB database `cartscope-jobs` is a second copy on the same device when `localStorage` cannot hold the list (`src/lib/jobs-persist.ts`). It is not an offsite backup.
- **Shop lock.** The shared password is `SHOP_GATE_SECRET` on the server. The browser gets an httpOnly cookie `cartscope_shop` (HMAC, 30 days). The password is not written into the job file.
- **Shop brain copy.** Confirm builds a markdown case. Last name, job number, phone, email, and street address are stripped with `src/lib/redact.ts` before send. If `BRAIN_WEBHOOK_URL` is set, `fileBrainCase` POSTs that markdown. If it is not set, the file stays on the tablet for Save shop file. The serial number is included in the markdown and is not part of the redaction list.
- **Database.** `migrations/auth/0001_auth.sql` is a Better Auth schema (user, session, account, verification). Job rows do not use it. `src/lib/db.ts` uses Neon when `DATABASE_URL` is set, otherwise an in-memory PGLite that disappears when the process stops. There is no app table under `migrations/*.sql`. Per-person accounts are off (see the README).

This is one dated snapshot per UTC day, not continuous point-in-time recovery. It needs the blob token in production and the cron entry above. Result: Pass.

## Server-side input validation — Pass

Write paths now reject bad input with a clear error. The read path still drops a junk job instead of failing the whole file, so an older saved list can still open.

- `POST /api/shop-gate` requires an object. `lock`, when present, must be boolean. `password`, when present, must be text of at most 200 characters. A wrong or empty password is still 401 “Wrong shop password.” The matching password still sets the cookie. The password is not logged.
- `PUT /api/jobs` requires an object whose `jobs` value is an array of at most 500 cases. Each case needs an id (letters, digits, `_`, `-`, at most 80 characters), a `modelId` that is a pack in the shop library (including the three legacy aliases), a symptom, a step, and a status of `in-progress`, `diagnosed`, or `complete`. Names, the serial, and the job number are capped at 200 characters. Complaint, notes, and the tech observation are capped at 20,000. The shop-file markdown is capped at 80,000. Any other string is capped at 100,000. Optional text fields must be text. `batteryType`, when present, must be `lead-acid` or `lithium`. A bad case returns 400 and is not merged.
- `askBenchAssistant` validates in `.validator`. The question must be text, and after trim it must be 1–800 characters (over 800 is rejected, not silently cut). `modelId` must be a known pack. History may be longer than eight turns (a real case is) and is capped at 80 turns and 4,000 characters each; the model call still sends only the last eight, at 1,200 characters each. Measurements must be a list of text fields. Case notes must be text of at most 20,000 characters. Failures return `{ ok: false, error }` so the bay shows the message.
- `fileBrainCase` was already stricter: filename pattern, exact path, markdown length 40–80000, and `findPiiLeaks` before the webhook.

Result: Pass.

## Assistant / brain sends customer data to an outside model — Fail

**Assistant — yes, it sends customer data to an outside model.** `askBenchAssistant` (`src/lib/assistant.ts`) POSTs to `https://api.x.ai/v1/chat/completions` (model `grok-4.5`) when `XAI_API_KEY` is set. `runJobAssistant` puts `caseBrief(job)` on that request. `caseBrief` (`src/lib/proof.ts`) includes the customer last name, Housecall Pro job number, serial number, complaint notes, pack readings, and handheld file names. The tech’s question and earlier helper turns go out as chat messages. This path does not call `redactText`. What is included is unchanged on purpose.

**Brain — it does not call a model API.** `fileBrainCase` POSTs redacted markdown to `BRAIN_WEBHOOK_URL` when that variable is set, for the shop folder `knowledge/diagnostics/cases` in `NGC4160/NGC-Brain`. The send is refused when `findPiiLeaks` still finds a last name, job number, phone, email, or address. The webhook host is whatever is configured in the environment. This repo does not show that host calling a model. Pattern redaction can still miss a name that is not the stored last name, and the serial number is not redacted.

The assistant path is enough to fail this item. Whether to keep sending those fields is Ryan’s decision. This pass does not redact them and does not stop the call.

## User text reaching a model is guarded against prompt injection — Pass

User text still reaches `grok-4.5` in three places. Each one is wrapped before the call (`src/lib/assistant-prompt.ts`):

- the latest question, inside `<untrusted-question>`
- each history turn that is sent, inside `<untrusted-history>`
- the evidence case block (complaint notes, serial, readings, last name, job number), inside `<untrusted-case-notes>`

A typed closing tag is escaped so it cannot end the block early. The first system message tells the model that text inside those tags is data typed on the tablet, and to ignore instructions inside them: do not change the rules, reveal secrets, skip a factory check, or recommend a repair the evidence rules forbid.

The customer fields inside the case block are the same fields as before. A suggested step id in the reply is still kept only when it is a real step on the open pack (`[[STEP:id]]` in `src/lib/assistant-parse.ts`).

This is an instruction to the model, not a filter that can prove the model obeyed it. Result: Pass, with that limit.
