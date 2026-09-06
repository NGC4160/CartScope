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

const RANGE_RE = /(19|20)\d{2}\s*[–—-]\s*(19|20)\d{2}\+?/g;
const SHORT_RANGE_RE = /((?:19|20)\d{2})\s*[–—-]\s*(\d{2})(?!\d)/g;
const STARTING_RE = /starting model year\s+((?:19|20)\d{2})/i;

export function parseCartYear(raw: string): number | null {
  const t = raw.trim();
  if (!/^(19|20)\d{2}$/.test(t)) return null;
  return Number(t);
}

export function parsePackYearRanges(years: string): YearRange[] {
  const ranges: YearRange[] = [];
  const seen = new Set<string>();

  for (const match of years.matchAll(RANGE_RE)) {
    const chunk = match[0];
    const nums = chunk.match(/(19|20)\d{2}/g);
    if (!nums || nums.length < 2) continue;
    const min = Number(nums[0]);
    const max = Number(nums[1]);
    const openEnded = /\+$/.test(chunk.trim());
    const key = `${min}-${max}-${openEnded}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ranges.push({ min, max, openEnded });
  }

  for (const match of years.matchAll(SHORT_RANGE_RE)) {
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

export function formatPackYears(ranges: readonly YearRange[]): string {
  return ranges
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
      `${input.packName} is not supported for ${year}. The factory book on file covers ${span}. ` +
      `Enter a year in that range, or pick a different cart pack.`,
  };
}

export function yearStatusNote(check: YearCompatibility): string | null {
  if (check.status === "ok") return check.message ?? null;
  return check.message;
}
