/**
 * Year + make + model → one cart pack.
 *
 * Shop techs type what is on the cart. We normalize aliases, use the year
 * to pick the right book range, and return a single pack. A generic
 * candidate list is never the result. When two year-valid packs still
 * differ by one fact (gas vs electric, 36 V vs 48 V), we keep a default
 * and attach that one question.
 */
import { CART_CATALOG, type CartEntry } from "../data/cart-catalog.ts";
import type { ManufacturerId, Powertrain } from "../data/types.ts";
import {
  CONTROLLER_NUMBER_FAMILIES,
  CONTROLLER_ONLY_CART_MESSAGE,
  looksLikeControllerStamp,
} from "./controller-resolve.ts";
import {
  formatPackYears,
  parseCartYear,
  resolvePackYearRanges,
  yearInRanges,
  type YearRange,
} from "./year-compat.ts";

export type CartHint = {
  powertrain?: Powertrain;
  voltage?: 36 | 48 | 72;
};

export type CartQuestion = {
  id: "powertrain" | "voltage";
  prompt: string;
  options: { id: string; label: string }[];
};

export type CartResolveMatch = {
  status: "match";
  pack: CartEntry;
  packId: string;
  /** Never a choose-one list. Empty on a normal lookup. */
  picker: false;
  question: CartQuestion | null;
  siblings: CartEntry[];
  yearSpan: string | null;
};

export type CartResolveNone = {
  status: "none";
  picker: false;
  message: string;
  closestYearSpan: string | null;
  closestPackId: string | null;
  closestPackName: string | null;
};

export type CartResolveNeed = {
  status: "need-input";
  picker: false;
  message: string;
};

export type CartResolveResult = CartResolveMatch | CartResolveNone | CartResolveNeed;

export type CartQuery = {
  year?: string | number | null;
  make?: string | null;
  model?: string | null;
  hint?: CartHint;
};

type FamilyId =
  | "precedent"
  | "tempo"
  | "onward"
  | "ds"
  | "villager"
  | "carryall"
  | "txt"
  | "rxv"
  | "marathon"
  | "express-s4"
  | "express-l6"
  | "express-s6"
  | "2five"
  | "ezgo-early-electric"
  | "drive"
  | "drive2"
  | "ytf1"
  | "emerge"
  | "star-classic"
  | "sirius"
  | "evolution-ac"
  | "evolution-d5"
  | "badboy-curtis"
  | "ambush"
  | "recoil"
  | "gem"
  | "tracker";

type MatchWindow = {
  min: number;
  max: number;
  openEnded?: boolean;
  preferred?: boolean;
};

const MAKE_ALIASES: Record<string, ManufacturerId> = {
  "club car": "club-car",
  clubcar: "club-car",
  club: "club-car",
  cc: "club-car",
  "ez go": "ezgo",
  ezgo: "ezgo",
  "e z go": "ezgo",
  "ez g": "ezgo",
  ez: "ezgo",
  yamaha: "yamaha",
  yam: "yamaha",
  star: "star",
  "star ev": "star",
  starev: "star",
  tomberlin: "tomberlin",
  evolution: "evolution",
  evo: "evolution",
  "bad boy": "badboy",
  badboy: "badboy",
  gem: "gem",
  polaris: "gem",
  tracker: "tracker",
};

const FAMILY_PACKS: Record<FamilyId, string[]> = {
  precedent: [
    "club-car-precedent-iq",
    "club-car-precedent-excel",
    "club-car-precedent-eric",
    "club-car-precedent-gas",
  ],
  tempo: ["club-car-tempo-eric", "club-car-tempo-gas"],
  onward: ["club-car-tempo-eric", "club-car-tempo-gas", "club-car-precedent-eric"],
  ds: [
    "club-car-ds-vglide",
    "club-car-ds-electric",
    "club-car-ds-pdplus",
    "club-car-ds-iq",
    "club-car-ds-fe290",
    "club-car-ds-gas",
  ],
  villager: [
    "club-car-villager-iqplus",
    "club-car-villager-gas",
    "club-car-ds-iq",
    "club-car-ds-fe290",
  ],
  carryall: ["club-car-carryall-295"],
  txt: ["ezgo-txt-tct", "ezgo-txt-dcs", "ezgo-txt-36-non-pds", "ezgo-pds-36", "ezgo-txt-gas"],
  rxv: ["ezgo-rxv-ac", "ezgo-rxv-gas"],
  marathon: ["ezgo-marathon-gas"],
  "express-s4": ["ezgo-express-s4"],
  "express-l6": ["ezgo-express-l6"],
  "express-s6": ["ezgo-express-s6"],
  "2five": ["ezgo-2five"],
  "ezgo-early-electric": ["ezgo-electric-1989-1994"],
  drive: ["yamaha-ydra", "yamaha-ydre-dc", "yamaha-ydre-ac"],
  drive2: ["yamaha-ydre-ac", "yamaha-ydra"],
  ytf1: ["yamaha-ytf1"],
  emerge: ["tomberlin-emerge-ge403", "tomberlin-emerge-curtis1268", "tomberlin-emerge-sevcon"],
  "star-classic": ["star-classic-dc"],
  sirius: ["star-sirius"],
  "evolution-ac": ["evolution-ac"],
  "evolution-d5": ["evolution-d5"],
  "badboy-curtis": ["badboy-curtis-1232e"],
  ambush: ["badboy-ambush-gas", "badboy-ambush-electric"],
  recoil: ["badboy-recoil-is"],
  gem: ["gem-eseries-2013"],
  tracker: ["tracker-evis-2020"],
};

