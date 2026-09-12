import assert from "node:assert/strict";
import test from "node:test";
import type { ModelPack } from "../data/types.ts";
import { evaluateLeadAcid } from "./pack-rules.ts";
import {
  AS_FOUND_LABEL,
  FACTORY_BOOK_LAYOUT_LABEL,
  FIELD_MODIFIED_PACK_LABEL,
  asFoundLayout,
  asFoundPackVolts,
  formatCountByVolts,
  leadAcidMeasureHint,
  packLayout,
  packLayoutStampLines,
  parseAsFoundCellVolts,
  parseAsFoundCount,
  resolveLeadAcidLayout,
  scaledLeadAcidLimits,
} from "./pack-layout.ts";

function stubPack(partial: Pick<ModelPack, "id" | "voltage"> & Partial<ModelPack>): ModelPack {
  return {
    manufacturer: "club-car",
    manufacturerLabel: "Club Car",
    name: "Test",
    fullName: partial.fullName ?? "Test cart",
    powertrain: "electric",
    architecture: partial.architecture ?? "",
    years: "",
    diagramTitle: "",
    diagramNotes: partial.diagramNotes ?? [],
    components: [],
    wires: [],
    testPoints: [],
    symptoms: [],
    steps: {},
    diagnoses: {},
    ...partial,
  } as ModelPack;
}

const factory48 = stubPack({ id: "club-car-precedent-iq", voltage: 48, fullName: "Club Car Precedent IQ" });
const factory36 = stubPack({ id: "ezgo-pds-36", voltage: 36, fullName: "EZ-GO PDS 36 V" });
const factoryRxv = stubPack({ id: "ezgo-rxv-ac", voltage: 48, fullName: "EZ-GO RXV AC" });

test("factory book layout stays the default packLayout heuristic", () => {
  assert.deepEqual(packLayout(factory48), {
    count: 6,
    nominalV: 8,
    label: "Six 8 V batteries (48 V pack)",
  });
  assert.deepEqual(packLayout(factory36), {
    count: 6,
    nominalV: 6,
    label: "Six 6 V batteries (36 V pack)",
  });
  assert.deepEqual(packLayout(factoryRxv), {
    count: 4,
    nominalV: 12,
    label: "Four 12 V batteries (48 V pack)",
  });
  assert.deepEqual(resolveLeadAcidLayout(factory48, "factory-book"), packLayout(factory48));
  assert.deepEqual(resolveLeadAcidLayout(factory48, undefined), packLayout(factory48));
});

test("field-modified as-found is count × cell volts only", () => {
  assert.equal(asFoundPackVolts(4, 12), 48);
  assert.deepEqual(asFoundLayout(4, 12), {
    count: 4,
    nominalV: 12,
    label: "4 × 12 V batteries (48 V pack)",
  });
  const resolved = resolveLeadAcidLayout(factory48, "field-modified", 4, 12);
  assert.deepEqual(resolved, asFoundLayout(4, 12));
  assert.notEqual(resolved.count, packLayout(factory48).count);
  assert.equal(parseAsFoundCount("4"), 4);
  assert.equal(parseAsFoundCellVolts("12"), 12);
  assert.equal(parseAsFoundCount(""), undefined);
  assert.equal(parseAsFoundCellVolts(""), undefined);
});

test("field-modified without both as-found numbers keeps factory book", () => {
  assert.deepEqual(resolveLeadAcidLayout(factory48, "field-modified"), packLayout(factory48));
  assert.deepEqual(resolveLeadAcidLayout(factory48, "field-modified", 4), packLayout(factory48));
});

test("scaled lead-acid limits follow as-found cell volts", () => {
  const eight = scaledLeadAcidLimits(8);
  assert.equal(eight.restMin, 8.29);
  assert.equal(eight.chargeTarget, 8.49);
  assert.equal(eight.deadFloor, 8.07);

  const twelve = scaledLeadAcidLimits(12);
  assert.equal(twelve.restMin, 12.44);
  assert.equal(twelve.chargeTarget, 12.74);
  assert.equal(twelve.deadFloor, 12.11);
  assert.equal(twelve.spreadMax, 0.3);
  assert.equal(twelve.loadDropMaxPct, 5);

  const asFound = resolveLeadAcidLayout(factory48, "field-modified", 4, 12);
  assert.deepEqual(scaledLeadAcidLimits(asFound.nominalV), twelve);
});

test("evaluateLeadAcid uses as-found 12 V limits, not factory 8 V", () => {
  const fourAt1230 = [12.3, 12.3, 12.3, 12.3];
  const asFound = evaluateLeadAcid(fourAt1230, 12);
  assert.equal(asFound.pass, false);
  assert.match(asFound.issues.join(" "), /12 V battery is under 12\.44 V/);

  const factoryWouldPass = evaluateLeadAcid(fourAt1230, 8);
  assert.equal(factoryWouldPass.pass, true);

  const fourAt1280 = [12.8, 12.8, 12.8, 12.8];
  const asFoundPass = evaluateLeadAcid(fourAt1280, 12);
  assert.equal(asFoundPass.pass, true);
});

test("stamp lines keep Factory book layout and Field-modified as-found", () => {
  assert.equal(formatCountByVolts(6, 8), "6 × 8 V");
  const factoryOnly = packLayoutStampLines({
    cellCount: 6,
    nominalV: 8,
    layoutSource: "factory-book",
    factoryCellCount: 6,
    factoryNominalV: 8,
  });
  assert.deepEqual(factoryOnly, [`${FACTORY_BOOK_LAYOUT_LABEL}: 6 × 8 V`]);
  assert.equal(factoryOnly.some((l) => l.includes(FIELD_MODIFIED_PACK_LABEL)), false);

  const modified = packLayoutStampLines({
    cellCount: 4,
    nominalV: 12,
    layoutSource: "field-modified",
    factoryCellCount: 6,
    factoryNominalV: 8,
    asFoundCellCount: 4,
    asFoundNominalV: 12,
  });
  assert.deepEqual(modified, [
    `${FACTORY_BOOK_LAYOUT_LABEL}: 6 × 8 V`,
    `Field-modified as-found: 4 × 12 V (48 V pack)`,
  ]);
  assert.match(modified.join("\n"), new RegExp(AS_FOUND_LABEL));

  const legacy = packLayoutStampLines({ cellCount: 6, nominalV: 8 });
  assert.deepEqual(legacy, [`${FACTORY_BOOK_LAYOUT_LABEL}: 6 × 8 V`]);
});

test("measure hint uses as-found count when the pack is field-modified", () => {
  const factory = packLayout(factory48);
  assert.match(leadAcidMeasureHint(factory, "factory-book"), /each of the 6 batteries/);
  const asFound = asFoundLayout(4, 12);
  assert.match(leadAcidMeasureHint(asFound, "field-modified"), /each of the 4 as-found 12 V batteries/);
});
