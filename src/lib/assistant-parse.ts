const STEP_MARK = /\[\[STEP:([A-Za-z0-9_-]+)\]\]/g;

export function parseAssistantReply(raw: string): { text: string; suggestedStepId?: string } {
  const ids = [...raw.matchAll(STEP_MARK)].map((m) => m[1]);
  const text = raw.replace(STEP_MARK, "").replace(/\n{3,}/g, "\n\n").trim();
  return { text, suggestedStepId: ids[0] };
}