/** Matching-only windows. Pack files and their manuals stay as they are. */
const MATCH_WINDOWS: Record<string, MatchWindow[]> = {
  "club-car-precedent-iq": [{ min: 2004, max: 2011, preferred: true }],
  "club-car-precedent-excel": [
    { min: 2012, max: 2013, preferred: true },
    { min: 2008, max: 2014 },
  ],
  "club-car-precedent-eric": [{ min: 2014, max: 2019, preferred: true }],
  "club-car-precedent-gas": [{ min: 2004, max: 2019 }],
  "club-car-tempo-eric": [{ min: 2020, max: 2021, openEnded: true, preferred: true }],
  "club-car-tempo-gas": [{ min: 2020, max: 2021, openEnded: true, preferred: true }],
  "ezgo-txt-tct": [
    { min: 2008, max: 2024, preferred: true },
    { min: 2002, max: 2024 },
  ],
  "ezgo-txt-dcs": [{ min: 1996, max: 2001, preferred: true }],
  "ezgo-txt-36-non-pds": [{ min: 2001, max: 2010 }],
  "ezgo-pds-36": [{ min: 2000, max: 2010 }],
  "ezgo-txt-gas": [{ min: 2007, max: 2024, openEnded: true }],
  "ezgo-rxv-ac": [{ min: 2008, max: 2012, openEnded: true, preferred: true }],
  "ezgo-rxv-gas": [{ min: 2008, max: 2024, openEnded: true }],
  "yamaha-ydra": [{ min: 2007, max: 2016, preferred: true }],
  "yamaha-ydre-dc": [{ min: 2007, max: 2016, preferred: true }],
  "yamaha-ydre-ac": [
    { min: 2017, max: 2026, openEnded: true, preferred: true },
    { min: 2012, max: 2026, openEnded: true },
  ],
};

const FAMILY_DEFAULT: Partial<Record<FamilyId, string>> = {
  onward: "club-car-tempo-eric",
  tempo: "club-car-tempo-eric",
  precedent: "club-car-precedent-iq",
  txt: "ezgo-txt-tct",
  rxv: "ezgo-rxv-ac",
  drive: "yamaha-ydre-dc",
  drive2: "yamaha-ydre-ac",
  ambush: "badboy-ambush-electric",
};

const FAMILY_PATTERNS: { family: FamilyId; re: RegExp }[] = [
  { family: "drive2", re: /\bdrive\s*2\b|\bdrive2\b|\bdrv2\b/ },
  { family: "express-s4", re: /\bexpress\s*s\s*4\b|\bs4\b/ },
  { family: "express-l6", re: /\bexpress\s*l\s*6\b|\bl6\b/ },
  { family: "express-s6", re: /\bexpress\s*s\s*6\b|\bs6\b/ },
  { family: "2five", re: /\b2\s*five\b|\b2five\b|\btwo\s*five\b/ },
  { family: "carryall", re: /\bcarry\s*all\b|\bxrt\s*1550\b|\bxrt1550\b|\b295\b/ },
  { family: "precedent", re: /\bprecedent\b/ },
  { family: "tempo", re: /\btempo\b/ },
  { family: "onward", re: /\bonward\b/ },
  { family: "villager", re: /\bvillager\b|\btransporter\b/ },
  { family: "marathon", re: /\bmarathon\b|\bgx\s*444\b/ },
  { family: "rxv", re: /\brxv\b/ },
  { family: "txt", re: /\btxt\b|\bmedalist\b|\bfreedom\b/ },
  { family: "ds", re: /\bds\b|\bfe350\b|\bfe290\b|\bpowerdrive\b|\bvglide\b|\bv glide\b/ },
  { family: "drive", re: /\bdrive\b|\bg29\b|\bydra\b|\bydre\b/ },
  { family: "ytf1", re: /\bytf\s*1\b|\bytf1\b/ },
  { family: "emerge", re: /\bemerge\b|\be merge\b/ },
  { family: "star-classic", re: /\bclassic\b/ },
  { family: "sirius", re: /\bsirius\b/ },
  { family: "evolution-d5", re: /\bd5\b/ },
  { family: "evolution-ac", re: /\bac\s*drive\b|\b1232/ },
  { family: "recoil", re: /\brecoil\b/ },
  { family: "ambush", re: /\bambush\b/ },
  { family: "badboy-curtis", re: /\b1232/ },
  { family: "gem", re: /\be\s*series\b|\be2\b|\be4\b|\be6\b/ },
  { family: "tracker", re: /\bevis\b/ },
  { family: "ezgo-early-electric", re: /\b1989\b|\b1990\b|\b1991\b|\b1992\b|\b1993\b|\b1994\b/ },
];

