import assert from "node:assert/strict";
import test from "node:test";
import { brainHandheldName, suggestedHandheldName } from "./handheld.ts";

const job = {
  createdAt: "2026-09-08T12:00:00.000Z",
  lastName: "Smith",
  hcpJobNumber: "17411",
  cartMake: "EZ-GO",
  cartModel: "TXT 48 V TCT",
  symptomId: "no-run",
} as const;

const pack = {
  manufacturer: "ezgo",
  manufacturerLabel: "EZ-GO",
  name: "TXT 48 V TCT",
  symptoms: [{ id: "no-run", label: "Will not run" }],
} as const;

test("device program name uses date last name job number Program", () => {
  assert.equal(suggestedHandheldName(job as never, "Program"), "2026-09-08_Smith_17411_Program");
  assert.equal(suggestedHandheldName(job as never, "Log"), "2026-09-08_Smith_17411_Log");
});

test("unknown parts when last name or job number is missing", () => {
  const blank = { ...job, lastName: "", hcpJobNumber: "" };
  assert.equal(suggestedHandheldName(blank as never, "Program"), "2026-09-08_Unknown_Unknown_Program");
});

test("brain names never include last name or job number", () => {
  const name = brainHandheldName(job as never, pack as never, "Program");
  assert.equal(name, "2026-09-08_EZGO_TXT_NoRun_Program");
  assert.equal(/Smith/i.test(name), false);
  assert.equal(/17411/.test(name), false);
  assert.equal(brainHandheldName(job as never, pack as never, "Log", "foo.cpf"), "2026-09-08_EZGO_TXT_NoRun_Log.cpf");
});
