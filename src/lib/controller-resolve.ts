/**
 * Controller stamp → curated Drive books.
 *
 * Cart year/make/model stays on resolveCart. Controllers are different:
 * open by model tag (curtis-1268, 1206mx…). One clarifying question only
 * when versions truly differ (1206 family, 1510 vs 1515, Sevcon family).
 */
import {
  CONTROLLER_MODELS,
  controllerStampsForPack,
  docsForModelTag,
  getControllerModel,
  modelsForFamily,
  type ControllerDoc,
  type ControllerFamilyId,
  type ControllerModel,
  type ControllerModelTag,
} from "../data/controllers.ts";

export type ControllerQuestion = {
  id: ControllerFamilyId;
  prompt: string;
  options: { id: ControllerModelTag; label: string }[];
};

export type ControllerResolveMatch = {
  status: "match";
  model: ControllerModel;
  modelTag: ControllerModelTag;
  docs: ControllerDoc[];
  picker: false;
  question: ControllerQuestion | null;
  siblings: ControllerModel[];
};

export type ControllerResolveNone = {
  status: "none";
  picker: false;
  message: string;
};

export type ControllerResolveNeed = {
  status: "need-input";
  picker: false;
  message: string;
};

export type ControllerResolveResult = ControllerResolveMatch | ControllerResolveNone | ControllerResolveNeed;

export type ControllerQuery = {
  query?: string | null;
  hintTag?: ControllerModelTag | null;
};

const FAMILY_QUESTION: Record<ControllerFamilyId, ControllerQuestion> = {
  "1206": {
    id: "1206",
    prompt: "Which 1206 is stamped on the controller?",
    options: [
      { id: "curtis-1206mx", label: "1206MX (PDS)" },
      { id: "curtis-1206sx", label: "1206SX (DCS)" },
      { id: "curtis-1206hb", label: "1206HB (TXT TCT)" },
      { id: "curtis-1206ac", label: "1206AC (RXV)" },
    ],
  },
  "1510-1515": {
    id: "1510-1515",
    prompt: "1510 (IQ) or 1515 (Excel)?",
    options: [
      { id: "curtis-1510", label: "1510 / 1510A" },
      { id: "curtis-1515", label: "1515" },
    ],
  },
  sevcon: {
    id: "sevcon",
    prompt: "Which Sevcon is stamped on the controller?",
    options: [
      { id: "sevcon-millipak", label: "Millipak" },
      { id: "sevcon-powerpak", label: "Powerpak / Micropak" },
    ],
  },
};

export function foldControllerText(raw: string | null | undefined): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeControllerQuery(raw: string | null | undefined): string {
  let next = foldControllerText(raw);
  next = next
    .replace(/\bmilli\s*pak\b/g, "millipak")
    .replace(/\bpower\s*pak\b/g, "powerpak")
    .replace(/\bmicro\s*pak\b/g, "micropak")
    .replace(/\b1206\s*(mx|sx|hb|ac)\b/g, "1206$1")
    .replace(/\b1232\s*(e|se)\b/g, "1232$1")
    .replace(/\b1234\s*e\b/g, "1234e")
    .replace(/\b1236\s*e\b/g, "1236e")
    .replace(/\b1238\s*e\b/g, "1238e")
    .replace(/\b1266\s*a\b/g, "1266a")
    .replace(/\b1510\s*a\b/g, "1510a")
    .replace(/\s+/g, " ")
    .trim();
  return next;
}

function aliasHits(model: ControllerModel, folded: string): number {
  if (!folded) return 0;
  const compact = folded.replace(/\s+/g, "");
  const tagWords = model.tag.replace(/-/g, " ");
  if (folded === model.tag || compact === model.tag.replace(/-/g, "") || folded === tagWords) return 80;
  let best = 0;
  for (const alias of [model.name, model.fullName, ...model.aliases].map((a) => normalizeControllerQuery(a))) {
    if (!alias) continue;
    if (folded === alias || compact === alias.replace(/\s+/g, "")) {
      best = Math.max(best, 70 + Math.min(alias.length, 10));
      continue;
    }
    if (folded.includes(alias) && alias.length >= 4) {
      best = Math.max(best, 40 + Math.min(alias.length, 12));
    }
  }
  return best;
}

function familyBareHit(folded: string): ControllerFamilyId | null {
  if (/\b1206(mx|sx|hb|ac)\b/.test(folded)) return null;
  if (/\b1510a?\b/.test(folded) || /\b1515\b/.test(folded)) return null;
  if (/\b(millipak|powerpak|micropak)\b/.test(folded)) return null;
  if (/\b1206\b/.test(folded)) return "1206";
  if (/\bsevcon\b/.test(folded)) return "sevcon";
  return null;
}