export function foldCartText(raw: string | null | undefined): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCartYear(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const year = Math.trunc(raw);
    return year >= 1900 && year <= 2099 ? year : null;
  }
  return parseCartYear(String(raw ?? ""));
}

export function normalizeMake(raw: string | null | undefined): ManufacturerId | null {
  const folded = foldCartText(raw);
  if (!folded) return null;
  if (MAKE_ALIASES[folded]) return MAKE_ALIASES[folded];
  const keys = Object.keys(MAKE_ALIASES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (folded === key || folded.startsWith(`${key} `) || folded.endsWith(` ${key}`) || folded.includes(` ${key} `)) {
      return MAKE_ALIASES[key]!;
    }
  }
  return null;
}

export function detectFamily(modelText: string): FamilyId | null {
  const folded = foldCartText(modelText);
  if (!folded) return null;
  for (const row of FAMILY_PATTERNS) {
    if (row.re.test(folded)) return row.family;
  }
  return null;
}

function stripMakeTokens(folded: string, make: ManufacturerId | null): string {
  if (!folded) return "";
  let next = folded;
  if (make === "club-car") next = next.replace(/\b(club car|clubcar|club|cc)\b/g, " ");
  if (make === "ezgo") next = next.replace(/\b(e z go|ez go|ezgo|ez)\b/g, " ");
  if (make === "yamaha") next = next.replace(/\byamaha\b/g, " ");
  if (make === "star") next = next.replace(/\b(star ev|starev|star)\b/g, " ");
  if (make === "tomberlin") next = next.replace(/\btomberlin\b/g, " ");
  if (make === "evolution") next = next.replace(/\b(evolution|evo)\b/g, " ");
  if (make === "badboy") next = next.replace(/\b(bad boy|badboy)\b/g, " ");
  if (make === "gem") next = next.replace(/\b(polaris )?gem\b/g, " ");
  if (make === "tracker") next = next.replace(/\btracker\b/g, " ");
  return foldCartText(next);
}

function detectPowertrain(text: string): Powertrain | undefined {
  const folded = foldCartText(text);
  if (/\b(gas|gasoline|petrol|efi|carb|fe350|fe290|ex40|ech440)\b/.test(folded) && !/\belectric\b/.test(folded)) {
    return "gasoline";
  }
  if (/\b(electric|elec|eric|iq|excel|tct|pds|dcs|ac|dc)\b/.test(folded) && !/\bgas/.test(folded)) {
    return "electric";
  }
  return undefined;
}

function detectVoltage(text: string): 36 | 48 | 72 | undefined {
  const folded = foldCartText(text);
  if (/\b72\b/.test(folded)) return 72;
  if (/\b36\b/.test(folded)) return 36;
  if (/\b48\b/.test(folded)) return 48;
  return undefined;
}

function packById(id: string): CartEntry | undefined {
  return CART_CATALOG.find((p) => p.id === id);
}

function packRanges(pack: CartEntry): YearRange[] {
  const overlay = MATCH_WINDOWS[pack.id];
  if (overlay?.length) {
    return overlay.map((w) => ({ min: w.min, max: w.max, openEnded: Boolean(w.openEnded) }));
  }
  return resolvePackYearRanges({
    packId: pack.id,
    packYears: pack.years,
    yearMin: pack.yearMin,
    yearMax: pack.yearMax,
  });
}

