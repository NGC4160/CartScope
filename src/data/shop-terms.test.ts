import assert from "node:assert/strict";
import test from "node:test";
import { rewriteShopTerms, textHasSlangPartName } from "./shop-terms.ts";

test("rewrites slang part names to controller and solenoid", () => {
  assert.equal(rewriteShopTerms("The speed box (controller) is dead"), "The controller is dead");
  assert.equal(rewriteShopTerms("big click switch (solenoid) clicks"), "solenoid clicks");
  assert.equal(rewriteShopTerms("Do not replace a clicker from counters"), "Do not replace a solenoid from counters");
  assert.equal(textHasSlangPartName("controller and solenoid"), false);
  assert.equal(textHasSlangPartName("speed box still connected"), true);
});
