import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTROLLER_DOCS,
  CONTROLLER_MODELS,
  CONTROLLERS_DRIVE_ROOT_ID,
  EXCLUDED_CONTROLLER_NOTES,
  controllerStampsForPack,
  docsForModelTag,
  docsForPlatformTag,
  driveFileOpenUrl,
} from "./controllers.ts";

test("curated set is the 16 approved Drive books", () => {
  assert.equal(CONTROLLER_DOCS.length, 16);
  assert.equal(CONTROLLERS_DRIVE_ROOT_ID, "1WeXxQQoJjfWP6vIsNfIjj-A2dYv6WhSJ");
  const ids = CONTROLLER_DOCS.map((d) => d.driveFileId);
  assert.equal(new Set(ids).size, 16);
  for (const doc of CONTROLLER_DOCS) {
    assert.equal(doc.openUrl, driveFileOpenUrl(doc.driveFileId));
    assert.ok(doc.modelTags.length >= 1, doc.id);
    assert.match(doc.openUrl, /^https:\/\/drive\.google\.com\/file\/d\//);
  }
});

test("every model tag has at least one Drive file", () => {
  for (const model of CONTROLLER_MODELS) {
    assert.ok(docsForModelTag(model.tag).length >= 1, model.tag);
  }
});

test("does not bulk-add Navitas, 1313, or 1268 conversion kits", () => {
  const blob = CONTROLLER_DOCS.map((d) => `${d.id} ${d.title} ${d.modelTags.join(" ")}`).join("\n");
  assert.doesNotMatch(blob, /navitas|tac\s*1|tac\s*2|1313|conversion/i);
  assert.ok(!CONTROLLER_MODELS.some((m) => /navitas|1313/.test(m.tag)));
  assert.ok(EXCLUDED_CONTROLLER_NOTES.length >= 3);
});

test("platform tags stay secondary and never replace model tags", () => {
  for (const doc of CONTROLLER_DOCS) {
    for (const tag of doc.modelTags) {
      assert.ok(!["ezgo-txt", "ezgo-rxv", "club-car-precedent"].includes(tag), doc.id);
    }
  }
  const txt = docsForPlatformTag("ezgo-txt");
  assert.deepEqual(
    txt.map((d) => d.modelTags[0]).sort(),
    ["curtis-1206hb", "curtis-1206mx", "curtis-1206sx"],
  );
  const stamps = controllerStampsForPack("ezgo-txt-tct").map((m) => m.tag);
  assert.ok(stamps.includes("curtis-1206hb"));
  assert.ok(stamps.includes("curtis-1206mx"));
  assert.ok(!stamps.includes("curtis-1268"));
});

test("1268 and 1266 stay off TXT / RXV / Precedent platform lists", () => {
  assert.equal(
    controllerStampsForPack("club-car-precedent-iq").some((m) => m.tag === "curtis-1268"),
    false,
  );
  assert.equal(docsForModelTag("curtis-1268").length, 2);
  assert.equal(docsForModelTag("curtis-1266").length, 2);
  assert.equal(docsForModelTag("curtis-1232e").length, 1);
});
