import assert from "node:assert/strict";
import test from "node:test";
import { tabletSheetHref, tabletSheetsForController } from "./controller-tablet-sheets.ts";

test("Curtis 1268 keeps in-app wiring JPEGs as a Drive fallback", () => {
  const sheets = tabletSheetsForController("curtis-1268");
  assert.ok(sheets.length >= 4);
  assert.ok(sheets.every((sheet) => sheet.src.startsWith("/wiring/")));
  assert.ok(sheets.some((sheet) => sheet.id.startsWith("curtis-1268-5403")));
  assert.equal(tabletSheetHref(sheets[0]!.id), `/print/wiring/${sheets[0]!.id}`);
});

test("other stamps without tablet plates stay Drive-only", () => {
  assert.equal(tabletSheetsForController("curtis-1206mx").length, 0);
});
