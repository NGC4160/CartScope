import { PACK_NA_BADGE, PACK_NA_NEXT, packNaCopy } from "@/lib/pack-na";
import type { ModelPack } from "@/data/types";

export function PackNaBanner({ pack, compact = false }: { pack: ModelPack; compact?: boolean }) {
  const copy = packNaCopy(pack);
  if (!copy) return null;
  if (compact) {
    return (
      <span data-testid="pack-na-badge" className="rounded-md bg-warn-bg px-2 py-1 font-mono text-xs font-semibold text-warn">
        {PACK_NA_BADGE}
      </span>
    );
  }
  return (
    <section className="rounded-md border border-line bg-paper-sunken px-3 py-3" data-testid="pack-na">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-navy">BATTERY PACK</p>
        <span data-testid="pack-na-badge" className="rounded-md bg-warn-bg px-2 py-1 font-mono text-xs font-semibold text-warn">
          {PACK_NA_BADGE}
        </span>
      </div>
      <h2 className="mt-1 font-display text-lg font-semibold text-ink">{copy.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink">{copy.summary}</p>
      <p className="mt-2 text-sm font-medium text-ink">{PACK_NA_NEXT}</p>
    </section>
  );
}
