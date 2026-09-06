import assert from "node:assert/strict";
import test from "node:test";
import type { DiagnosticStep, ModelPack } from "../data/types.ts";
import { fallbackHelperJumps, localHelperJumps, mergeHelperJumps, resolveHelperJumps, settleHelperAsk } from "./helper-redirect.ts";

function step(id: string, title: string, instruction: string): DiagnosticStep {
  return {
    id,
    title,
    instruction,
    manualRef: "Book",
    highlight: [],
    measurement: { kind: "observation", prompt: title, meterSetup: "", expectedLabel: "ok" },
    pass: { kind: "step", id },
    fail: { kind: "step", id },
  };
}

const iq = {
  id: "fake-iq",
  steps: {
    "pno-setup": step("pno-setup", "Set the switches", "Tow/run in run."),
    "pno-fr": step(
      "pno-fr",
      "Direction switch rocker (book test 15)",
      "Set the direction switch (F&R) to Forward. Repeat in Reverse.",
    ),
  },
} as unknown as ModelPack;

const gas = {
  id: "fake-gas",
  steps: {
    "g-setup": step("g-setup", "Set the cart up first", "Put the direction switch in Neutral."),
    "g-click": step(
      "g-click",
      "Starter solenoid click",
      "Listen at the starter solenoid. Click with no crank is the metal pads or starter.",
    ),
  },
} as unknown as ModelPack;

test("direction-switch observation offers the F&R factory check", () => {
  const hits = localHelperJumps(iq, "direction switch stuck in reverse", "pno-setup");
  assert.ok(
    hits.some((s) => s.id === "pno-fr"),
    hits.map((s) => s.id).join(","),
  );
});

test("solenoid click / no crank offers the gas solenoid check", () => {
  const hits = localHelperJumps(gas, "solenoid clicks but the starter does not crank", "g-setup");
  assert.ok(
    hits.some((s) => s.id === "g-click"),
    hits.map((s) => s.id).join(","),
  );
});

test("AI title in the notes still produces a jump when [[STEP]] is missing", () => {
  const hits = mergeHelperJumps({
    pack: iq,
    observation: "only runs one way",
    currentStepId: "pno-setup",
    replyText: "Go to the Direction switch rocker (book test 15) next.",
  });
  assert.ok(
    hits.some((s) => s.id === "pno-fr"),
    hits.map((s) => s.id).join(","),
  );
});

test("charge slang still offers a charger check when already on Not fully charged", () => {
  const charged = {
    id: "fake-pd48",
    symptoms: [
      { id: "not-charging", startStepId: "dchg" },
      { id: "no-operation", startStepId: "dno-setup" },
    ],
    steps: {
      dchg: step("dchg", "Not fully charged", "Book symptom 6. Check the charger output."),
      "dno-setup": step("dno-setup", "Set the switches", "Unplug the charger."),
      dwarn: step("dwarn", "Battery warning light on", "Below 25 % charge. Check the charger DC cord."),
    },
  } as unknown as ModelPack;
  const hits = localHelperJumps(charged, "won't charge — pack not fully charged", "dchg");
  assert.ok(
    hits.some((s) => s.id === "dwarn" || s.id === "dno-setup"),
    hits.map((s) => s.id).join(","),
  );
});

test("empty keyword match still offers other factory checks after a timeout", () => {
  const hits = resolveHelperJumps({
    pack: {
      ...gas,
      symptoms: [
        { startStepId: "g-setup" },
        { startStepId: "g-click" },
      ],
    } as unknown as ModelPack,
    observation: "n/a",
    currentStepId: "g-setup",
  });
  assert.ok(
    hits.some((s) => s.id === "g-click"),
    hits.map((s) => s.id).join(","),
  );
  assert.equal(
    fallbackHelperJumps(gas, "g-setup").some((s) => s.id === "g-click"),
    true,
  );
});

test("helper ask finishes on timeout and keeps going", async () => {
  const started = Date.now();
  const settled = await settleHelperAsk(new Promise(() => {}), 40);
  assert.equal(settled.ok, false);
  if (!settled.ok) {
    assert.equal(settled.timedOut, true);
    assert.match(settled.error, /too long/i);
  }
  assert.ok(Date.now() - started < 500);
});
