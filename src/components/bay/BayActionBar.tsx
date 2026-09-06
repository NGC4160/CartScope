import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  bayChromeClear,
  bayChromePublish,
  bayPrimaryClickBlocksNativeSubmit,
  emptyBayChrome,
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
        prev.secondaryLabel === incoming.secondaryLabel
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
      onAction: () => actionRef.current(),
      onSecondary: spec.secondaryLabel ? () => secondaryRef.current?.() : undefined,
    });
  }, [onChrome, spec.chip, spec.label, spec.disabled, spec.busy, spec.secondaryLabel]);
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
  const lastFire = useRef(0);
  if (!chrome) return null;
  const live = chrome;

  function runSave() {
    if (live.disabled || live.busy) return false;
    if (bayPrimaryClickBlocksNativeSubmit(lastFire.current)) return true;
    const ok = fireBaySave({
      fire,
      fallback: live.onAction,
      formId,
      document: typeof document !== "undefined" ? document : undefined,
    });
    if (ok) lastFire.current = Date.now();
    return ok;
  }

  function onPrimaryPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (live.disabled || live.busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPrimaryPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    runSave();
  }

  function onPrimaryClick(event: { preventDefault: () => void }) {
    // Only cancel native submit when pointer-up already saved. Always
    // preventDefault was the #15 Start collision: click never submitted
    // #bay-check-form if pointer-up missed or the slot had not bound yet.
    if (bayPrimaryClickBlocksNativeSubmit(lastFire.current)) {
      event.preventDefault();
      return;
    }
    if (runSave()) event.preventDefault();
  }

  return (
    <div
      data-testid="bay-action-bar"
      className="no-print relative z-30 isolate shrink-0 border-t border-navy-deep bg-surface px-3 pt-2 pb-[max(2.75rem,calc(env(safe-area-inset-bottom)+2.25rem))]"
    >
      <div className="flex items-center gap-2">
        <p className="shrink-0 rounded-md bg-paper-sunken px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-navy">
          {live.chip}
        </p>
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
          type="submit"
          form={formId}
          data-testid="bay-primary-action"
          data-bay-primary=""
          className="min-h-12 min-w-0 flex-1 touch-manipulation"
          style={{ minHeight: Math.max(BAY_TAP_MIN_PX, 48) }}
          onPointerDown={onPrimaryPointerDown}
          onPointerUp={onPrimaryPointerUp}
          onClick={onPrimaryClick}
          disabled={live.disabled || live.busy}
        >
          <span className="pointer-events-none truncate">{live.label}</span>
          <ChevronRight className="pointer-events-none size-4 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
