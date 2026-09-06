import { useCallback, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BAY_TAP_MIN_PX } from "@/lib/bay-chrome";

export type BayActionChrome = {
  chip: string;
  label: string;
  onAction: () => void;
  disabled?: boolean;
  busy?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function useBayChrome() {
  const [meta, setMeta] = useState<Omit<BayActionChrome, "onAction" | "onSecondary"> | null>(null);
  const actionRef = useRef<(() => void) | null>(null);
  const secondaryRef = useRef<(() => void) | undefined>(undefined);

  const setChrome = useCallback((next: BayActionChrome | null) => {
    if (!next) {
      actionRef.current = null;
      secondaryRef.current = undefined;
      setMeta(null);
      return;
    }
    actionRef.current = next.onAction;
    secondaryRef.current = next.onSecondary;
    setMeta((prev) => {
      if (
        prev &&
        prev.chip === next.chip &&
        prev.label === next.label &&
        prev.disabled === next.disabled &&
        prev.busy === next.busy &&
        prev.secondaryLabel === next.secondaryLabel
      ) {
        return prev;
      }
      return {
        chip: next.chip,
        label: next.label,
        disabled: next.disabled,
        busy: next.busy,
        secondaryLabel: next.secondaryLabel,
      };
    });
  }, []);

  const chrome: BayActionChrome | null = meta
    ? {
        ...meta,
        onAction: () => actionRef.current?.(),
        onSecondary: secondaryRef.current ? () => secondaryRef.current?.() : undefined,
      }
    : null;

  return [chrome, setChrome] as const;
}

export function BayActionBar({ chrome }: { chrome: BayActionChrome | null }) {
  if (!chrome) return null;
  return (
    <div
      data-testid="bay-action-bar"
      className="no-print shrink-0 border-t border-navy-deep bg-surface px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-2">
        <p className="shrink-0 rounded-md bg-paper-sunken px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-navy">
          {chrome.chip}
        </p>
        {chrome.secondaryLabel && chrome.onSecondary ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 shrink-0"
            style={{ minHeight: BAY_TAP_MIN_PX }}
            onClick={chrome.onSecondary}
          >
            {chrome.secondaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          className="min-h-12 min-w-0 flex-1"
          style={{ minHeight: Math.max(BAY_TAP_MIN_PX, 48) }}
          onClick={chrome.onAction}
          disabled={chrome.disabled || chrome.busy}
        >
          <span className="truncate">{chrome.label}</span>
          <ChevronRight className="size-4 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
