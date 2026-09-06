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

/** True when pointer-up already saved — click must not also native-submit. */
export function bayPrimaryClickBlocksNativeSubmit(
  lastFireAt: number,
  now = Date.now(),
  windowMs = 400,
): boolean {
  return lastFireAt > 0 && now - lastFireAt < windowMs;
}

function submitBayForm(doc: Document | undefined, formId: string | undefined): boolean {
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
  if (opts.fire?.()) return true;
  // Form before chrome fallback. A no-op onAction (empty snap) must not
  // swallow the associated #bay-check-form submit — that is the #14 backup
  // #15's Start path blocked by always preventDefault on click.
  if (submitBayForm(opts.document, opts.formId)) return true;
  if (typeof opts.fallback === "function") {
    opts.fallback();
    return true;
  }
  console.warn("[CartScope] sticky Save tapped with no handler");
  return false;
}
