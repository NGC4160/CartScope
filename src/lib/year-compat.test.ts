import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  coerceYearBound,
  displayPackYearSpan,
  formatPackYears,
  packYearSpan,
  parseCartYear,
  parsePackYearRanges,
  resolvePackYearRanges,
  sanitizeCartYearInput,
  sanitizeYearSpan,
  supportedYearsHint,
  yearCompatibility,
  yearInRanges,
  yearIssueLine,
} from "./year-compat.ts";

const FE350_YEARS =
  "1991–1996 Club Car DS gasoline (Kawasaki FE350; 1995–96 DS gas/electric; 2000 Club Car Service Manual). FE290 DS/Villager is a separate pack.";

/** Real `years` strings from pack files — not an invented catalog. */
const YDRA_YEARS =
  "2007–2016 Drive / G29 gasoline (YDRA/E Service Manual LIT-19626, 2016, chapters 8–9)";
const EZGO_TXT_YEARS =
  "TXT 48 V TCT (48V TXT Service Manual, Electronic Speed Control — TCT, Section E) — Fleet / Freedom 48 V TCT";
const TXT_GAS_YEARS =
  "Starting model year 2007 TXT gasoline (manual 605586, Jan 2007) — Fleet Golf Car (9 hp, CE, CARB), Freedom (9 hp, CE, CARB, SE, LE, HP), Shuttle 2+2 (9 hp, CE, CARB)";
const RXV_YEARS = "2008–2012+ RXV AC (RXV Fleet, Freedom, Shuttle 2+2 electric service manual, Section O)";

test("YDRA 2007–2016 range accepts 2016 and rejects 2018", () => {
  const ranges = parsePackYearRanges(YDRA_YEARS);
  assert.ok(ranges.length >= 1);
  assert.equal(ranges[0]?.min, 2007);
  assert.equal(ranges[0]?.max, 2016);
  assert.equal(yearInRanges(2016, ranges), true);
  assert.equal(yearInRanges(2007, ranges), true);
  assert.equal(yearInRanges(2018, ranges), false);

  const ok = yearCompatibility({
    cartYear: "2016",
    packYears: YDRA_YEARS,
    packName: "Yamaha YDRA / Drive gasoline (G29 gas)",
  });
  assert.equal(ok.status, "ok");
  if (ok.status === "ok") {
    assert.match(ok.message ?? "", /2016/);
    assert.match(ok.message ?? "", /2007–2016/);
  }

  const bad = yearCompatibility({
    cartYear: "2018",
    packYears: YDRA_YEARS,
    packName: "Yamaha YDRA / Drive gasoline (G29 gas)",
  });
  assert.equal(bad.status, "unsupported");
  if (bad.status === "unsupported") {
    assert.match(bad.message, /2018/);
    assert.match(bad.message, /2007/);
    assert.match(bad.message, /2016/);
  }
});

test("EZ-GO TXT TCT years have no numeric range so 2019 is not marked unsupported", () => {
  assert.deepEqual(parsePackYearRanges(EZGO_TXT_YEARS), []);
  const check = yearCompatibility({
    cartYear: "2019",
    packYears: EZGO_TXT_YEARS,
    packName: "EZ-GO TXT 48 V TCT (Curtis 1206HB-5201)",
  });
  assert.equal(check.status, "unknown");
});

test("empty or non-year text is not a pack-range mismatch", () => {
  assert.equal(parseCartYear(""), null);
  assert.equal(parseCartYear("late"), null);
  const empty = yearCompatibility({
    cartYear: "",
    packYears: YDRA_YEARS,
    packName: "Yamaha YDRA / Drive gasoline (G29 gas)",
  });
  // Presence is a Start header gate; range check stays silent until a year is typed.
  assert.equal(empty.status, "ok");
});

test("V-Glide 1994–2000 and short 1995–96 both accept 1994", () => {
  const years =
    "1994–2000 DS V-Glide 36 V (1994 DS M&S; 1995–96 Section 19; 2000 supplement 102067504)";
  const ranges = parsePackYearRanges(years);
  assert.ok(ranges.some((r) => r.min === 1994 && r.max === 2000));
  assert.ok(ranges.some((r) => r.min === 1995 && r.max === 1996));
  assert.equal(yearInRanges(1994, ranges), true);
  const check = yearCompatibility({
    cartYear: "1994",
    packYears: years,
    packName: "Club Car DS V-Glide 36 Volt",
  });
  assert.equal(check.status, "ok");
  if (check.status === "ok") {
    assert.match(check.message ?? "", /1994/);
    assert.match(check.message ?? "", /1994–2000/);
  }
});

test("cart year typing keeps 1996 and never rewrites it to 1990", () => {
  let typed = "";
  for (const ch of "1996") {
    typed = sanitizeCartYearInput(typed + ch);
  }
  assert.equal(typed, "1996");
  assert.equal(sanitizeCartYearInput("1996"), "1996");
  assert.equal(sanitizeCartYearInput("1996 "), "1996");
  assert.equal(sanitizeCartYearInput("19-96"), "1996");
  assert.equal(parseCartYear("1996"), 1996);
  assert.notEqual(sanitizeCartYearInput("1996"), "1990");
});

