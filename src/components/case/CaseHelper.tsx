import type { JobRecord, ModelPack } from "@/data/types";
import { evaluateProof } from "@/lib/proof";

export function CaseHelper({ job, pack }: { job: JobRecord; pack: ModelPack }) {
  const proof = evaluateProof(job, pack);
  return (
    <aside className="border-t border-line bg-surface-2 px-4 py-3">
      <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-navy">HELPER</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{proof.nextHint}</p>
      {proof.conflicts.map((c) => (
        <p key={c} className="mt-2 text-sm leading-relaxed text-warn">
          {c}
        </p>
      ))}
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        <span className="font-medium text-ink">Recommended repair: </span>
        {proof.recommendedRepair ?? "Not enough proof to recommend a repair yet."}
      </p>
    </aside>
  );
}
