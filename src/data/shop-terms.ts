/** Official shop names for drive parts. Customer slang may stay in the complaint note. */

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/big click switch \(solenoid\)/gi, "solenoid"],
  [/click switch \(solenoid\)/gi, "solenoid"],
  [/starter click switch/gi, "starter solenoid"],
  [/big click switches/gi, "solenoids"],
  [/big click switch/gi, "solenoid"],
  [/click-switch/gi, "solenoid"],
  [/click switch/gi, "solenoid"],
  [/\bclicker\b/gi, "solenoid"],
  [/speed box \(controller\)/gi, "controller"],
  [/speed box \(power box\)/gi, "controller"],
  [/speed boxes/gi, "controllers"],
  [/swap-speed-box/gi, "swap-controller"],
  [/speed-box/gi, "controller"],
  [/speed box/gi, "controller"],
  [/\bspeedbox\b/gi, "controller"],
];

function restoreSentenceCase(original: string, next: string): string {
  if (!next) return next;
  const origStart = original.match(/[A-Za-z]/);
  const nextStart = next.match(/[A-Za-z]/);
  if (!origStart || !nextStart) return next;
  if (origStart[0] === origStart[0].toUpperCase() && origStart[0] !== origStart[0].toLowerCase()) {
    const i = next.indexOf(nextStart[0]);
    return next.slice(0, i) + nextStart[0].toUpperCase() + next.slice(i + 1);
  }
  return next;
}

export function rewriteShopTerms(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, (match) => restoreSentenceCase(match, replacement));
  }
  return out;
}

export function textHasSlangPartName(text: string): boolean {
  return /speed\s*box|speedbox|clicker|\bbig click switch\b|\bclick switch\b|\bclick-switch\b/i.test(text);
}

export const CONTROLLER_WORD = "controller";
export const SOLENOID_WORD = "solenoid";

export function applyShopTermsToPack<T extends { [key: string]: unknown } | unknown>(value: T): T {
  if (typeof value === "string") return rewriteShopTerms(value) as T;
  if (Array.isArray(value)) return value.map((v) => applyShopTermsToPack(v)) as T;
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      next[k] = applyShopTermsToPack(v);
    }
    return next as T;
  }
  return value;
}