test("formatPackYears never emits an inverted 1991–1990 span", () => {
  assert.equal(formatPackYears([{ min: 1991, max: 1990, openEnded: false }]), "");
  assert.equal(
    formatPackYears([
      { min: 1991, max: 1996, openEnded: false },
      { min: 1991, max: 1990, openEnded: false },
    ]),
    "1991–1996",
  );
});

test("FE350 pack id pins 1991–1996 even when the book sentence is noisy", () => {
  const ranges = resolvePackYearRanges({
    packId: "club-car-ds-gas",
    packYears: "FE290 leftover 2000 manual 1995–96",
    yearMin: 1991,
    yearMax: 1996,
  });
  assert.deepEqual(ranges, [{ min: 1991, max: 1996, openEnded: false }]);
  const hint = supportedYearsHint("not a range", "club-car-ds-gas", { yearMin: 1991, yearMax: 1996 });
  assert.match(hint ?? "", /1991–1996/);
  assert.doesNotMatch(hint ?? "", /1991–1990/);
  const bad = yearCompatibility({
    cartYear: "2010",
    packYears: "not a range",
    packName: "Club Car DS gasoline (Kawasaki FE350)",
    packId: "club-car-ds-gas",
    yearMin: 1991,
    yearMax: 1996,
  });
  assert.equal(bad.status, "unsupported");
  if (bad.status === "unsupported") {
    assert.match(bad.message, /1991–1996/);
    assert.doesNotMatch(bad.message, /1991–1990/);
  }
});

test("FE350 year parse is stable across repeated calls (no shared /g lastIndex)", () => {
  for (let i = 0; i < 5; i += 1) {
    const ranges = parsePackYearRanges(FE350_YEARS);
    const hint = supportedYearsHint(FE350_YEARS);
    assert.ok(ranges.some((r) => r.min === 1991 && r.max === 1996), `pass ${i}`);
    assert.match(hint ?? "", /1991–1996/);
    assert.doesNotMatch(hint ?? "", /1991–1990/);
    assert.doesNotMatch(hint ?? "", /1995–1996/);
  }
});

test("DS FE350 pack years start at 1991–1996 and accept 1991 and 1996", () => {
  const src = readFileSync(new URL("../data/packs/club-car-ds-gas.ts", import.meta.url), "utf8");
  assert.match(src, /1991–1996 Club Car DS gasoline/);
  assert.match(src, /yearMin:\s*1991/);
  assert.match(src, /yearMax:\s*1996/);
  const ranges = parsePackYearRanges(FE350_YEARS);
  assert.ok(ranges.some((r) => r.min === 1991 && r.max === 1996));
  assert.equal(yearInRanges(1991, ranges), true);
  assert.equal(yearInRanges(1996, ranges), true);
  assert.equal(yearInRanges(2010, ranges), false);
  const hint = supportedYearsHint(FE350_YEARS);
  assert.match(hint ?? "", /1991–1996/);
  assert.doesNotMatch(hint ?? "", /1991–1990/);
  assert.doesNotMatch(hint ?? "", /1995–1996/);
  const ok = yearCompatibility({
    cartYear: "1996",
    packYears: FE350_YEARS,
    packName: "Club Car DS gasoline (Kawasaki FE350)",
    packId: "club-car-ds-gas",
    yearMin: 1991,
    yearMax: 1996,
  });
  assert.equal(ok.status, "ok");
  const bad = yearCompatibility({
    cartYear: "2010",
    packYears: FE350_YEARS,
    packName: "Club Car DS gasoline (Kawasaki FE350)",
    packId: "club-car-ds-gas",
    yearMin: 1991,
    yearMax: 1996,
  });
  assert.equal(bad.status, "unsupported");
  if (bad.status === "unsupported") {
    assert.match(bad.message, /2010/);
    assert.match(bad.message, /1991–1996/);
    assert.doesNotMatch(bad.message, /1995–1996/);
  }
});

test("Marathon 1991–1996 rejects 2010 and names the supported years", () => {
  const years =
    "1991–1996 4-cycle gasoline (manual 27206-G01): GX-444, GX-444F Freedom, GX-444F HP, 1992–1994 GXT/1-804, TUFF1, 1992–1995 PC4GX / PC4GXI, 1992–1994 BC-360";
  const hint = supportedYearsHint(years);
  assert.match(hint ?? "", /1991–1996/);
  const bad = yearCompatibility({
    cartYear: "2010",
    packYears: years,
    packName: "EZ-GO Marathon 4-cycle / GX-444 / Freedom / GXT / TUFF1 / PC4GX / BC-360",
  });
  assert.equal(bad.status, "unsupported");
  if (bad.status === "unsupported") {
    assert.match(bad.message, /2010/);
    assert.match(bad.message, /1991–1996/);
    assert.match(bad.message, /different model/i);
  }
  const ok = yearCompatibility({
    cartYear: "1996",
    packYears: years,
    packName: "EZ-GO Marathon 4-cycle / GX-444 / Freedom / GXT / TUFF1 / PC4GX / BC-360",
  });
  assert.equal(ok.status, "ok");
});

