import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CART_CATALOG } from "../data/cart-catalog.ts";
import {
  applyCartQuestion,
  detectFamily,
  foldCartText,
  normalizeCartYear,
  normalizeMake,
  resolveCart,
} from "./cart-resolve.ts";

function matchId(year: string | number | undefined, make: string, model: string) {
  const result = resolveCart({ year, make, model });
  assert.equal(result.status, "match", `${year} ${make} ${model}: ${result.status === "none" || result.status === "need-input" ? result.message : ""}`);
  if (result.status !== "match") throw new Error("expected match");
  assert.equal(result.picker, false);
  return result;
}

test("normalizes year, make, model aliases and case", () => {
  assert.equal(normalizeCartYear(2011), 2011);
  assert.equal(normalizeCartYear("2011"), 2011);
  assert.equal(normalizeCartYear(" 2011 "), 2011);
  assert.equal(foldCartText("  Club   Car  "), "club car");
  assert.equal(normalizeMake("CLUB CAR"), "club-car");
  assert.equal(normalizeMake("ClubCar"), "club-car");
  assert.equal(normalizeMake("ez-go"), "ezgo");
  assert.equal(normalizeMake("EZGO"), "ezgo");
  assert.equal(normalizeMake("E-Z-GO"), "ezgo");
  assert.equal(normalizeMake("yamaha"), "yamaha");
  assert.equal(detectFamily("Club Car Precedent"), "precedent");
  assert.equal(detectFamily("EZ-GO TXT"), "txt");
  assert.equal(detectFamily("Drive2"), "drive2");
  assert.equal(detectFamily("Onward"), "onward");
  assert.equal(detectFamily("RXV"), "rxv");
});

test("2011 Club Car Precedent opens Precedent IQ with no picker", () => {
  const result = matchId(2011, "Club Car", "Precedent");
  assert.equal(result.packId, "club-car-precedent-iq");
  assert.equal(result.question, null);
});

test("2015 Club Car Precedent opens Precedent ERIC with no picker", () => {
  const result = matchId(2015, "Club Car", "Precedent");
  assert.equal(result.packId, "club-car-precedent-eric");
  assert.equal(result.question, null);
});

test("2019 Club Car Tempo opens the 2014–2019 Precedent ERIC book with no picker", () => {
  const result = matchId(2019, "Club Car", "Tempo");
  assert.equal(result.packId, "club-car-precedent-eric");
  assert.equal(result.question, null);
});

test("2008 EZ-GO TXT opens TXT 48 V TCT with no picker", () => {
  const result = matchId(2008, "EZ-GO", "TXT");
  assert.equal(result.packId, "ezgo-txt-tct");
  assert.equal(result.question, null);
});

test("2021 Yamaha Drive2 opens YDRE AC with no picker", () => {
  const result = matchId(2021, "Yamaha", "Drive2");
  assert.equal(result.packId, "yamaha-ydre-ac");
  assert.equal(result.question, null);
});

test("Club Car Onward without a year opens Tempo ERIC with no picker", () => {
  const result = matchId(undefined, "Club Car", "Onward");
  assert.equal(result.packId, "club-car-tempo-eric");
  assert.equal(result.question, null);
});

test("EZ-GO RXV without a year opens RXV AC with no picker", () => {
  const result = matchId(undefined, "EZ-GO", "RXV");
  assert.equal(result.packId, "ezgo-rxv-ac");
  assert.equal(result.question, null);
});

test("alias and case variations still resolve to one cart", () => {
  assert.equal(matchId("2011", "clubcar", "precedent").packId, "club-car-precedent-iq");
  assert.equal(matchId(2011, "CLUB CAR", "CLUB CAR PRECEDENT").packId, "club-car-precedent-iq");
  assert.equal(matchId("2015", "ClubCar", "  PreceDent  ").packId, "club-car-precedent-eric");
  assert.equal(matchId(2019, "club car", "tempo").packId, "club-car-precedent-eric");
  assert.equal(matchId("2008", "ez go", "EZ-GO TXT").packId, "ezgo-txt-tct");
  assert.equal(matchId(2008, "e-z-go", "txt").packId, "ezgo-txt-tct");
  assert.equal(matchId("2021", "YAMAHA", "drive 2").packId, "yamaha-ydre-ac");
  assert.equal(matchId(2021, "yamaha", "Drive-2").packId, "yamaha-ydre-ac");
  assert.equal(matchId("", "club car", "ONWARD").packId, "club-car-tempo-eric");
  assert.equal(matchId(undefined, "ezgo", "rxv").packId, "ezgo-rxv-ac");
});

test("model typed into the make/model blob still finds the cart", () => {
  assert.equal(matchId(2011, "", "2011 Club Car Precedent").packId, "club-car-precedent-iq");
  assert.equal(matchId(2008, "", "EZ-GO TXT").packId, "ezgo-txt-tct");
});