export function looksLikeControllerStamp(raw: string | null | undefined): boolean {
  const folded = normalizeControllerQuery(raw);
  if (!folded) return false;
  if (/\b(navitas|tac\s*1|tac\s*2|1313)\b/.test(folded)) return false;
  if (/\b(curtis|danaher|sevcon|millipak|powerpak|micropak)\b/.test(folded)) return true;
  if (/\b(1268|1266|1232e?|1234e?|1236e?|1238e?|1206(?:mx|sx|hb|ac)?|1510a?|1515)\b/.test(folded)) {
    return true;
  }
  return CONTROLLER_MODELS.some((model) => aliasHits(model, folded) >= 40);
}

export const CONTROLLER_ONLY_CART_MESSAGE =
  "That is a controller stamp, not a cart year/make/model. Open controller books by the model on the box (Curtis 1268, 1206MX…).";

export const CONTROLLER_NUMBER_FAMILIES = new Set(["evolution-ac", "badboy-curtis"]);

function matchFromTag(tag: ControllerModelTag): ControllerResolveMatch | ControllerResolveNone {
  const model = getControllerModel(tag);
  if (!model) {
    return { status: "none", picker: false, message: "That controller is not on file." };
  }
  const docs = docsForModelTag(tag);
  if (docs.length === 0) {
    return { status: "none", picker: false, message: `No Drive book is on file for ${model.fullName}.` };
  }
  const siblings = model.family ? modelsForFamily(model.family).filter((m) => m.tag !== model.tag) : [];
  return {
    status: "match",
    model,
    modelTag: tag,
    docs,
    picker: false,
    question: null,
    siblings,
  };
}

function familyQuestionResult(family: ControllerFamilyId): ControllerResolveMatch {
  const question = FAMILY_QUESTION[family];
  const defaultTag = question.options[0]!.id;
  const model = getControllerModel(defaultTag)!;
  return {
    status: "match",
    model,
    modelTag: defaultTag,
    docs: docsForModelTag(defaultTag),
    picker: false,
    question,
    siblings: modelsForFamily(family).filter((m) => m.tag !== defaultTag),
  };
}

export function resolveController(query: ControllerQuery): ControllerResolveResult {
  if (query.hintTag) return matchFromTag(query.hintTag);

  const folded = normalizeControllerQuery(query.query);
  if (!folded) {
    return {
      status: "need-input",
      picker: false,
      message: "Type the controller model on the box. Example: Curtis 1268.",
    };
  }

  if (/\b(navitas|tac\s*1|tac\s*2|1313)\b/.test(folded)) {
    return {
      status: "none",
      picker: false,
      message:
        "Navitas and Curtis 1313 books are not in this shop set. Use the cart year, make, and model for the vehicle book.",
    };
  }

  const familyBare = familyBareHit(folded);
  if (familyBare) return familyQuestionResult(familyBare);

  const scored = CONTROLLER_MODELS.map((model) => ({
    model,
    score: aliasHits(model, folded),
  }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.model.name.localeCompare(b.model.name));

  if (scored.length === 0) {
    return {
      status: "none",
      picker: false,
      message: `No controller book on file for “${query.query?.trim() || folded}”. Type the model stamp (1268, 1206MX, Danaher…).`,
    };
  }

  const winner = scored[0]!;
  const tiedFamily = winner.model.family
    ? scored.filter((row) => row.score === winner.score && row.model.family === winner.model.family)
    : [];
  if (tiedFamily.length > 1 && winner.score < 70) {
    return familyQuestionResult(winner.model.family!);
  }

  return matchFromTag(winner.model.tag);
}

export function applyControllerQuestion(
  query: ControllerQuery,
  questionId: ControllerFamilyId,
  optionId: string,
): ControllerResolveResult {
  const allowed = FAMILY_QUESTION[questionId]?.options.some((o) => o.id === optionId);
  if (!allowed) return resolveController(query);
  return matchFromTag(optionId as ControllerModelTag);
}

export function controllerHelperBrief(packId: string): string {
  const stamps = controllerStampsForPack(packId);
  const lines = [
    "CONTROLLER BOOKS (Drive, by model stamp — not year/make/model):",
    "Open a controller PDF only after the tech reads the stamp on the box.",
    "Do not dump a controller book onto a random cart year/make/model.",
  ];
  if (stamps.length) {
    lines.push(
      `Stamps that also appear on this cart platform (secondary only; versions differ — ask which): ${stamps
        .map((m) => m.fullName)
        .join("; ")}.`,
    );
  }
  return lines.join(" ");
}