test("starting-model-year and open-ended plus ranges parse from real pack copy", () => {
  const starting = parsePackYearRanges(TXT_GAS_YEARS);
  assert.equal(starting.length, 1);
  assert.equal(starting[0]?.min, 2007);
  assert.equal(starting[0]?.openEnded, true);
  assert.equal(yearInRanges(2019, starting), true);
  assert.equal(yearInRanges(2006, starting), false);

  const plus = parsePackYearRanges(RXV_YEARS);
  assert.equal(plus[0]?.min, 2008);
  assert.equal(plus[0]?.max, 2012);
  assert.equal(plus[0]?.openEnded, true);
  assert.equal(yearInRanges(2016, plus), true);
});

test("numeric-string yearMin/yearMax still pin FE350 — Number.isFinite skipped #27's pin", () => {
  assert.equal(coerceYearBound("1991"), 1991);
  assert.equal(coerceYearBound("1996"), 1996);
  assert.equal(Number.isFinite("1991"), false);
  const ranges = resolvePackYearRanges({
    packId: "club-car-ds-gas",
    packYears: "not a range",
    yearMin: "1991",
    yearMax: "1996",
  });
  assert.deepEqual(ranges, [{ min: 1991, max: 1996, openEnded: false }]);
});

test("FE350 book sentence without bounds still pins 1991–1996 (FE290 tail used to print 1991–1990)", () => {
  const nums = [...FE350_YEARS.matchAll(/\d{2,4}/g)].map((m) => m[0]);
  const last = nums.at(-1) ?? "";
  const leftover = `1991–${1900 + Number(String(last).slice(-2))}`;
  assert.equal(last, "290");
  assert.equal(leftover, "1991–1990");
  assert.equal(sanitizeYearSpan(leftover), "1991–1996");
  assert.equal(sanitizeYearSpan("Year 1996 matches the factory book on file (1991–1990)."), "Year 1996 matches the factory book on file (1991–1996).");
  assert.equal(sanitizeYearSpan("This cart pack covers 1991-1990."), "This cart pack covers 1991–1996.");
  assert.equal(packYearSpan({ packYears: FE350_YEARS }), "1991–1996");
  assert.equal(packYearSpan({ packYears: FE350_YEARS, packId: "club-car-ds-gas" }), "1991–1996");
  assert.equal(packYearSpan({ packYears: "garbage", packId: "club-car-ds-gas", yearMin: 1991, yearMax: 1990 }), "1991–1996");
  assert.equal(
    displayPackYearSpan({ packYears: FE350_YEARS, packId: "club-car-ds-gas" }, [{ min: 1991, max: 1990, openEnded: true }]),
    "1991–1996",
  );
});

test("FE350 helper and unsupported banner are the same string across two calls", () => {
  const args = {
    cartYear: "2010",
    packYears: FE350_YEARS,
    packName: "Club Car DS gasoline (Kawasaki FE350)",
    packId: "club-car-ds-gas",
    yearMin: "1991",
    yearMax: "1996",
  };
  const field = yearCompatibility(args);
  const banner = yearCompatibility(args);
  assert.equal(field.status, "unsupported");
  assert.equal(banner.status, "unsupported");
  if (field.status === "unsupported" && banner.status === "unsupported") {
    assert.equal(field.message, banner.message);
    assert.match(field.message, /1991–1996/);
    assert.doesNotMatch(field.message, /1991–1990/);
    assert.equal(yearIssueLine(field), field.message);
    assert.equal(yearIssueLine(banner), yearIssueLine(field));
  }
  const ok = yearCompatibility({ ...args, cartYear: "1996" });
  assert.equal(ok.status, "ok");
  if (ok.status === "ok") {
    assert.match(ok.message ?? "", /1991–1996/);
    assert.doesNotMatch(ok.message ?? "", /1991–1990/);
  }
});

test("yearIssueLine rewrites an inverted 1991–1990 banner onto the field 1991–1996 string", () => {
  const inverted = {
    status: "unsupported" as const,
    range: { min: 1991, max: 1990, openEnded: false },
    message:
      "Year 2010 is not on file for Club Car DS gasoline (Kawasaki FE350). This cart pack covers 1991–1990. Type a year in that range, or pick a different model.",
  };
  const line = yearIssueLine(inverted);
  assert.ok(line);
  assert.match(line, /2010/);
  assert.match(line, /1991–1996/);
  assert.doesNotMatch(line, /1991–1990/);
  assert.equal(line, yearIssueLine(inverted));
});
