import assert from "node:assert/strict";
import test from "node:test";
import {
  bayChromeClear,
  bayChromeDispatch,
  bayChromePublish,
  bayFormSubmitGate,
  createBaySubmitGate,
  createBaySubmitSlot,
  emptyBayChrome,
  fireBaySave,
  requestBayFormSubmit,
} from "./bay-chrome-action.ts";

test("sticky Save fires the latest published handler, not a stale one", () => {
  const calls: string[] = [];
  let snap = emptyBayChrome();
  snap = bayChromePublish(snap, {
    chip: "Pack",
    label: "Save pack and go on",
    onAction: () => calls.push("pack"),
  });
  snap = bayChromePublish(snap, {
    chip: "Check 1 of 8",
    label: "Save and go on",
    onAction: () => calls.push("step"),
  });
  assert.equal(bayChromeDispatch(snap), true);
  assert.deepEqual(calls, ["step"]);
});

test("unmount onChrome(null) after the next panel published must not drop Save", () => {
  const calls: string[] = [];
  let snap = emptyBayChrome();
  snap = bayChromePublish(snap, {
    chip: "Pack",
    label: "Save pack and go on",
    onAction: () => calls.push("pack"),
  });
  const packSeq = snap.seq;
  snap = bayChromePublish(snap, {
    chip: "Codes",
    label: "Save codes and go on",
    onAction: () => calls.push("codes"),
  });
  snap = bayChromeClear(snap, packSeq);
  assert.equal(snap.meta?.chip, "Codes");
  assert.equal(bayChromeDispatch(snap), true);
  assert.deepEqual(calls, ["codes"]);
});

test("a bare clear with no token is ignored so effect cleanups cannot wipe the bar", () => {
  const calls: string[] = [];
  let snap = emptyBayChrome();
  snap = bayChromePublish(snap, {
    chip: "Pack",
    label: "Save pack and go on",
    onAction: () => calls.push("pack"),
  });
  snap = bayChromeClear(snap);
  assert.equal(snap.meta?.label, "Save pack and go on");
  assert.equal(bayChromeDispatch(snap), true);
  assert.deepEqual(calls, ["pack"]);
});

test("dispatch is a no-op when no save handler is published", () => {
  assert.equal(bayChromeDispatch(emptyBayChrome()), false);
});

test("submit slot always fires the latest bind, even after a fake effect clear", () => {
  const slot = createBaySubmitSlot();
  const calls: string[] = [];
  slot.bind(() => calls.push("pack"));
  slot.bind(() => calls.push("codes"));
  assert.equal(slot.hasHandler(), true);
  assert.equal(slot.fire(), true);
  assert.deepEqual(calls, ["codes"]);
});

test("submit gate lets the first save through and blocks the duplicate click", () => {
  const gate = createBaySubmitGate(400);
  const calls: string[] = [];
  assert.equal(
    gate.run(() => calls.push("one")),
    true,
  );
  assert.equal(
    gate.run(() => calls.push("two")),
    false,
  );
  assert.deepEqual(calls, ["one"]);
});

test("submit gate keys leftover clicks by form so Report confirm is not blocked", () => {
  const gate = createBaySubmitGate(400);
  const calls: string[] = [];
  assert.equal(
    gate.run(() => calls.push("pack"), "bay-check-form"),
    true,
  );
  assert.equal(
    gate.run(() => calls.push("codes"), "bay-check-form"),
    false,
  );
  assert.equal(
    gate.run(() => calls.push("report"), "bay-report-form"),
    true,
  );
  assert.deepEqual(calls, ["pack", "report"]);
});

test("shared Save gate is not the Start hook", () => {
  assert.equal(typeof bayFormSubmitGate.run, "function");
});

test("requestBayFormSubmit uses the live form and ignores a no-op chrome fallback", () => {
  const submitted: string[] = [];
  const form = {
    requestSubmit() {
      submitted.push("form");
    },
  };
  const doc = {
    getElementById(id: string) {
      return id === "bay-check-form" ? form : null;
    },
  } as unknown as Document;
  assert.equal(requestBayFormSubmit(doc, "bay-check-form"), true);
  assert.deepEqual(submitted, ["form"]);
  assert.equal(
    fireBaySave({
      fire: () => {
        submitted.push("slot");
        return true;
      },
      fallback: () => submitted.push("fallback"),
      formId: "bay-check-form",
      document: doc,
    }),
    true,
  );
  assert.deepEqual(submitted, ["form", "slot"]);
});

test("sticky Save runs the bound handler even when requestSubmit is a silent no-op", () => {
  const submitted: string[] = [];
  const form = {
    requestSubmit() {
      submitted.push("form");
    },
  };
  const doc = {
    getElementById(id: string) {
      return id === "bay-check-form" ? form : null;
    },
  } as unknown as Document;
  assert.equal(
    fireBaySave({
      fire: () => {
        submitted.push("slot");
        return true;
      },
      fallback: () => submitted.push("fallback"),
      formId: "bay-check-form",
      document: doc,
    }),
    true,
  );
  assert.deepEqual(submitted, ["slot"]);
});

test("sticky Save falls back to chrome onAction when no slot is bound", () => {
  const submitted: string[] = [];
  assert.equal(
    fireBaySave({
      fallback: () => submitted.push("chrome"),
    }),
    true,
  );
  assert.deepEqual(submitted, ["chrome"]);
});

test("submit slot logs and returns false when Save is tapped with no handler", () => {
  const slot = createBaySubmitSlot();
  const warns: string[] = [];
  const orig = console.warn;
  console.warn = (msg) => {
    warns.push(String(msg));
  };
  try {
    assert.equal(slot.hasHandler(), false);
    assert.equal(slot.fire(), false);
    assert.equal(fireBaySave({}), false);
  } finally {
    console.warn = orig;
  }
  assert.ok(warns.some((w) => /sticky Save tapped with no handler/.test(w)));
});
