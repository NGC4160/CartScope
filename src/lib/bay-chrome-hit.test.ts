import assert from "node:assert/strict";
import test from "node:test";
import { bayChromeReservedRect, bayPrimaryTapPoint, isBaySaveStealTarget, pointHitsBaySave, pointInRect } from "./bay-chrome-hit.ts";

test("bay tech tap is on the Save label, left of the chat pill", () => {
  const tap = bayPrimaryTapPoint({ x: 0, y: 0, width: 400, height: 50 });
  assert.equal(tap.x, 160);
  assert.equal(tap.y, 25);
});

test("full-width Save puts the tester tap on the control, not a padded dead zone", () => {
  const bar = { x: 16, y: 720, width: 992, height: 48 };
  const tap = bayPrimaryTapPoint(bar);
  assert.equal(pointInRect(tap, bar), true);
  assert.ok(tap.x < bar.x + bar.width * 0.5);
  assert.ok(tap.x > bar.x + bar.width * 0.2);
});

test("a tap on the Grok pill that overlaps the Save row still counts as Save", () => {
  const viewport = { width: 1024, height: 768 };
  const bar = { x: 16, y: 700, width: 992, height: 56 };
  const reserved = bayChromeReservedRect(viewport);
  const onPillOverSave = { x: reserved.x + 20, y: bar.y + 28 };
  assert.equal(pointHitsBaySave(onPillOverSave, bar, viewport), true);
  assert.equal(pointHitsBaySave(bayPrimaryTapPoint(bar), bar, viewport), true);
});

test("steal Save from the bar or Grok pill, never from an observation pick", () => {
  const bar = { closest: (sel: string) => (sel.includes("bay-action-bar") ? {} : null) };
  const pill = { closest: (sel: string) => (sel.includes("grok-pill") ? {} : null) };
  const pick = {
    closest: (sel: string) => (sel === "button" ? {} : null),
  };
  const field = { closest: (sel: string) => (sel.includes("input") ? {} : null) };
  assert.equal(isBaySaveStealTarget(bar as unknown as Element), true);
  assert.equal(isBaySaveStealTarget(pill as unknown as Element), true);
  assert.equal(isBaySaveStealTarget(pick as unknown as Element), false);
  assert.equal(isBaySaveStealTarget(field as unknown as Element), false);
});

test("a Grok-pill tap well above the Save row is not Save (Helper jump zone)", () => {
  const viewport = { width: 1024, height: 768 };
  const bar = { x: 16, y: 730, width: 992, height: 36 };
  const reserved = bayChromeReservedRect(viewport);
  const aboveBar = { x: reserved.x + 20, y: reserved.y + 4 };
  assert.ok(aboveBar.y < bar.y - 12);
  assert.equal(pointHitsBaySave(aboveBar, bar, viewport), false);
});
