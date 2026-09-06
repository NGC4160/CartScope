import assert from "node:assert/strict";
import test from "node:test";
import {
  BAY_DIAGRAM_DEFAULT_SCALE,
  clearDiagramViews,
  defaultDiagramScale,
  diagramViewKey,
  readDiagramView,
  writeDiagramView,
} from "./diagram-view.ts";

test("default diagram scale is larger than letterbox contain", () => {
  const contain = Math.min(500 / 1080, 400 / 640);
  const next = defaultDiagramScale(500, 400, 1080, 640);
  assert.ok(next > contain, `${next} should beat contain ${contain}`);
  assert.ok(next >= 500 / 1080);
  assert.ok(next >= BAY_DIAGRAM_DEFAULT_SCALE || next >= 500 / 1080);
});

test("diagram zoom and pan persist by job and tab", () => {
  clearDiagramViews();
  const key = diagramViewKey("job_1", "schematic");
  assert.equal(readDiagramView(key), null);
  writeDiagramView(key, { scale: 1.8, x: 40, y: -12 });
  assert.deepEqual(readDiagramView(key), { scale: 1.8, x: 40, y: -12 });
  assert.equal(readDiagramView(diagramViewKey("job_1", "full")), null);
  clearDiagramViews();
  assert.equal(readDiagramView(key), null);
});
