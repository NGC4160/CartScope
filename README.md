# CartScope

Neighborhood Golf Carts shop bench — tablet-first golf-cart diagnostics.

Step-by-step checks from the factory books: battery pack first, then codes (programmer carts), then factory tests, then a written report. Evidence before parts. Last name and HCP job number on every case. Diagnostic case files sync across shop devices.

## What it covers

35 model packs: EZ-GO (TXT 48 V, TXT DCS, TXT gas, PDS 36, RXV, Marathon gas, Express S4 / L6 / S6), Club Car (DS electric / IQ / PD Plus / V-Glide / gas / FE290, Precedent IQ / Excel / ERIC / gas, Tempo ERIC / gas, Villager IQ Plus / gas), Yamaha (G29, YDRA, YDRE AC, YTF1), Star EV Sirius, Tomberlin EMerge (GE403 / Curtis 1268 / Sevcon Gen4), Evolution (AC Drive 1232SE / D5), Bad Boy Curtis 1232E/SE.

- Wiring library and print sheets
- AI helper (server-side; uses `XAI_API_KEY` if set)
- Pack check with resting volts, internal resistance, and month/year age on lead-acid
- Handheld Program + Log capture on programmer carts
- Redacted shop-brain copy on report confirm (no last name, job number, phone, address, or email)

Auth and Housecall Pro sync are **off**. Case files (customer last name, HCP job number, year/make/model, complaint, meter readings, code saves, Helper observations, Who checked it, pack type, stamps) are the shop memory. They live in a shared Vercel Blob store and cache on the tablet (`cartscope-jobs-v1`) so a flaky network does not wipe a bay session.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default port 8080).

```bash
npm run build
npm run preview
```

```bash
npm run typecheck
```

Set `XAI_API_KEY` in the environment for the diagnostic assistant. Shared case files need `BLOB_READ_WRITE_TOKEN` on Vercel (Storage → Blob → connect to **cart-scope**, Production + Preview). See `.env.example`. Until that token is present, each tablet keeps today’s per-browser `localStorage` behavior and `GET /api/jobs` reports the store as unconfigured.

Optional shop-brain filing:

- `BRAIN_WEBHOOK_URL` — POST the redacted markdown
- `BRAIN_WEBHOOK_SECRET` — optional HMAC

Local `npm run dev` without Blob uses `.data/cartscope-jobs.json` (gitignored) so two browser profiles on one machine share the same file.

Do not put a GitHub token in the app. Do not commit secrets.

## Shared shop memory

Same pattern as the shop board: one private JSON blob (`cartscope-jobs.json`) behind `GET` / `PUT /api/jobs`.

1. Paint the tablet cache (`localStorage` / IndexedDB).
2. `GET /api/jobs`. If a snapshot exists, replace the job list.
3. If the store is empty and this tablet already has cases, upload that list **once** (`migrate: true`). The server ignores a second migrate so two tablets cannot overwrite each other.
4. Saves write the tablet cache first, then write-through to the shared store (last write wins). A dropped network leaves the bay session on this tablet.

Housecall Pro is not synced from CartScope. Who checked it / Helper / observation rules are unchanged.

## Shop flow

1. Start a cart check → year / make / model / complaint.
2. Last name + HCP job number (required). Battery type required if electric.
3. Pack check (electric) → codes (programmer carts) → factory steps → report.
4. Confirm the report: the full case stays in the shared shop store (and on this tablet as a cache); a redacted copy is queued or sent for the shop brain.

Copy is written for the bay. Factory numbers stay as in the book.

## License

Internal shop tool for Neighborhood Golf Carts. Factory manuals and extracted wiring sheets remain the publishers’ property; use only as your shop is licensed to use them.
