import assert from "node:assert/strict";
import test from "node:test";
import {
  bayChromeClear,
  bayChromeDispatch,
  bayChromePublish,
  emptyBayChrome,
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
