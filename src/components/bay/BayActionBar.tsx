import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  emptyBayChrome,
  bayChromeClear,
  bayChromePublish,
  bayFormSubmitGate,
  fireBaySave,
  type BayActionChrome,
  type BayChromeSnapshot,
} from "@/lib/bay-chrome-action";
import { BAY_TAP_MIN_PX } from "@/lib/bay-chrome";

export type { BayActionChrome } from "@/lib/bay-chrome-action";

export function useBayChrome() {
  const snapRef = useRef<BayChromeSnapshot>(emptyBayChrome());
  const [meta, setMeta] = useState<BayChromeSnapshot["meta"]>(null);

  const setChrome = useCallback((next: BayActionChrome | null) => {
    if (!next) {
      const nextSnap = bayChromeClear(snapRef.current);
      snapRef.current = nextSnap;
      return;
    }
    const nextSnap = bayChromePublish(snapRef.current, next);
    snapRef.current = nextSnap;
    setMeta((prev) => {
      const incoming = nextSnap.meta;
      if (
        prev &&
        incoming &&
        prev.chip === incoming.chip &&
        prev.label === incoming.label &&
        prev.disabled === incoming.disabled &&
        prev.busy === incoming.busy &&
        prev.secondaryLabel === incoming.secondaryLabel &&
        prev.badge === incoming.badge
      ) {
        return prev;
      }
      return incoming;
    });
  }, []);

  const chrome: BayActionChrome | null = meta
    ? {
        ...meta,
        onAction: () => snapRef.current.action?.(),
        onSecondary: snapRef.current.secondary ? () => snapRef.current.secondary?.() : undefined,
      }
    : null;

  return [chrome, setChrome] as const;
}

/** Labels only. The click path must not depend on this effect. */
export function usePublishBayChrome(
  onChrome: ((chrome: BayActionChrome | null) => void) | undefined,
  spec: {
    chip: string;
    label: string;
    disabled?: boolean;
    busy?: boolean;
    secondaryLabel?: string;
    badge?: string | null;
    onAction: () => void;
    onSecondary?: () => void;
  },
) {
  const actionRef = useRef(spec.onAction);
  actionRef.current = spec.onAction;
  const secondaryRef = useRef(spec.onSecondary);
  secondaryRef.current = spec.onSecondary;

  useLayoutEffect(() => {
    if (!onChrome) return;
    onChrome({
      chip: spec.chip,
      label: spec.label,
      disabled: spec.disabled,
      busy: spec.busy,
      secondaryLabel: spec.secondaryLabel,
      badge: spec.badge ?? null,
      onAction: () => actionRef.current(),
      onSecondary: spec.secondaryLabel ? () => secondaryRef.current?.() : undefined,
    });
  }, [onChrome, spec.chip, spec.label, spec.disabled, spec.busy, spec.secondaryLabel, spec.badge]);
}

export function BayActionBar({
  chrome,
  formId,
  fire,
}: {
  chrome: BayActionChrome | null;
  formId?: string;
  fire?: () => boolean;
}) {
  const [missed, setMissed] = useState<string | null>(null);
  if (!chrome) return null;
  const live = chrome;

  function activate() {
    if (live.disabled || live.busy) return;
    bayFormSubmitGate.run(() => {
      const ran = fireBaySave({
        fire,
        fallback: () => live.onAction(),
      });
      setMissed(ran ? null : "Save did not run. Try Save again.");
    }, formId ?? "default");
  }

  return (
    <div
      data-testid="bay-action-bar"
      className="no-print relative z-20 isolate shrink-0 border-t border-navy-deep bg-surface px-3 pt-2 pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))]"
    >
      {missed ? (
        <p
          data-testid="bay-save-missed"
          className="mb-2 rounded-md bg-danger-bg px-3 py-2 text-lg font-semibold text-danger"
          role="alert"
        >
          {missed}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <p className="shrink-0 rounded-md bg-paper-sunken px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-navy">
          {live.chip}
        </p>
        {live.badge ? (
          <p
            data-testid="pack-na-badge"
            className="shrink-0 rounded-md bg-warn-bg px-2.5 py-1 font-mono text-xs font-semibold text-warn"
          >
            {live.badge}
          </p>
        ) : null}
        {live.secondaryLabel && live.onSecondary ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 shrink-0"
            style={{ minHeight: BAY_TAP_MIN_PX }}
            onClick={live.onSecondary}
          >
            {live.secondaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          form={formId}
          data-testid="bay-primary-action"
          data-bay-primary=""
          className="min-h-12 min-w-0 flex-1 touch-manipulation"
          style={{ minHeight: Math.max(BAY_TAP_MIN_PX, 48) }}
          onClick={activate}
          disabled={live.disabled || live.busy}
        >
          <span className="pointer-events-none truncate">{live.label}</span>
          <ChevronRight className="pointer-events-none size-4 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
