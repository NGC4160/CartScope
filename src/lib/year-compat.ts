/** Year support comes only from each pack's `years` string. No invented catalogs. */

export type YearRange = {
  min: number;
  max: number;
  openEnded: boolean;
};

export type YearCompatibility =
  | { status: "ok"; message?: string }
  | { status: "unknown"; message: string }
  | { status: "unsupported"; message: string; range: YearRange };

const RANGE_RE_SRC = String.raw`(19|20)\d{2}\s*[–—-]\s*(19|20)\d{2}\+?`;
const SHORT_RANGE_RE_SRC = String.raw`((?:19|20)\d{2})\s*[–—-]\s*(\d{2})(?!\d)`;
const STARTING_RE = /starting model year\s+((?:19|20)\d{2})/i;

/** Digits only, max four. Never clamp to a pack max (that is what turned 1996 into 1990). */
export function sanitizeCartYearInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export function parseCartYear(raw: string): number | null {
  const t = sanitizeCartYearInput(raw);
  if (!/^(19|20)\d{2}$/.test(t)) return null;
  return Number(t);
}

/**
 * Fresh `/g` regexes each call. A module-level `/g` lastIndex is what left
 * FE350 looking like 1991–1990 after an earlier parse on another pack.
 */
export function parsePackYearRanges(years: string): YearRange[] {
  const ranges: YearRange[] = [];
  const seen = new Set<string>();
  const rangeRe = new RegExp(RANGE_RE_SRC, "g");
  const shortRe = new RegExp(SHORT_RANGE_RE_SRC, "g");

  for (const match of years.matchAll(rangeRe)) {
    const chunk = match[0];
    const nums = chunk.match(/(19|20)\d{2}/g);
    if (!nums || nums.length < 2) continue;
    const min = Number(nums[0]);
    const max = Number(nums[1]);
    const openEnded = /\+$/.test(chunk.trim());
    if (!openEnded && max < min) continue;
    const key = `${min}-${max}-${openEnded}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ranges.push({ min, max, openEnded });
  }

  for (const match of years.matchAll(shortRe)) {
    const min = Number(match[1]);
    const tail = Number(match[2]);
    if (!Number.isFinite(min) || !Number.isFinite(tail)) continue;
    const max = Math.floor(min / 100) * 100 + tail;
    if (max < min || max - min > 20) continue;
    const key = `${min}-${max}-false`;
    if (seen.has(key)) continue;
    seen.add(key);
    ranges.push({ min, max, openEnded: false });
  }

  const starting = years.match(STARTING_RE);
  if (starting) {
    const min = Number(starting[1]);
    const key = `${min}-∞-true`;
    if (!seen.has(key)) {
      seen.add(key);
      ranges.push({ min, max: min, openEnded: true });
    }
  }

  return ranges;
}

export function yearInRanges(year: number, ranges: readonly YearRange[]): boolean {
  return ranges.some((r) => year >= r.min && (r.openEnded || year <= r.max));
}

/** Collapse overlapping book cites (e.g. 1991–1996 plus 1995–96) into one span. */
export function mergeYearRanges(ranges: readonly YearRange[]): YearRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.min - b.min || a.max - b.max);
  const out: YearRange[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (!last) {
      out.push({ ...r });
      continue;
    }
    const lastEnd = last.openEnded ? Number.POSITIVE_INFINITY : last.max;
    if (r.min <= lastEnd + 1) {
      last.openEnded = last.openEnded || r.openEnded;
      last.max = Math.max(last.max, r.max);
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

export function formatPackYears(ranges: readonly YearRange[]): string {
  return mergeYearRanges(ranges.filter((r) => r.openEnded || r.max >= r.min))
    .map((r) => (r.openEnded ? `${r.min}–${r.max}+` : `${r.min}–${r.max}`))
    .join(", ");
}

export function yearCompatibility(input: {
  cartYear: string;
  packYears: string;
  packName: string;
}): YearCompatibility {
  const year = parseCartYear(input.cartYear);
  if (year == null) return { status: "ok" };

  const ranges = parsePackYearRanges(input.packYears);
  if (ranges.length === 0) {
    return {
      status: "unknown",
      message:
        `${input.packName} has no year range listed on the factory book string. Year ${year} is accepted. ` +
        `If this cart is outside the book, pick a different pack.`,
    };
  }
  const span = formatPackYears(ranges);
  if (yearInRanges(year, ranges)) {
    return {
      status: "ok",
      message: `Year ${year} matches the factory book on file (${span}).`,
    };
  }

  const range = ranges[0]!;
  return {
    status: "unsupported",
    range,
    message:
      `Year ${year} is not on file for ${input.packName}. This cart pack covers ${span}. ` +
      `Type a year in that range, or pick a different model.`,
  };
}

export function supportedYearsHint(packYears: string): string | null {
  const ranges = parsePackYearRanges(packYears);
  if (ranges.length === 0) return null;
  return `Supported years on this pack: ${formatPackYears(ranges)}.`;
}

export function yearStatusNote(check: YearCompatibility): string | null {
  if (check.status === "ok") return check.message ?? null;
  return check.message;
}
