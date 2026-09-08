import assert from "node:assert/strict";
import test from "node:test";
import { bayPrimaryTapPoint, isOverlayChrome, pointInRect } from "./bay-chrome-hit.ts";

function fakeEl(matches: string[]) {
  return {
    closest(sel: string) {
      const parts = sel.split(",").map((s) => s.trim());
      return parts.some((p) => matches.includes(p)) ? this : null;
    },
  };
}

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

test("Save button and bay form are never overlay chrome", () => {
  assert.equal(isOverlayChrome(fakeEl(["[data-bay-primary]"]) as unknown as EventTarget), false);
  assert.equal(isOverlayChrome(fakeEl(["[data-bay-chrome]"]) as unknown as EventTarget), false);
  assert.equal(isOverlayChrome(fakeEl(["[data-bay-form]"]) as unknown as EventTarget), false);
  assert.equal(isOverlayChrome(fakeEl(["[data-bay-helper]"]) as unknown as EventTarget), false);
});

test("Grok pill and unknown overlays are overlay chrome", () => {
  assert.equal(isOverlayChrome(fakeEl(["#grok-pill-sim"]) as unknown as EventTarget), true);
  assert.equal(isOverlayChrome(fakeEl([]) as unknown as EventTarget), true);
});

test("a tap that started on Save is not stolen as overlay chrome", () => {
  assert.equal(
    isOverlayChrome(fakeEl(["[data-bay-primary]", "[data-bay-chrome]"]) as unknown as EventTarget),
    false,
  );
});
