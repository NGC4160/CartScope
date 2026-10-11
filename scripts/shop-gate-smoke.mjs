#!/usr/bin/env node
/**
 * Prove unauthenticated page/API requests cannot read or replace shop jobs.
 * Does not send a valid job-list PUT (never writes the live store).
 *
 * Usage: node scripts/shop-gate-smoke.mjs [baseUrl]
 */
const base = (process.argv[2] ?? "http://127.0.0.1:8080").replace(/\/$/, "");

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function leaksJobs(text) {
  return /"jobs"\s*:|"lastName"|"hcpJobNumber"/.test(text);
}

async function read(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    cache: "no-store",
    redirect: "manual",
    ...init,
  });
  const text = await response.text();
  return { status: response.status, text, type: response.headers.get("content-type") ?? "" };
}

const jobsGet = await read("/api/jobs");
assert(
  jobsGet.status === 401 || jobsGet.status === 503,
  `GET /api/jobs should be 401 or 503, got ${jobsGet.status}`,
);
assert(!leaksJobs(jobsGet.text), "GET /api/jobs leaked job fields without a shop session");

const gateGet = await read("/api/shop-gate");
assert(
  gateGet.status === 401 || gateGet.status === 503,
  `GET /api/shop-gate should be 401 or 503, got ${gateGet.status}`,
);
assert(!leaksJobs(gateGet.text), "GET /api/shop-gate leaked job fields");

const jobsPut = await read("/api/jobs", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: "not-json",
});
assert(
  jobsPut.status === 401 || jobsPut.status === 503,
  `PUT /api/jobs without a session should be 401 or 503, got ${jobsPut.status}`,
);
assert(!leaksJobs(jobsPut.text), "PUT /api/jobs leaked job fields without a shop session");

const home = await read("/");
assert(home.status === 200, `GET / should be 200, got ${home.status}`);
assert(
  /Unlock this tablet|Opening the shop lock|SHOP LOCK|Shop lock is not set/i.test(home.text),
  "Home page did not render the shop lock",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      base,
      jobsGet: jobsGet.status,
      shopGateGet: gateGet.status,
      jobsPut: jobsPut.status,
    },
    null,
    2,
  ),
);
