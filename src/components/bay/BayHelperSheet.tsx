import { X } from "lucide-react";
import { AssistantDock } from "@/components/assistant/AssistantDock";
import { InFlowGuidance } from "@/components/case/InFlowGuidance";
import { Button } from "@/components/ui/button";
import type { JobRecord, ModelPack } from "@/data/types";
import { BAY_TAP_MIN_PX } from "@/lib/bay-chrome";

export function BayHelperSheet({
  job,
  pack,
  phaseLabel,
  onClose,
}: {
  job: JobRecord;
  pack: ModelPack;
  phaseLabel: string;
  onClose: () => void;
}) {
  return (
    <div
      data-testid="bay-helper-sheet"
      className="absolute inset-x-0 bottom-0 top-2 z-40 flex max-h-full flex-col overflow-hidden rounded-t-xl bg-surface shadow-[var(--shadow-border)]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-navy">HELPER</p>
          <p className="truncate text-sm font-medium text-ink">{phaseLabel}</p>
        </div>
        <Button
          variant="secondary"
          className="min-h-11 min-w-20"
          style={{ minHeight: BAY_TAP_MIN_PX }}
          onClick={onClose}
        >
          <X className="size-4" />
          Close
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="px-3 py-3">
          <InFlowGuidance job={job} pack={pack} phaseLabel={phaseLabel} onJumped={onClose} />
        </div>
        <AssistantDock modelId={pack.id} job={job} compact />
      </div>
    </div>
  );
}