function yearFit(
  pack: CartEntry,
  year: number | null,
): { inRange: boolean; preferred: boolean; span: number; yearScore: number } {
  const overlay = MATCH_WINDOWS[pack.id] ?? [];
  const ranges = packRanges(pack);
  if (year == null) {
    return { inRange: true, preferred: false, span: 40, yearScore: 10 };
  }
  const overlayHit = overlay.filter((w) => year >= w.min && (w.openEnded || year <= w.max));
  const bookHit = ranges.length > 0 && yearInRanges(year, ranges);
  const inRange = overlayHit.length > 0 || (overlay.length === 0 && bookHit);
  if (!inRange) {
    return { inRange: false, preferred: false, span: 99, yearScore: 0 };
  }
  const preferred = overlayHit.some((w) => w.preferred);
  const spanSource = overlayHit[0] ?? ranges[0];
  const span = spanSource
    ? (spanSource.openEnded ? 20 : Math.max(0, spanSource.max - spanSource.min))
    : 20;
  const yearScore = 100 + (preferred ? 40 : 0) + Math.max(0, 12 - Math.min(span, 12));
  return { inRange, preferred, span, yearScore };
}

function tokenScore(pack: CartEntry, modelFolded: string): number {
  if (!modelFolded) return 0;
  const blob = foldCartText(`${pack.id} ${pack.name} ${pack.fullName} ${pack.years}`);
  const tokens = modelFolded.split(" ").filter((t) => t.length >= 2);
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (blob.includes(t)) hits += 1;
  }
  return hits === 0 ? 0 : Math.round((hits / tokens.length) * 20);
}

function familiesForQuery(modelFolded: string, year: number | null): FamilyId[] {
  const primary = detectFamily(modelFolded);
  if (!primary) return [];
  const out = new Set<FamilyId>([primary]);
  if (primary === "tempo" && year != null && year < 2020) out.add("precedent");
  if (primary === "onward" && year != null && year < 2020) out.add("precedent");
  if (primary === "onward" && (year == null || year >= 2020)) out.add("tempo");
  if (primary === "drive2") out.add("drive");
  return [...out];
}

function candidatePacks(make: ManufacturerId | null, families: FamilyId[], modelFolded: string): CartEntry[] {
  const ids = new Set<string>();
  for (const family of families) {
    for (const id of FAMILY_PACKS[family]) ids.add(id);
  }
  if (ids.size > 0) {
    return [...ids].map(packById).filter((p): p is CartEntry => Boolean(p));
  }
  return CART_CATALOG.filter((p) => {
    if (make && p.manufacturer !== make) return false;
    return tokenScore(p, modelFolded) >= 10;
  });
}

function closestForFamily(
  packs: CartEntry[],
  year: number | null,
): { pack: CartEntry; span: string } | null {
  if (packs.length === 0) return null;
  if (year == null) {
    const pack = packs[0]!;
    const span = formatPackYears(packRanges(pack)) || pack.years;
    return { pack, span };
  }
  let best: { pack: CartEntry; dist: number; span: string } | null = null;
  for (const pack of packs) {
    const ranges = packRanges(pack);
    if (ranges.length === 0) continue;
    for (const range of ranges) {
      const dist = year < range.min ? range.min - year : year > range.max && !range.openEnded ? year - range.max : 0;
      const span = formatPackYears([range]);
      if (!best || dist < best.dist) best = { pack, dist, span };
    }
  }
  if (!best) {
    const pack = packs[0]!;
    return { pack, span: formatPackYears(packRanges(pack)) || pack.years };
  }
  return { pack: best.pack, span: best.span };
}

function questionFor(winner: CartEntry, yearValid: CartEntry[]): CartQuestion | null {
  if (yearValid.length < 2) return null;
  const powertrains = new Set(yearValid.map((p) => p.powertrain));
  const voltages = new Set(yearValid.map((p) => p.voltage));
  if (powertrains.size === 2) {
    return {
      id: "powertrain",
      prompt: "Gas or electric?",
      options: [
        { id: "electric", label: "Electric" },
        { id: "gasoline", label: "Gas" },
      ],
    };
  }
  if (voltages.size === 2 && winner.powertrain === "electric") {
    const volts = [...voltages].sort((a, b) => a - b);
    return {
      id: "voltage",
      prompt: `${volts[0]} V or ${volts[1]} V?`,
      options: volts.map((v) => ({ id: String(v), label: `${v} V` })),
    };
  }
  return null;
}

function applyHint(packs: CartEntry[], hint: CartHint | undefined): CartEntry[] {
  if (!hint) return packs;
  let next = packs;
  if (hint.powertrain) next = next.filter((p) => p.powertrain === hint.powertrain);
  if (hint.voltage) next = next.filter((p) => p.voltage === hint.voltage);
  return next.length ? next : packs;
}

