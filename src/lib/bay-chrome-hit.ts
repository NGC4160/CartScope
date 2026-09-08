/**
 * Helper jump keeps a reserved lower-right pad. Sticky Save and Start do
 * not inset for that pad. Testers aim at the Save label, which is left-
 * aligned so the tap lands left of the Grok chat pill (PR #30 bay miss).
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
 * Live testers tap the right of sticky Save, under the Grok chat pill.
 * The pill is max z-index and steals click. A capture-phase pointerup still
 * sees those coordinates — treat a tap on the bar, or on the pill where it
 * overlaps the Save row, as Save. Helper jumps stay padded out of that zone.
 */
export function pointHitsBaySave(
  point: { x: number; y: number },
  bar: BayBox,
  viewport: { width: number; height: number },
): boolean {
  if (pointInRect(point, bar)) return true;
  const reserved = bayChromeReservedRect(viewport);
  if (!pointInRect(point, reserved)) return false;
  return point.y >= bar.y - 12 && point.y <= bar.y + bar.height + 12;
}

/**
 * Steal a pointerup only when the event landed on the sticky bar or on
 * overlay chrome (Grok pill). Observation picks / fields are buttons in
 * the form — stealing those ran Save before the pick committed, then the
 * lock ate the real Save tap.
 */
export function isBaySaveStealTarget(target: EventTarget | null): boolean {
  const el = target as { closest?: (sel: string) => unknown } | null;
  if (!el || typeof el.closest !== "function") return false;
  if (el.closest("[data-bay-secondary]")) return false;
  if (el.closest("[data-testid='bay-action-bar']")) return true;
  if (el.closest("#grok-pill-sim, [data-testid='grok-pill-sim']")) return true;
  if (
    el.closest(
      "input, textarea, select, button, a, label, [role='tab'], [role='checkbox'], [data-helper-jump], [data-testid='helper-redirect-list'], [data-bay-dock]",
    )
  ) {
    return false;
  }
  return true;
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
