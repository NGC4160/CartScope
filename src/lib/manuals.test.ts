import assert from "node:assert/strict";
import test from "node:test";
import { manualsOnFile, matchObservationToSteps, matchStepsFromReply } from "./manuals.ts";
import type { ModelPack } from "../data/types.ts";

const fake = {
  id: "test-cart",
  fullName: "Test cart",
  years: "2020",
  diagramTitle: "Factory procedure",
  diagramNotes: ["Use the book first."],
  symptoms: [],
  steps: {
    "t-sol": {
      id: "t-sol",
      title: "Solenoid coil",
      instruction: "Measure solenoid coil ohms.",
      manualRef: "Book TP 3",
      highlight: [],
      measurement: { kind: "resistance", prompt: "coil ohms", meterSetup: "", expectedLabel: "180–190 Ω" },
      pass: { kind: "step", id: "t-sol" },
      fail: { kind: "step", id: "t-sol" },
    },
    "t-setup": {
      id: "t-setup",
      title: "Set the switches",
      instruction: "Tow/run in run.",
      manualRef: "Book setup",
      highlight: [],
      measurement: { kind: "observation", prompt: "ready", meterSetup: "", expectedLabel: "set" },
      pass: { kind: "step", id: "t-sol" },
      fail: { kind: "step", id: "t-sol" },
    },
    "t-fr": {
      id: "t-fr",
      title: "Direction switch rocker (book test 15)",
      instruction: "Set the direction switch (F&R) to Forward. Repeat in Reverse.",
      manualRef: "Book TP 15",
      highlight: [],
      measurement: { kind: "observation", prompt: "in gear", meterSetup: "", expectedLabel: "closed" },
      pass: { kind: "step", id: "t-sol" },
      fail: { kind: "step", id: "t-sol" },
    },
  },
  diagnoses: {},
  components: [],
  wires: [],
  testPoints: [],
} as unknown as ModelPack;

test("pack with procedures is on file", () => {
  const cov = manualsOnFile(fake);
  assert.equal(cov.onFile, true);
  assert.match(cov.summary, /on file/i);
});

test("empty pack says no service manual is on file", () => {
  const empty = {
    ...fake,
    diagramTitle: "",
    diagramNotes: [],
    steps: {},
  } as unknown as ModelPack;
  const cov = manualsOnFile(empty);
  assert.equal(cov.onFile, false);
  assert.match(cov.summary, /No service manual is on file/);
});

test("observation can point at a different factory check", () => {
  const hits = matchObservationToSteps(fake, "solenoid coil ohms reading", "t-setup");
  assert.equal(hits[0]?.id, "t-sol");
});

test("one strong keyword is enough to offer a solenoid check", () => {
  const hits = matchObservationToSteps(fake, "solenoid is clicking", "t-setup");
  assert.equal(hits[0]?.id, "t-sol");
});

test("direction-switch slang jumps to the rocker check", () => {
  const hits = matchObservationToSteps(fake, "direction switch is stuck", "t-setup");
  assert.ok(hits.some((s) => s.id === "t-fr"), hits.map((s) => s.id).join(","));
});

test("helper notes without a STEP marker still name a factory check", () => {
  const hits = matchStepsFromReply(fake, "Next do Direction switch rocker (book test 15).", "t-setup");
  assert.ok(hits.some((s) => s.id === "t-fr"));
});
