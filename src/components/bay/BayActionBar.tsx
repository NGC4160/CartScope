import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  emptyBayChrome,
  bayChromeClear,
  bayChromePublish,
  createBayGesture,
  fireBaySaveOutcome,
  type BayActionChrome,
  type BayChromeSnapshot,
  type BaySaveHandler,
  type BaySaveOutcome,
} from "@/lib/bay-chrome-action";
import { BAY_TAP_MIN_PX } from "@/lib/bay-chrome";
import { isOverlayChrome, pointHitsBaySave } from "@/lib/bay-chrome-hit";
import { BaySaveNotice } from "@/components/bay/BaySaveNotice";

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
        prev.badge === incoming.badge &&
        prev.error === incoming.error &&
        sameDetails(prev.errorDetails, incoming.errorDetails)
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
    error?: string | null;
    errorDetails?: string[];
    onAction: BaySaveHandler;
    onSecondary?: () => void;
  },
) {
  const actionRef = useRef(spec.onAction);
  actionRef.current = spec.onAction;
  const secondaryRef = useRef(spec.onSecondary);
  secondaryRef.current = spec.onSecondary;
  const errorKey = spec.errorDetails?.join("\n") ?? "";

  useLayoutEffect(() => {
    if (!onChrome) return;
    onChrome({
      chip: spec.chip,
      label: spec.label,
      disabled: spec.disabled,
      busy: spec.busy,
      secondaryLabel: spec.secondaryLabel,
      badge: spec.badge ?? null,
      error: spec.error ?? null,
      errorDetails: spec.errorDetails ?? [],
      onAction: () => actionRef.current(),
      onSecondary: spec.secondaryLabel ? () => secondaryRef.current?.() : undefined,
    });
  }, [
    onChrome,
    spec.chip,
    spec.label,
    spec.disabled,
    spec.busy,
    spec.secondaryLabel,
    spec.badge,
    spec.error,
    errorKey,
  ]);
}

function sameDetails(a?: string[], b?: string[]): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((item, i) => item === b[i]);
}

export function BayActionBar({
  chrome,
  formId,
  fire,
  armed = true,
}: {
  chrome: BayActionChrome | null;
  formId?: string;
  fire?: () => boolean | BaySaveOutcome;
  /** Off while Helper covers Checks so a pill tap cannot Save underneath. */
  armed?: boolean;
}) {
  const [missed, setMissed] = useState<string | null>(null);
  const chromeRef = useRef(chrome);
  chromeRef.current = chrome;
  const fireRef = useRef(fire);
  fireRef.current = fire;
  const tapGate = useRef(createBayGesture(80)).current;

  const activate = useCallback(() => {
    const live = chromeRef.current;
    if (!live) return;
    if (live.disabled || live.busy) {
      setMissed(live.disabled ? "Save is not available on this check." : "Save is still working.");
      return;
    }
    const out = fireBaySaveOutcome({
      fire: fireRef.current,
      fallback: () => live.onAction(),
    });
    if (!out.ran) {
      tapGate.reset();
      setMissed("Save did not run. Try Save again.");
      return;
    }
    if (out.blocked) {
      tapGate.reset();
      setMissed(out.blocked);
      return;
    }
    tapGate.reset();
    setMissed(null);
  }, [tapGate]);

  const tryActivate = useCallback(() => {
    tapGate.run(activate);
  }, [activate, tapGate]);

  function onPrimaryPointerDown(event: { button?: number }) {
    if (event.button != null && event.button !== 0) return;
    tryActivate();
  }

  function onPrimaryClick() {
    tryActivate();
  }

  const hasChrome = Boolean(chrome);
  useLayoutEffect(() => {
    if (!armed || !hasChrome) return;
    function onPointerUp(event: PointerEvent) {
      if (!isOverlayChrome(event.target)) return;
      if (!pointHitsBaySave(event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
      tryActivate();
    }
    document.addEventListener("pointerup", onPointerUp, true);
    return () => document.removeEventListener("pointerup", onPointerUp, true);
  }, [tryActivate, armed, hasChrome]);

  if (!chrome) return null;
  const live = chrome;
  const noticeTitle = live.error || missed;
  const noticeDetails = live.error ? live.errorDetails : undefined;

  return (
    <div
      data-testid="bay-action-bar"
      data-bay-chrome=""
      data-save-blocked={noticeTitle ? "true" : "false"}
      className="no-print relative z-30 isolate shrink-0 overflow-visible border-t border-navy-deep bg-surface pl-3 pr-[11.5rem] pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      {noticeTitle ? (
        <div
          className="relative z-40 mb-2 max-h-36 overflow-auto"
          data-testid={missed && !live.error ? "bay-save-missed" : undefined}
        >
          <BaySaveNotice title={noticeTitle} details={noticeDetails} />
        </div>
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
            data-bay-secondary=""
            className="min-h-11 shrink-0"
            style={{ minHeight: BAY_TAP_MIN_PX }}
            onClick={live.onSecondary}
          >
            {live.secondaryLabel}
          </Button>
        ) : null}
      </div>
      <Button
        type="button"
        form={formId}
        data-testid="bay-primary-action"
        data-bay-primary=""
        className="mt-2 min-h-12 w-full min-w-0 justify-start text-left touch-manipulation active:scale-100"
        style={{ minHeight: Math.max(BAY_TAP_MIN_PX, 48) }}
        onPointerDown={onPrimaryPointerDown}
        onClick={onPrimaryClick}
        disabled={live.disabled || live.busy}
      >
        <span className="pointer-events-none truncate">{live.label}</span>
        <ChevronRight className="pointer-events-none size-4 shrink-0" />
      </Button>
    </div>
  );
}
