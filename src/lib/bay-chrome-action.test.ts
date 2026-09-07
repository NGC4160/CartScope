import assert from "node:assert/strict";
import test from "node:test";
import {
  bayChromeClear,
  bayChromeDispatch,
  bayChromePublish,
  bayFormSubmitGate,
  createBayGesture,
  createBaySubmitGate,
  createBaySubmitSlot,
  emptyBayChrome,
  fireBaySave,
  fireBaySaveOutcome,
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

test("gesture gate only dedups the same Save tap, not a later tap", async () => {
  const gesture = createBayGesture(50);
  const calls: string[] = [];
  assert.equal(
    gesture.run(() => calls.push("pointerup")),
    true,
  );
  assert.equal(
    gesture.run(() => calls.push("click")),
    false,
  );
  assert.deepEqual(calls, ["pointerup"]);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(
    gesture.run(() => calls.push("later-tap")),
    true,
  );
  assert.deepEqual(calls, ["pointerup", "later-tap"]);
});

test("a leftover form submit must not block the next sticky Save tap", () => {
  const formGate = createBaySubmitGate(400);
  const buttonGesture = createBayGesture(350);
  const calls: string[] = [];
  formGate.run(() => calls.push("enter-submit"), "bay-check-form");
  assert.equal(
    buttonGesture.run(() => calls.push("sticky-tap")),
    true,
  );
  assert.deepEqual(calls, ["enter-submit", "sticky-tap"]);
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

test("sticky Save runs the bound pack/check handler even when requestSubmit is a silent no-op", () => {
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
        submitted.push("pack-or-check");
        return true;
      },
      fallback: () => submitted.push("fallback"),
      formId: "bay-check-form",
      document: doc,
    }),
    true,
  );
  assert.deepEqual(submitted, ["pack-or-check"]);
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

test("requestSubmit returning true is not treated as Save having run", () => {
  const submitted: string[] = [];
  const form = {
    requestSubmit() {
      submitted.push("form");
    },
  };
  const doc = {
    getElementById() {
      return form;
    },
  } as unknown as Document;
  assert.equal(
    fireBaySave({
      formId: "bay-check-form",
      document: doc,
    }),
    false,
  );
  assert.deepEqual(submitted, ["form"]);
});

test("submit slot returns false when the bound handler throws", () => {
  const slot = createBaySubmitSlot();
  slot.bind(() => {
    throw new Error("pack save exploded");
  });
  const warns: string[] = [];
  const orig = console.warn;
  console.warn = (msg) => {
    warns.push(String(msg));
  };
  try {
    assert.equal(slot.fire(), false);
  } finally {
    console.warn = orig;
  }
  assert.ok(warns.some((w) => /sticky Save handler failed/.test(w)));
});

test("submit slot reports a block reason without treating Save as a miss", () => {
  const slot = createBaySubmitSlot();
  slot.bind(
    () =>
      "Save is waiting. Tap “Setup is right — keep going” or “A switch or cable is wrong”. Then Save can go on.",
  );
  const out = slot.outcome();
  assert.equal(out.ran, true);
  assert.match(out.blocked ?? "", /Setup is right — keep going/);
  assert.equal(slot.fire(), true);
  const fired = fireBaySaveOutcome({ fire: slot.outcome });
  assert.equal(fired.ran, true);
  assert.match(fired.blocked ?? "", /A switch or cable is wrong/);
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
