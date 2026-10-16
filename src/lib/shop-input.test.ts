import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, afterEach, beforeEach, describe, test } from "node:test";
import type { JobRecord } from "../data/types.ts";
import { handleSharedJobsPut } from "./shared-jobs-api.ts";
import { setSharedJobsFilePathForTests } from "./shared-jobs-backend.ts";
import { SHOP_GATE_SECRET_ENV, handleShopGatePost } from "./shop-gate.ts";
import { PACK_ALIAS_IDS, validateAssistantInput } from "./shop-input.ts";

function sampleJob(id = "job_shared_1"): JobRecord {
  return {
    id,
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-21T00:01:00.000Z",
    technician: "Hayden Silva",
    serialNumber: "",
    notes: "",
    modelId: "yamaha-ydre-dc",
    symptomId: "no-operation",
    currentStepId: "yno-split",
    status: "in-progress",
    log: [],
    lastName: "Martinez",
    hcpJobNumber: "HCP-5212",
    cartYear: "2012",
    cartMake: "Yamaha",
    cartModel: "YDRE",
    batteryType: "lead-acid",
    complaintNote: "Dead in the lot",
    fuelNote: "",
    casePhase: "codes",
  };
}

const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
const prevVercel = process.env.VERCEL;
const prevSecret = process.env[SHOP_GATE_SECRET_ENV];
let dir = "";

describe("shop write validation", () => {
  beforeEach(async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
    dir = await mkdtemp(path.join(tmpdir(), "cartscope-input-"));
    setSharedJobsFilePathForTests(path.join(dir, "cartscope-jobs.json"));
  });

  afterEach(async () => {
    setSharedJobsFilePathForTests(null);
    if (prevSecret === undefined) delete process.env[SHOP_GATE_SECRET_ENV];
    else process.env[SHOP_GATE_SECRET_ENV] = prevSecret;
    await rm(dir, { recursive: true, force: true });
  });

  after(() => {
    if (prevToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = prevToken;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  });

  test("a known pack still saves", async () => {
    const precedent = await handleSharedJobsPut({
      jobs: [{ ...sampleJob("job_prec"), modelId: "club-car-precedent-iq" }],
    });
    assert.equal(precedent.status, 200);
    const yamaha = await handleSharedJobsPut({ jobs: [sampleJob("job_ydre")] });
    assert.equal(yamaha.status, 200);
    assert.equal(yamaha.body.wrote, true);
  });

  test("an unknown pack is rejected", async () => {
    const result = await handleSharedJobsPut({
      jobs: [{ ...sampleJob(), modelId: "not-a-real-pack" }],
    });
    assert.equal(result.status, 400);
    assert.match(String(result.body.error), /not in the shop library/);
  });

  test("a shop case that is not an object is rejected", async () => {
    const result = await handleSharedJobsPut({ jobs: ["nope"] });
    assert.equal(result.status, 400);
    assert.match(String(result.body.error), /must be an object/);
  });

  test("a note past the length limit is rejected", async () => {
    const result = await handleSharedJobsPut({
      jobs: [{ ...sampleJob(), complaintNote: "x".repeat(20_001) }],
    });
    assert.equal(result.status, 400);
    assert.match(String(result.body.error), /Complaint is too long/);
  });

  test("a password that is too long or not text is rejected", () => {
    process.env[SHOP_GATE_SECRET_ENV] = "unit-test-shop-secret";
    const request = new Request("http://shop.test/api/shop-gate");
    const long = handleShopGatePost(request, { password: "p".repeat(201) });
    assert.equal(long.status, 400);
    assert.match(String(long.body.error), /Password is too long/);
    const typed = handleShopGatePost(request, { password: 12 });
    assert.equal(typed.status, 400);
    assert.match(String(typed.body.error), /Password must be text/);
    const body = handleShopGatePost(request, []);
    assert.equal(body.status, 400);
    assert.match(String(body.body.error), /must be an object/);
  });

  test("the correct shop password still unlocks", () => {
    process.env[SHOP_GATE_SECRET_ENV] = "unit-test-shop-secret";
    const result = handleShopGatePost(new Request("http://shop.test/api/shop-gate"), {
      password: "unit-test-shop-secret",
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.unlocked, true);
  });

  test("pack aliases stay aligned with the shop library", async () => {
    const src = await readFile(new URL("../data/index.ts", import.meta.url), "utf8");
    const block = src.slice(src.indexOf("const PACK_ALIASES"), src.indexOf("export function getPack"));
    const keys = [...block.matchAll(/"([^"]+)":/g)].map((match) => match[1]).sort();
    assert.deepEqual(keys, [...PACK_ALIAS_IDS].sort());

    const catalog = await readFile(new URL("../data/cart-catalog.ts", import.meta.url), "utf8");
    assert.match(catalog, /id: "club-car-precedent-iq"/);
    assert.match(catalog, /id: "yamaha-ydre-dc"/);
    assert.match(catalog, /id: "club-car-ds-vglide"/);
  });
});

describe("assistant input validation", () => {
  test("a normal question is kept and an unknown pack is rejected", () => {
    const ok = validateAssistantInput({
      question: "  Solenoid clicks  ",
      modelId: "club-car-precedent-iq",
      measurements: [],
      history: [],
      caseBrief: "Last name: Alvarez",
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.value.question, "Solenoid clicks");
      assert.equal(ok.value.caseBrief, "Last name: Alvarez");
    }
    const unknown = validateAssistantInput({
      question: "no start",
      modelId: "not-a-real-pack",
      measurements: [],
      history: [],
    });
    assert.equal(unknown.ok, false);
    if (!unknown.ok) assert.match(unknown.error, /not in the shop library/);
  });

  test("a question over 800 characters is rejected", () => {
    const result = validateAssistantInput({
      question: "q".repeat(801),
      modelId: "yamaha-ydre-dc",
      measurements: [],
      history: [],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /under 800/);
  });

  test("more than eight history turns are still accepted", () => {
    const history = Array.from({ length: 9 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      text: `turn ${index}`,
    }));
    const result = validateAssistantInput({
      question: "next check",
      modelId: "yamaha-ydre-dc",
      measurements: [],
      history,
    });
    assert.equal(result.ok, true);
  });
});
