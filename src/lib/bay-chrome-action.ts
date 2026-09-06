export type BayChromeMeta = {
  chip: string;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  secondaryLabel?: string;
};

export type BayActionChrome = BayChromeMeta & {
  onAction: () => void;
  onSecondary?: () => void;
};

export type BayChromeSnapshot = {
  seq: number;
  action: (() => void) | null;
  secondary?: () => void;
  meta: BayChromeMeta | null;
};

export function emptyBayChrome(): BayChromeSnapshot {
  return { seq: 0, action: null, secondary: undefined, meta: null };
}

export function bayChromePublish(prev: BayChromeSnapshot, chrome: BayActionChrome): BayChromeSnapshot {
  return {
    seq: prev.seq + 1,
    action: chrome.onAction,
    secondary: chrome.onSecondary,
    meta: {
      chip: chrome.chip,
      label: chrome.label,
      disabled: chrome.disabled,
      busy: chrome.busy,
      secondaryLabel: chrome.secondaryLabel,
    },
  };
}

/**
 * PackGate / CodeGate / StepPanel used to call `onChrome(null)` from a
 * `useEffect` cleanup. That cleanup runs *after* the next panel's
 * `useLayoutEffect` publish, so the sticky bar kept its label but the click
 * called nothing. A clear must not wipe a newer publish.
 */
export function bayChromeClear(prev: BayChromeSnapshot, publishedSeq?: number): BayChromeSnapshot {
  if (publishedSeq != null && publishedSeq !== prev.seq) return prev;
  if (publishedSeq == null) return prev;
  return { seq: prev.seq, action: null, secondary: undefined, meta: null };
}

export function bayChromeDispatch(snapshot: BayChromeSnapshot): boolean {
  if (typeof snapshot.action !== "function") return false;
  snapshot.action();
  return true;
}
