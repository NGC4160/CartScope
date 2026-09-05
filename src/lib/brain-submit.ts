import type { BrainCopyRecord, JobRecord, ModelPack } from "@/data/types";
import { buildBrainCase } from "@/lib/brain-case";
import { fileBrainCase } from "@/lib/brain-file";
import { evaluateProof } from "@/lib/proof";

export async function submitBrainCopy(job: JobRecord, pack: ModelPack): Promise<BrainCopyRecord> {
  const proof = evaluateProof(job, pack);
  const built = buildBrainCase(job, pack, proof);
  const at = new Date().toISOString();
  const base: BrainCopyRecord = {
    status: "ready",
    filename: built.filename,
    path: built.path,
    markdown: built.markdown,
    at,
    attempts: (job.brainCopy?.attempts ?? 0) + 1,
  };
  if (built.leaks.length) {
    return {
      ...base,
      status: "failed",
      error: "Shop copy still has private info. It was not sent.",
    };
  }
  try {
    const res = await fileBrainCase({
      data: {
        filename: built.filename,
        path: built.path,
        markdown: built.markdown,
      },
    });
    if (res.ok && res.status === "sent") {
      return { ...base, status: "sent", sentAt: new Date().toISOString() };
    }
    if (res.ok) {
      return { ...base, status: "queued" };
    }
    return { ...base, status: "failed", error: res.error };
  } catch {
    return {
      ...base,
      status: "failed",
      error: "Could not reach the shop filing path. Try again.",
    };
  }
}
