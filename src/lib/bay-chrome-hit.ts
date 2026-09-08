/**
 * Helper jump keeps a reserved lower-right pad. Sticky Save and Start do
 * not inset for that pad. Testers aim at the Save label, which is left-
 * aligned so the tap lands left of the Grok chat pill (PR #30 bay miss).
 *
 * After #32, click-only Save still failed on pack: testers tap the right
 * end of "Save pack and go on" after a long scroll. The Grok / Remix pill
 * sits on that corner (`pointer-events: auto`, max z-index) and eats the
 * click. Playwright at 40% width never hit it, so QA passed while the bay
 * did not. Overlay-only capture steals that tap. The Save button itself
 * stays click-only so a real button tap is never double-fired.
 */

export const BAY_CHROME_CLEARANCE = {
  rightRem: 11.5,
  bottomRem: 5,
  rightPx: 184,
  bottomPx: 80,
} as const;

export const BAY_CHROME_CLEARANCE_CLASS = "bay-chrome-clearance";

export type BayBox = { x: number; y: number; width: number; height: number };

/** Where bay techs tap the Save words: left of center, left of the chat pill. */
export function bayPrimaryTapPoint(box: BayBox): { x: number; y: number } {
  return {
    x: box.x + box.width * 0.4,
    y: box.y + box.height * 0.5,
  };
}

export function bayChromeReservedRect(viewport: { width: number; height: number }): BayBox {
  return {
    x: Math.max(0, viewport.width - BAY_CHROME_CLEARANCE.rightPx),
    y: Math.max(0, viewport.height - BAY_CHROME_CLEARANCE.bottomPx),
    width: Math.min(BAY_CHROME_CLEARANCE.rightPx, viewport.width),
    height: Math.min(BAY_CHROME_CLEARANCE.bottomPx, viewport.height),
  };
}

export function pointInRect(point: { x: number; y: number }, rect: BayBox): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/** True when the glove/mouse tap a tech actually uses is not under chrome. */
export function bayTapClearsChrome(box: BayBox, viewport: { width: number; height: number }): boolean {
  return !pointInRect(bayPrimaryTapPoint(box), bayChromeReservedRect(viewport));
}

/**
 * Inset a sticky bar so its primary button cannot occupy the chrome zone.
 * Used by unit tests to prove the CSS padding contract.
 */
export function bayClearanceBox(
  bar: BayBox,
  viewport: { width: number; height: number },
): BayBox {
  const reserved = bayChromeReservedRect(viewport);
  const right = Math.max(bar.x, reserved.x);
  const bottom = Math.max(bar.y, reserved.y);
  return {
    x: bar.x,
    y: bar.y,
    width: Math.max(0, right - bar.x),
    height: Math.max(0, bottom - bar.y),
  };
}

function elementFromTarget(target: EventTarget | null): { closest: (sel: string) => unknown } | null {
  if (target && typeof (target as { closest?: unknown }).closest === "function") {
    return target as unknown as { closest: (sel: string) => unknown };
  }
  const parent = target && (target as { parentElement?: { closest?: unknown } }).parentElement;
  if (parent && typeof parent.closest === "function") {
    return parent as unknown as { closest: (sel: string) => unknown };
  }
  return null;
}

/**
 * True when the event started on platform overlay chrome — the Grok / Remix
 * pill, or any other fixed layer that is not CartScope's bay bar, form, or
 * Helper. Never true for the Save button itself (`[data-bay-primary]`).
 */
export function isOverlayChrome(target: EventTarget | null): boolean {
  const el = elementFromTarget(target);
  if (!el) return false;
  if (el.closest("#grok-pill-sim")) return true;
  if (
    el.closest(
      "[data-bay-primary], [data-bay-chrome], [data-bay-form], [data-bay-helper], [data-start-checks]",
    )
  ) {
    return false;
  }
  return true;
}

/** Point is on Job header Start — never treat that as a Save steal. */
export function pointHitsBayStart(clientX: number, clientY: number): boolean {
  if (typeof document === "undefined") return false;
  const start = document.querySelector("[data-start-checks]");
  if (!(start instanceof Element)) return false;
  const r = start.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

/** Point overlaps the Save row, or the reserved bottom-right pill slot. */
export function pointHitsBaySave(clientX: number, clientY: number): boolean {
  if (pointHitsBayStart(clientX, clientY)) return false;
  if (typeof document === "undefined") return false;
  const save = document.querySelector("[data-bay-primary]");
  if (save instanceof Element) {
    const r = save.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return true;
    }
  }
  const bar = document.querySelector("[data-bay-chrome]");
  if (bar instanceof Element) {
    const r = bar.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return true;
    }
  }
  if (typeof window === "undefined") return false;
  return pointInRect({ x: clientX, y: clientY }, bayChromeReservedRect({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
}
