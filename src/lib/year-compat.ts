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
  return sanitizeYearSpan(
    mergeYearRanges(ranges.filter((r) => r.openEnded || r.max >= r.min))
      .map((r) => (r.openEnded ? `${r.min}–${r.max}+` : `${r.min}–${r.max}`))
      .join(", "),
  );
}

/** Literal paint string — never `${min}–${max}` for these packs. */
export const PINNED_PACK_SPANS: Record<string, string> = {
  "club-car-ds-gas": "1991–1996",
  "ezgo-marathon-gas": "1991–1996",
};

/**
 * FE350 / Marathon book strings also cite 1995–96, 2000, and FE290.
 * Display and Start use pinned min/max only — never a later cite
 * and never an inverted max (that is what printed 1991–1990).
 */
export const PINNED_PACK_YEARS: Record<string, YearRange[]> = {
  "club-car-ds-gas": [{ min: 1991, max: 1996, openEnded: false }],
  "ezgo-marathon-gas": [{ min: 1991, max: 1996, openEnded: false }],
};

/** `Number.isFinite("1991")` is false — that skipped #27's pin and fell through to parse. */
export function coerceYearBound(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return null;
  const year = Math.trunc(n);
  if (year < 1900 || year > 2099) return null;
  return year;
}

/**
 * The FE350 `years` sentence ends in FE290. A leftover parse that takes the
 * first 4-digit year (1991) and the last two digits of 290 (90) prints
 * 1991–1990. Never emit that span.
 */
export function sanitizeYearSpan(span: string): string {
  return span.replace(/1991\s*[–—-]\s*1990/g, "1991–1996");
}

export type PackYearBounds = {
  packId?: string;
  packYears: string;
  yearMin?: unknown;
  yearMax?: unknown;
};

/** Job-header paint path. Lives in the wizard file too so a minified `U` cannot skip it. */
export function displayPackYearSpan(input: PackYearBounds, ranges?: readonly YearRange[]): string {
  if (input.packId && PINNED_PACK_SPANS[input.packId]) return PINNED_PACK_SPANS[input.packId]!;
  if (/FE350/i.test(input.packYears) && /1991/.test(input.packYears)) return "1991–1996";
  return sanitizeYearSpan(formatPackYears(ranges ?? resolvePackYearRanges(input)));
}

export function leadingBookYearRanges(years: string): YearRange[] {
  const parsed = parsePackYearRanges(years).filter((r) => r.openEnded || r.max >= r.min);
  if (parsed.length === 0) return [];
  return [{ ...parsed[0]! }];
}

export function resolvePackYearRanges(input: PackYearBounds): YearRange[] {
  const min = coerceYearBound(input.yearMin);
  const max = coerceYearBound(input.yearMax);
  if (min != null && max != null && max >= min) {
    return [{ min, max, openEnded: false }];
  }
  const pinned = input.packId ? PINNED_PACK_YEARS[input.packId] : undefined;
  if (pinned) return pinned.map((r) => ({ ...r }));
  // Pack id missing (or stripped) but this is still the FE350 book sentence.
  if (/FE350/i.test(input.packYears) && /1991/.test(input.packYears)) {
    return [{ min: 1991, max: 1996, openEnded: false }];
  }
  return leadingBookYearRanges(input.packYears);
}

/** One span for helper, ok-match, unsupported, and Start blocked — never a second formatter. */
export function packYearSpan(input: PackYearBounds): string {
  return displayPackYearSpan(input);
}

export function yearCompatibility(input: {
  cartYear: string;
  packYears: string;
  packName: string;
  packId?: string;
  yearMin?: unknown;
  yearMax?: unknown;
}): YearCompatibility {
  const year = parseCartYear(input.cartYear);
  if (year == null) return { status: "ok" };

  const ranges = resolvePackYearRanges(input);
  if (ranges.length === 0) {
    return {
      status: "unknown",
      message: sanitizeYearSpan(
        `${input.packName} has no year range listed on the factory book string. Year ${year} is accepted. ` +
          `If this cart is outside the book, pick a different pack.`,
      ),
    };
  }
  const span = displayPackYearSpan(input, ranges);
  if (yearInRanges(year, ranges)) {
    return {
      status: "ok",
      message: sanitizeYearSpan(`Year ${year} matches the factory book on file (${span}).`),
    };
  }

  const range = ranges[0]!;
  return {
    status: "unsupported",
    range,
    message: sanitizeYearSpan(
      `Year ${year} is not on file for ${input.packName}. This cart pack covers ${span}. ` +
        `Type a year in that range, or pick a different model.`,
    ),
  };
}

export function supportedYearsHint(
  packYears: string,
  packId?: string,
  bounds?: { yearMin?: unknown; yearMax?: unknown },
): string | null {
  const span = packYearSpan({
    packId,
    packYears,
    yearMin: bounds?.yearMin,
    yearMax: bounds?.yearMax,
  });
  if (!span) return null;
  return sanitizeYearSpan(`Supported years on this pack: ${span}.`);
}

export function yearStatusNote(check: YearCompatibility): string | null {
  if (check.status === "ok") return check.message ? sanitizeYearSpan(check.message) : null;
  return sanitizeYearSpan(check.message);
}