export function resolveCart(query: CartQuery): CartResolveResult {
  const year = normalizeCartYear(query.year);
  const rawMake = foldCartText(query.make);
  const rawModel = foldCartText(query.model);
  const blob = foldCartText(`${query.make ?? ""} ${query.model ?? ""}`);
  const make = normalizeMake(query.make) ?? normalizeMake(blob);
  const modelFolded = stripMakeTokens(rawModel || blob, make);
  const familyList = familiesForQuery(modelFolded || blob, year);
  const hint: CartHint = {
    powertrain: query.hint?.powertrain ?? detectPowertrain(blob),
    voltage: query.hint?.voltage ?? detectVoltage(blob),
  };

  if (!make && !modelFolded) {
    return {
      status: "need-input",
      picker: false,
      message: "Type the cart year, make, and model. Example: 2011 Club Car Precedent.",
    };
  }
  if (!modelFolded && familyList.length === 0) {
    return {
      status: "need-input",
      picker: false,
      message: "Type the model (Precedent, TXT, Drive2, RXV…). We use that plus the year to open the book.",
    };
  }

  const controllerStamp = looksLikeControllerStamp(blob) || looksLikeControllerStamp(query.model);
  const cartFamily = familyList.find((family) => !CONTROLLER_NUMBER_FAMILIES.has(family));
  if (controllerStamp && !make && !cartFamily) {
    return {
      status: "none",
      picker: false,
      message: CONTROLLER_ONLY_CART_MESSAGE,
      closestYearSpan: null,
      closestPackId: null,
      closestPackName: null,
    };
  }

  const familyPacks = candidatePacks(make, familyList, modelFolded).filter((p) => !make || p.manufacturer === make);
  const hinted = applyHint(familyPacks, hint);
  const scored = hinted
    .map((pack) => {
      const fit = yearFit(pack, year);
      let score = fit.yearScore;
      if (pack.powertrain === "electric") score += 8;
      if (pack.voltage === 48) score += 4;
      for (const family of familyList) {
        if (FAMILY_DEFAULT[family] === pack.id) score += 15;
      }
      score += tokenScore(pack, modelFolded);
      return { pack, fit, score };
    })
    .filter((row) => (year == null ? true : row.fit.inRange));

  if (scored.length === 0) {
    const closest = closestForFamily(familyPacks.length ? familyPacks : hinted, year);
    const makeLabel = make
      ? CART_CATALOG.find((p) => p.manufacturer === make)?.manufacturerLabel ?? make
      : "this make";
    const modelLabel = modelFolded || "this model";
    const yearLabel = year ?? "that year";
    if (closest) {
      return {
        status: "none",
        picker: false,
        message: `No exact match for ${yearLabel} ${makeLabel} ${modelLabel}. Closest book on file is ${closest.span} (${closest.pack.fullName}).`,
        closestYearSpan: closest.span,
        closestPackId: closest.pack.id,
        closestPackName: closest.pack.fullName,
      };
    }
    return {
      status: "none",
      picker: false,
      message: `No exact match for ${yearLabel} ${makeLabel} ${modelLabel}. That cart is not on file.`,
      closestYearSpan: null,
      closestPackId: null,
      closestPackName: null,
    };
  }

  scored.sort((a, b) => b.score - a.score || b.fit.yearScore - a.fit.yearScore || a.pack.name.localeCompare(b.pack.name));
  const winner = scored[0]!;
  const yearValid = scored.filter((row) => row.fit.inRange).map((row) => row.pack);
  const runnerUp = scored[1];
  const yearTie = Boolean(runnerUp && runnerUp.fit.yearScore === winner.fit.yearScore && year != null);
  const question = yearTie && !hint.powertrain && !hint.voltage ? questionFor(winner.pack, yearValid) : null;
  const siblings = yearValid.filter((p) => p.id !== winner.pack.id);

  return {
    status: "match",
    pack: winner.pack,
    packId: winner.pack.id,
    picker: false,
    question,
    siblings,
    yearSpan: formatPackYears(packRanges(winner.pack)) || winner.pack.years,
  };
}

export function applyCartQuestion(
  query: CartQuery,
  questionId: CartQuestion["id"],
  optionId: string,
): CartResolveResult {
  const hint: CartHint = { ...query.hint };
  if (questionId === "powertrain" && (optionId === "electric" || optionId === "gasoline")) {
    hint.powertrain = optionId;
  }
  if (questionId === "voltage") {
    const n = Number(optionId);
    if (n === 36 || n === 48 || n === 72) hint.voltage = n;
  }
  return resolveCart({ ...query, hint });
}
