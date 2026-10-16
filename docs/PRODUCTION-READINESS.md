# Production readiness audit

Audit only. This note does not change shop behavior, the auth layer, Vercel settings, keys, or billing.

Checked against the tree on 2026-10-16.

| Item | Result |
| --- | --- |
| Where data is stored, and whether backups exist | Fail |
| Server-side input validation | Fail |
| Assistant / brain sends customer data to an outside model | Fail |
| User text that reaches a model is guarded against prompt injection | Fail |

## Where data is stored, and whether backups exist — Fail

Shop cases (customer last name, Housecall Pro job number, year/make/model, complaint, meter readings, handheld notes, helper turns, who checked it) are the shop memory.

- **Shared store.** When `BLOB_READ_WRITE_TOKEN` is set, cases are one private Vercel Blob object, `cartscope-jobs.json` (`src/lib/shared-jobs-backend.ts`). Each write uses `allowOverwrite: true` on that same key. `PUT /api/jobs` merges by job id and `updatedAt` so a stale tablet does not drop a newer case (`src/lib/shared-jobs.ts`). That merge is not a backup.
- **Local dev.** With no blob token and `VERCEL` unset, the same JSON file is `.data/cartscope-jobs.json` (gitignored).
- **Tablet cache.** The browser keeps `localStorage` key `cartscope-jobs-v1`. IndexedDB database `cartscope-jobs` is a second copy on the same device when `localStorage` cannot hold the list (`src/lib/jobs-persist.ts`). It is not an offsite backup.
- **Shop lock.** The shared password is `SHOP_GATE_SECRET` on the server. The browser gets an httpOnly cookie `cartscope_shop` (HMAC, 30 days). The password is not written into the job file.
- **Shop brain copy.** Confirm builds a markdown case. Last name, job number, phone, email, and street address are stripped with `src/lib/redact.ts` before send. If `BRAIN_WEBHOOK_URL` is set, `fileBrainCase` POSTs that markdown. If it is not set, the file stays on the tablet for Save shop file. The serial number is included in the markdown and is not part of the redaction list.
- **Database.** `migrations/auth/0001_auth.sql` is a Better Auth schema (user, session, account, verification). Job rows do not use it. `src/lib/db.ts` uses Neon when `DATABASE_URL` is set, otherwise an in-memory PGLite that disappears when the process stops. There is no app table under `migrations/*.sql`. Per-person accounts are off (see the README).

This repo has no dump, replica, point-in-time snapshot, or previous-version blob. A Blob or Neon backup that exists only in the hosting dashboard is not defined here. Result: Fail.

## Server-side input validation — Fail

What the server checks today:

- `POST /api/shop-gate` parses JSON. `lock: true` clears the cookie. Otherwise `password` must be a string and match `SHOP_GATE_SECRET` with a timing-safe compare (`src/lib/shop-gate.ts`). There is no length cap and no schema.
- `PUT /api/jobs` rejects a non-object body. `parseSharedJobsDocument` keeps jobs with a non-empty `id`, `modelId`, `symptomId`, `currentStepId`, and a known status, then clones the rest with `JSON.parse(JSON.stringify(...))`. Notes, names, and extra keys are not length-limited. `modelId` is not checked against a known pack. Bad jobs are dropped, not rejected.
- `askBenchAssistant` uses `.validator((input) => input)`. The handler trims the question to 800 characters and keeps the last 8 history turns at 1200 characters each. Measurements, model id, and the case brief are not schema-checked.
- `fileBrainCase` is stricter: filename pattern, exact path, markdown length 40–80000, and `findPiiLeaks` before the webhook.

There is no shared schema (the app depends on zod, and the shop routes do not use it for these bodies). Result: Fail.

## Assistant / brain sends customer data to an outside model — Fail

**Assistant — yes, it sends customer data to an outside model.** `askBenchAssistant` (`src/lib/assistant.ts`) POSTs to `https://api.x.ai/v1/chat/completions` (model `grok-4.5`) when `XAI_API_KEY` is set. `runJobAssistant` puts `caseBrief(job)` on that request. `caseBrief` (`src/lib/proof.ts`) includes the customer last name, Housecall Pro job number, serial number, complaint notes, pack readings, and handheld file names. The tech’s question and earlier helper turns go out as chat messages. This path does not call `redactText`.

**Brain — it does not call a model API.** `fileBrainCase` POSTs redacted markdown to `BRAIN_WEBHOOK_URL` when that variable is set, for the shop folder `knowledge/diagnostics/cases` in `NGC4160/NGC-Brain`. The send is refused when `findPiiLeaks` still finds a last name, job number, phone, email, or address. The webhook host is whatever is configured in the environment. This repo does not show that host calling a model. Pattern redaction can still miss a name that is not the stored last name, and the serial number is not redacted.

The assistant path is enough to fail this item.

## User text reaching a model is guarded against prompt injection — Fail

User text reaches `grok-4.5` in three places:

- the latest question, as a `user` message, cut to 800 characters
- up to eight earlier turns, as `user` or `assistant` messages
- free text inside the second `system` message (the evidence case block: complaint notes, serial, readings, and the question history’s case brief)

The system prompt tells the model how to answer a shop check. It does not say that the question, the history, or the case block is untrusted, and it does not tell the model to ignore instructions written inside that text. A suggested step id in the reply is kept only when it is a real step on the open pack (`[[STEP:id]]` in `src/lib/assistant-parse.ts`). That limits one jump. It does not stop the model from following instructions that were typed into the complaint or the question. Result: Fail.
