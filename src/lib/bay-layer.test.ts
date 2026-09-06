import assert from "node:assert/strict";
import test from "node:test";
import {
  bayChecksPaneIsParked,
  bayChecksPaneProps,
  bayChecksWorkspaceMounted,
  reportShowsFactoryCheckLog,
} from "./bay-layer.ts";

test("Report parks Checks with display none, inert, and no flex", () => {
  const parked = bayChecksPaneProps(true);
  assert.equal(bayChecksPaneIsParked(parked), true);
  assert.equal(parked.hidden, true);
  assert.equal(parked.inert, true);
  assert.equal(parked.style?.display, "none");
  assert.equal(parked.className.includes("flex"), false);
  assert.equal(parked.className.includes("hidden"), false);
});

test("Checks pane is a flex layer only when Report is closed", () => {
  const live = bayChecksPaneProps(false);
  assert.equal(bayChecksPaneIsParked(live), false);
  assert.equal(live.hidden, false);
  assert.equal(live.inert, undefined);
  assert.equal(live.style, undefined);
  assert.match(live.className, /\bflex\b/);
});

test("Report unmounts the Checks workspace instead of leaving it parked and hittable", () => {
  assert.equal(bayChecksWorkspaceMounted(true), false);
  assert.equal(bayChecksWorkspaceMounted(false), true);
});

test("bay Report pane never renders the factory Checks table", () => {
  assert.equal(reportShowsFactoryCheckLog(false, true), false);
  assert.equal(reportShowsFactoryCheckLog(false, false), false);
  assert.equal(reportShowsFactoryCheckLog(true, true), false);
  assert.equal(reportShowsFactoryCheckLog(true, false), true);
});
