import assert from "node:assert/strict";
import test from "node:test";
import { bayPrimaryTapPoint, pointInRect } from "./bay-chrome-hit.ts";

test("bay tech tap is the lower-right of the sticky control", () => {
  const tap = bayPrimaryTapPoint({ x: 0, y: 0, width: 400, height: 50 });
  assert.equal(tap.x, 340);
  assert.equal(tap.y, 35);
});

test("full-width Save puts the tester tap on the control, not a padded dead zone", () => {
  const bar = { x: 16, y: 720, width: 992, height: 48 };
  const tap = bayPrimaryTapPoint(bar);
  assert.equal(pointInRect(tap, bar), true);
  assert.ok(tap.x > bar.x + bar.width * 0.8);
});
