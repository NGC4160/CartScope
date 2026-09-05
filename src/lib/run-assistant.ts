import { askBenchAssistant, type AssistantResult } from "@/lib/assistant";
import { manualsOnFile } from "@/lib/manuals";
import { caseBrief, evaluateProof } from "@/lib/proof";
import { getPack } from "@/data/index";
import { sheetsForPack } from "@/data/wiring";
import type { JobRecord } from "@/data/types";

export async function runJobAssistant(job: JobRecord, question: string): Promise<AssistantResult> {
  const pack = getPack(job.modelId);
  const proof = pack ? evaluateProof(job, pack) : undefined;
  const coverage = pack ? manualsOnFile(pack, sheetsForPack(pack.id)) : undefined;
  const history = [...(job.aiLog ?? []), { role: "user" as const, text: question }].map((t) => ({
    role: t.role,
    text: t.text,
  }));
  return askBenchAssistant({
    data: {
      question,
      modelId: job.modelId,
      symptomId: job.symptomId,
      currentStepId: job.currentStepId,
      diagnosisId: job.diagnosisId,
      measurements: (job.log ?? []).map((e) => ({
        step: e.stepTitle,
        expected: e.expectedLabel,
        reading: e.confirmedRaw,
        result: e.result,
      })),
      history,
      caseBrief: pack && proof ? caseBrief(job, pack, proof) : undefined,
      proofEnough: proof?.enoughProof,
      mayBlameController: proof?.mayBlameController,
      mayShowParts: proof?.mayShowParts,
      manualsOnFile: coverage?.onFile,
    },
  });
}
