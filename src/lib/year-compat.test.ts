import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCartYear,
  parsePackYearRanges,
  supportedYearsHint,
  yearCompatibility,
  yearInRanges,
} from "./year-compat.ts";

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

test("empty or non-year text does not block start", () => {
  assert.equal(parseCartYear(""), null);
  assert.equal(parseCartYear("late"), null);
  const empty = yearCompatibility({
    cartYear: "",
    packYears: YDRA_YEARS,
    packName: "Yamaha YDRA / Drive gasoline (G29 gas)",
  });
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
