# CartScope

Neighborhood Golf Carts shop bench — tablet-first golf-cart diagnostics.

Step-by-step checks from the factory books: battery pack first, then codes (programmer carts), then factory tests, then a written report. Evidence before parts. Last name and HCP job number on every case. Jobs stay on the device.

## What it covers

24 model packs: EZ-GO (TXT 48 V, TXT DCS, TXT gas, PDS 36, RXV, Marathon gas, Express S4), Club Car (DS electric / IQ / PD Plus / V-Glide / gas / FE290, Precedent IQ / Excel / ERIC / gas, Tempo ERIC / gas, Villager IQ Plus / gas), Yamaha (G29, YDRA, YDRE AC).

- Wiring library and print sheets
- AI helper (server-side; uses `XAI_API_KEY` if set)
- Pack check with resting volts, internal resistance, and month/year age on lead-acid
- Handheld Program + Log capture on programmer carts
- Redacted shop-brain copy on report confirm (no last name, job number, phone, address, or email)

Auth and a shared database are **off**. Cases persist in the browser (`cartscope-jobs-v1`).

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

Set `XAI_API_KEY` in the environment for the diagnostic assistant. Optional shop-brain filing:

- `BRAIN_WEBHOOK_URL` — POST the redacted markdown
- `BRAIN_WEBHOOK_SECRET` — optional HMAC

Do not put a GitHub token in the app. Do not commit secrets.

## Shop flow

1. Start a cart check → year / make / model / complaint.
2. Last name + HCP job number (required). Battery type required if electric.
3. Pack check (electric) → codes (programmer carts) → factory steps → report.
4. Confirm the report: full case stays on the device; a redacted copy is queued or sent for the shop brain.

Copy is written for the bay. Factory numbers stay as in the book.

## License

Internal shop tool for Neighborhood Golf Carts. Factory manuals and extracted wiring sheets remain the publishers’ property; use only as your shop is licensed to use them.