test("no exact match names the closest year range instead of a list", () => {
  const result = resolveCart({ year: 1995, make: "Club Car", model: "Precedent" });
  assert.equal(result.status, "none");
  if (result.status !== "none") throw new Error("expected none");
  assert.equal(result.picker, false);
  assert.match(result.message, /no exact match/i);
  assert.match(result.message, /2004/);
  assert.ok(result.closestYearSpan);
  assert.doesNotMatch(result.message, /pick one|choose from|candidates/i);
});

test("2020 Club Car Tempo asks only gas or electric and keeps a default", () => {
  const result = matchId(2020, "Club Car", "Tempo");
  assert.equal(result.packId, "club-car-tempo-eric");
  assert.ok(result.question);
  assert.equal(result.question?.id, "powertrain");
  assert.equal(result.question?.prompt, "Gas or electric?");
  assert.equal(result.picker, false);
  const gas = applyCartQuestion({ year: 2020, make: "Club Car", model: "Tempo" }, "powertrain", "gasoline");
  assert.equal(gas.status, "match");
  if (gas.status === "match") assert.equal(gas.packId, "club-car-tempo-gas");
});

test("catalog lists every pack id from the shop library", () => {
  const index = readFileSync(new URL("../data/index.ts", import.meta.url), "utf8");
  const ids = [...index.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]+),?$/gm)].map((m) => m[1]);
  assert.ok(ids.length >= 40, `expected pack exports, got ${ids.length}`);
  const catalogIds = new Set(CART_CATALOG.map((row) => row.id));
  for (const expected of [
    "club-car-precedent-iq",
    "club-car-precedent-eric",
    "club-car-tempo-eric",
    "ezgo-txt-tct",
    "ezgo-rxv-ac",
    "yamaha-ydre-ac",
  ]) {
    assert.ok(catalogIds.has(expected), expected);
  }
  assert.equal(catalogIds.size, 45);
});

test("FE350, FE290, and DS IQ resolve from the name the bay scripts type", () => {
  assert.equal(matchId(1996, "Club Car", "FE350").packId, "club-car-ds-gas");
  assert.equal(matchId(undefined, "Club Car", "FE350").packId, "club-car-ds-gas");
  assert.equal(matchId(2008, "Club Car", "FE290").packId, "club-car-ds-fe290");
  assert.equal(matchId(2006, "Club Car", "DS IQ").packId, "club-car-ds-iq");
  assert.equal(matchId(1998, "Club Car", "DS PowerDrive 48").packId, "club-car-ds-electric");
  assert.equal(matchId(1996, "EZ-GO", "Marathon").packId, "ezgo-marathon-gas");
});

test("typed gas or 36 V skips the extra question", () => {
  const gas = matchId(2015, "Club Car", "Precedent gas");
  assert.equal(gas.packId, "club-car-precedent-gas");
  assert.equal(gas.question, null);
  const txt36 = matchId(2008, "EZ-GO", "TXT 36");
  assert.ok(txt36.packId === "ezgo-txt-36-non-pds" || txt36.packId === "ezgo-pds-36");
  assert.equal(txt36.question, null);
});

test("only same-year gas/electric or voltage ties keep one question", () => {
  const withQuestion: string[] = [];
  const probes: Array<[number, string, string]> = [
    [2004, "Club Car", "Precedent"],
    [2011, "Club Car", "Precedent"],
    [2012, "Club Car", "Precedent"],
    [2015, "Club Car", "Precedent"],
    [2019, "Club Car", "Tempo"],
    [2020, "Club Car", "Tempo"],
    [2021, "Club Car", "Onward"],
    [2008, "EZ-GO", "TXT"],
    [2010, "EZ-GO", "TXT"],
    [2008, "EZ-GO", "RXV"],
    [2018, "EZ-GO", "RXV"],
    [2010, "Yamaha", "Drive"],
    [2015, "Yamaha", "Drive"],
    [2021, "Yamaha", "Drive2"],
  ];
  for (const [year, make, model] of probes) {
    const result = resolveCart({ year, make, model });
    if (result.status === "match" && result.question) {
      withQuestion.push(`${year} ${make} ${model} → ${result.question.prompt} (default ${result.packId})`);
    }
  }
  assert.deepEqual(withQuestion, [
    "2020 Club Car Tempo → Gas or electric? (default club-car-tempo-eric)",
    "2021 Club Car Onward → Gas or electric? (default club-car-tempo-eric)",
    "2010 Yamaha Drive → Gas or electric? (default yamaha-ydre-dc)",
    "2015 Yamaha Drive → Gas or electric? (default yamaha-ydre-dc)",
  ]);
});
