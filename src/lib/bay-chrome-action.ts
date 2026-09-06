export type BayChromeMeta = {
  chip: string;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  secondaryLabel?: string;
  badge?: string | null;
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
      badge: chrome.badge ?? null,
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

/** Native form ids so the sticky bar can submit without a React onClick. */
export const BAY_CHECK_FORM_ID = "bay-check-form";
export const BAY_REPORT_FORM_ID = "bay-report-form";

export type BaySubmitSlot = {
  bind: (fn: () => void) => void;
  fire: () => boolean;
  hasHandler: () => boolean;
};

/**
 * Latest-submit slot. Bind during render (a ref write). Fire on tap.
 * Does not live in React state, so an effect cleanup cannot clear it.
 */
export function createBaySubmitSlot(): BaySubmitSlot {
  let handler: (() => void) | null = null;
  return {
    bind(fn) {
      handler = fn;
    },
    fire() {
      if (typeof handler !== "function") {
        console.warn("[CartScope] sticky Save tapped with no handler");
        return false;
      }
      handler();
      return true;
    },
    hasHandler() {
      return typeof handler === "function";
    },
  };
}

/**
 * Deduplicate pointer-up requestSubmit + native click submit.
 * The actual save lives on the form's onSubmit — never on a button
 * preventDefault that can kill #bay-check-form.
 */
export function createBaySubmitGate(windowMs = 400): {
  run: (fn: () => void, key?: string) => boolean;
} {
  const lastByKey = new Map<string, number>();
  return {
    run(fn, key = "default") {
      const now = Date.now();
      const last = lastByKey.get(key) ?? 0;
      if (last > 0 && now - last < windowMs) return false;
      lastByKey.set(key, now);
      fn();
      return true;
    },
  };
}

/**
 * Shared across Pack / codes / factory / report so a leftover click after
 * unmount cannot submit the next form. Not used by Job header Start.
 */
export const bayFormSubmitGate = createBaySubmitGate(400);

/** Associated-form submit. Used as a missed-click backup — not a second save path. */
export function requestBayFormSubmit(doc: Document | undefined, formId: string | undefined): boolean {
  if (!doc || !formId) return false;
  const form = doc.getElementById(formId);
  if (!form) return false;
  const requestSubmit = (form as { requestSubmit?: () => void }).requestSubmit;
  if (typeof requestSubmit === "function") {
    requestSubmit.call(form);
    return true;
  }
  if (typeof form.dispatchEvent === "function") {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    return true;
  }
  return false;
}

export function fireBaySave(opts: {
  fire?: () => boolean;
  fallback?: () => void;
  formId?: string;
  document?: Document;
}): boolean {
  if (requestBayFormSubmit(opts.document, opts.formId)) return true;
  if (opts.fire?.()) return true;
  if (typeof opts.fallback === "function") {
    opts.fallback();
    return true;
  }
  console.warn("[CartScope] sticky Save tapped with no handler");
  return false;
}
