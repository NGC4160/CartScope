export type BayChromeMeta = {
  chip: string;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  secondaryLabel?: string;
  badge?: string | null;
  error?: string | null;
  errorDetails?: string[];
};

export type BaySaveHandler = () => void | string;

export type BayActionChrome = BayChromeMeta & {
  onAction: BaySaveHandler;
  onSecondary?: () => void;
};

export type BayChromeSnapshot = {
  seq: number;
  action: BaySaveHandler | null;
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
      error: chrome.error ?? null,
      errorDetails: chrome.errorDetails ?? [],
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

export type BaySaveOutcome = {
  ran: boolean;
  blocked?: string;
};

export type BaySubmitSlot = {
  bind: (fn: BaySaveHandler) => void;
  fire: () => boolean;
  outcome: () => BaySaveOutcome;
  hasHandler: () => boolean;
};

function outcomeFromReturn(ret: unknown): BaySaveOutcome {
  if (typeof ret === "string" && ret.trim()) return { ran: true, blocked: ret.trim() };
  return { ran: true };
}

/**
 * Latest-submit slot. Bind during render (a ref write). Fire on tap.
 * Does not live in React state, so an effect cleanup cannot clear it.
 * A returned string from the handler is a block reason for the sticky bar.
 */
export function createBaySubmitSlot(): BaySubmitSlot {
  let handler: BaySaveHandler | null = null;
  function outcome(): BaySaveOutcome {
    if (typeof handler !== "function") {
      console.warn("[CartScope] sticky Save tapped with no handler");
      return { ran: false };
    }
    try {
      return outcomeFromReturn(handler());
    } catch (err) {
      console.warn("[CartScope] sticky Save handler failed", err);
      return { ran: false };
    }
  }
  return {
    bind(fn) {
      handler = fn;
    },
    fire() {
      return outcome().ran;
    },
    outcome,
    hasHandler() {
      return typeof handler === "function";
    },
  };
}

/**
 * Dedup pointerup + click from ONE tap. Unlock on the next macrotask
 * so a later Save (keyboard dismiss, then glove tap) is never swallowed.
 * The old 350ms window is what left Yamaha / Precedent / gas Check 1
 * stuck after a real tap.
 */
export function createBayGesture(windowMs = 0): {
  run: (fn: () => void) => boolean;
  reset: () => void;
} {
  let last = 0;
  let sameTurn = false;
  return {
    run(fn) {
      if (sameTurn) return false;
      const now = Date.now();
      if (windowMs > 0 && last > 0 && now - last < windowMs) return false;
      sameTurn = true;
      last = now;
      try {
        fn();
      } finally {
        if (typeof setTimeout === "function") {
          setTimeout(() => {
            sameTurn = false;
          }, 0);
        } else {
          sameTurn = false;
        }
      }
      return true;
    },
    reset() {
      last = 0;
      sameTurn = false;
    },
  };
}

/**
 * Deduplicate leftover form submits only. Do not wrap the sticky
 * Save button — a failed Enter submit must not block the glove tap.
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

/**
 * Associated-form submit. Last-ditch only.
 * requestSubmit can return without running onSubmit (constraint validation,
 * lost click after pointer capture). A true here is NOT proof that Save ran.
 */
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

/**
 * One Save path for pack, checks, and report.
 * The bound handler (PackGate / StepPanel / CodeGate / CaseReport) runs first.
 * Form requestSubmit is never treated as proof of save — that is what left
 * Yamaha / Precedent pack and gas Check 1 stuck after a mouse tap.
 * A handler string return is a block reason for the sticky bar (not a miss).
 */
export function fireBaySaveOutcome(opts: {
  fire?: () => boolean | BaySaveOutcome;
  fallback?: BaySaveHandler;
  formId?: string;
  document?: Document;
}): BaySaveOutcome {
  try {
    if (opts.fire) {
      const result = opts.fire();
      if (result && typeof result === "object" && "ran" in result) {
        if (result.ran) return result;
      } else if (result === true) {
        return { ran: true };
      }
    }
    if (typeof opts.fallback === "function") {
      return outcomeFromReturn(opts.fallback());
    }
  } catch (err) {
    console.warn("[CartScope] sticky Save handler failed", err);
    return { ran: false };
  }
  requestBayFormSubmit(opts.document, opts.formId);
  console.warn("[CartScope] sticky Save tapped with no handler");
  return { ran: false };
}

export function fireBaySave(opts: {
  fire?: () => boolean | BaySaveOutcome;
  fallback?: BaySaveHandler;
  formId?: string;
  document?: Document;
}): boolean {
  return fireBaySaveOutcome(opts).ran;
}
