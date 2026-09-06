/** Year support comes only from each pack's `years` string. No invented catalogs. */

export type YearRange = {
  min: number;
  max: number;
  openEnded: boolean;
};

export type YearCompatibility =
  | { status: "ok" }
  | { status: "unknown" }
  | { status: "unsupported"; message: string; range: YearRange };

const RANGE_RE = /(19|20)\d{2}\s*[–—-]\s*(19|20)\d{2}\+?/g;
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
  if (ranges.length === 0) return { status: "unknown" };
  if (yearInRanges(year, ranges)) return { status: "ok" };

  const range = ranges[0]!;
  const span = formatPackYears(ranges);
  return {
    status: "unsupported",
    range,
    message:
      `${input.packName} is not supported for ${year}. The factory book on file covers ${span}. ` +
      `Enter a year in that range, or pick a different cart pack.`,
  };
}
