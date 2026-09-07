import assert from "node:assert/strict";
import test from "node:test";
import {
  BAY_CHROME_CLEARANCE,
  BAY_CHROME_CLEARANCE_CLASS,
  bayChromeReservedRect,
  bayClearanceBox,
  bayPrimaryTapPoint,
  bayTapClearsChrome,
  pointInRect,
} from "./bay-chrome-hit.ts";

test("bay tech tap is the lower-right of the sticky control", () => {
  const tap = bayPrimaryTapPoint({ x: 0, y: 0, width: 400, height: 50 });
  assert.equal(tap.x, 340);
  assert.equal(tap.y, 35);
});

test("reserved chrome is the live lower-right Grok zone", () => {
  const reserved = bayChromeReservedRect({ width: 1024, height: 768 });
  assert.equal(reserved.width, BAY_CHROME_CLEARANCE.rightPx);
  assert.equal(reserved.height, BAY_CHROME_CLEARANCE.bottomPx);
  assert.equal(reserved.x, 1024 - 184);
  assert.equal(reserved.y, 768 - 80);
  assert.equal(BAY_CHROME_CLEARANCE_CLASS, "bay-chrome-clearance");
});

test("a full-width Save sitting on the viewport bottom fails the tap", () => {
  const viewport = { width: 1024, height: 768 };
  const saveOnFloor = { x: 600, y: 720, width: 424, height: 48 };
  assert.equal(bayTapClearsChrome(saveOnFloor, viewport), false);
  assert.equal(pointInRect(bayPrimaryTapPoint(saveOnFloor), bayChromeReservedRect(viewport)), true);
});

test("padding the bar out of the chrome zone makes the same tap hit Save", () => {
  const viewport = { width: 1024, height: 768 };
  const bar = { x: 600, y: 640, width: 424, height: 128 };
  const clear = bayClearanceBox(bar, viewport);
  const save = { x: clear.x, y: clear.y, width: clear.width, height: 48 };
  assert.ok(save.width >= 44);
  assert.equal(bayTapClearsChrome(save, viewport), true);
});

test("Start on the lower-right of the header fails; inset Start clears chrome", () => {
  const viewport = { width: 1024, height: 768 };
  const startOnPill = { x: 820, y: 720, width: 180, height: 48 };
  assert.equal(bayTapClearsChrome(startOnPill, viewport), false);
  const startClear = { x: 620, y: 640, width: 200, height: 48 };
  assert.equal(bayTapClearsChrome(startClear, viewport), true);
});
