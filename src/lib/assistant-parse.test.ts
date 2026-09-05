import assert from "node:assert/strict";
import test from "node:test";
import { parseAssistantReply } from "./assistant-parse.ts";

test("strips step marker and keeps the suggested factory step id", () => {
  const out = parseAssistantReply("Next, measure solenoid coil ohms.\n[[STEP:pno-sol]]\n");
  assert.equal(out.text.includes("[[STEP:"), false);
  assert.match(out.text, /solenoid coil/);
  assert.equal(out.suggestedStepId, "pno-sol");
});
