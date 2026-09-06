import { packNaCopy } from "@/lib/pack-na";
import type { ModelPack } from "@/data/types";

export function PackNaBanner({ pack, compact = false }: { pack: ModelPack; compact?: boolean }) {
  const copy = packNaCopy(pack);
  if (!copy) return null;
  if (compact) {
    return <span className="text-ink-muted">{copy.title}</span>;
  }
  return (
    <section className="rounded-md border border-line bg-paper-sunken px-3 py-3" data-testid="pack-na">
      <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-navy">BATTERY PACK</p>
      <h2 className="mt-1 font-display text-lg font-semibold text-ink">{copy.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink">{copy.summary}</p>
    </section>
  );
}
