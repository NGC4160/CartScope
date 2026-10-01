/**
 * Curated controller manuals in shop Drive: Manuals / Controllers.
 *
 * These are tagged and opened by controller model (curtis-1268, 1206mx…),
 * not by cart year/make/model. Platform tags (ezgo-txt, ezgo-rxv,
 * club-car-precedent) are secondary notes only.
 *
 * Full manuals stay in Drive. Wiring-plate extracts stay in WIRING_SHEETS.
 * Navitas, Curtis 1313, and 1268 conversion kits are out of this set.
 */

export const CONTROLLERS_DRIVE_ROOT_ID = "1WeXxQQoJjfWP6vIsNfIjj-A2dYv6WhSJ";

export const CONTROLLERS_DRIVE_ROOT_URL = `https://drive.google.com/drive/folders/${CONTROLLERS_DRIVE_ROOT_ID}`;

export function driveFileOpenUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export type ControllerBrand = "curtis" | "danaher" | "sevcon";
export type ControllerDocKind = "manual" | "install" | "codes";

export type ControllerModelTag =
  | "curtis-1268"
  | "curtis-1266"
  | "curtis-1232e"
  | "curtis-1206mx"
  | "curtis-1206sx"
  | "curtis-1206hb"
  | "curtis-1206ac"
  | "curtis-1510"
  | "curtis-1515"
  | "danaher"
  | "sevcon-millipak"
  | "sevcon-powerpak"
  | "sevcon-micropak";

export type ControllerPlatformTag = "ezgo-txt" | "ezgo-rxv" | "club-car-precedent";

export type ControllerFamilyId = "1206" | "1510-1515" | "sevcon";

export interface ControllerDoc {
  id: string;
  title: string;
  driveFileId: string;
  openUrl: string;
  /** Primary lookup. Never a cart year/make/model pack id. */
  modelTags: ControllerModelTag[];
  /** Secondary only — carts that also appear on the sheet. */
  platformTags: ControllerPlatformTag[];
  kind: ControllerDocKind;
  brand: ControllerBrand;
}

export interface ControllerModel {
  tag: ControllerModelTag;
  brand: ControllerBrand;
  name: string;
  fullName: string;
  aliases: string[];
  family?: ControllerFamilyId;
}

export const CONTROLLER_DOCS: ControllerDoc[] = [
  {
    id: "a1-curtis-1268-manual",
    title: "Curtis Model 1268 Controller Manual",
    driveFileId: "1gxAt6NbnRtZsmhgTWFw978iWHt7Z-TP5",
    openUrl: driveFileOpenUrl("1gxAt6NbnRtZsmhgTWFw978iWHt7Z-TP5"),
    modelTags: ["curtis-1268"],
    platformTags: [],
    kind: "manual",
    brand: "curtis",
  },
  {
    id: "a2-curtis-1268-its",
    title: "Curtis 1268-ITS Install Sheet",
    driveFileId: "1Q2q_ae7VVsCabTDmGr74-pD_Pr6WuvuR",
    openUrl: driveFileOpenUrl("1Q2q_ae7VVsCabTDmGr74-pD_Pr6WuvuR"),
    modelTags: ["curtis-1268"],
    platformTags: [],
    kind: "install",
    brand: "curtis",
  },
  {
    id: "a6-curtis-1206mx",
    title: "E-Z-GO PDS 1206MX Install Sheet",
    driveFileId: "1dC8Fkgm0bzjl3EIb93ZruQK_7LNyA-9_",
    openUrl: driveFileOpenUrl("1dC8Fkgm0bzjl3EIb93ZruQK_7LNyA-9_"),
    modelTags: ["curtis-1206mx"],
    platformTags: ["ezgo-txt"],
    kind: "install",
    brand: "curtis",
  },
  {
    id: "a7-curtis-1206sx",
    title: "E-Z-GO DCS 1206SX Install Sheet",
    driveFileId: "1NsL7fca4TJtR8lUOlYEc_WeXBiS52PTg",
    openUrl: driveFileOpenUrl("1NsL7fca4TJtR8lUOlYEc_WeXBiS52PTg"),
    modelTags: ["curtis-1206sx"],
    platformTags: ["ezgo-txt"],
    kind: "install",
    brand: "curtis",
  },
  {
    id: "a8-curtis-1206hb",
    title: "E-Z-GO 2010 TXT 1206HB Install Sheet",
    driveFileId: "1E2xCyh2kHOz9wekQRDhuC3H-a0KZGUB0",
    openUrl: driveFileOpenUrl("1E2xCyh2kHOz9wekQRDhuC3H-a0KZGUB0"),
    modelTags: ["curtis-1206hb"],
    platformTags: ["ezgo-txt"],
    kind: "install",
    brand: "curtis",
  },
  {
    id: "a9-curtis-1206ac",
    title: "E-Z-GO RXV 1206AC Install Troubleshooting Sheet",
    driveFileId: "1iWdTDdjEYBGuCM5JrN63Dg7j9sfWYdbc",
    openUrl: driveFileOpenUrl("1iWdTDdjEYBGuCM5JrN63Dg7j9sfWYdbc"),
    modelTags: ["curtis-1206ac"],
    platformTags: ["ezgo-rxv"],
    kind: "install",
    brand: "curtis",
  },
  {
    id: "a10-curtis-1510",
    title: "Club Car Precedent IQ 1510A Install Sheet",
    driveFileId: "1y8KwVU2Ky7sOIhDIH9y_UzA1qCIDjDZc",
    openUrl: driveFileOpenUrl("1y8KwVU2Ky7sOIhDIH9y_UzA1qCIDjDZc"),
    modelTags: ["curtis-1510"],
    platformTags: ["club-car-precedent"],
    kind: "install",
    brand: "curtis",
  },
  {
    id: "a11-curtis-1515",
    title: "Club Car Precedent Excel 1515 Install Sheet",
    driveFileId: "1fHNocw4bizn5L9BlUnLV0x6qmMCuikCu",
    openUrl: driveFileOpenUrl("1fHNocw4bizn5L9BlUnLV0x6qmMCuikCu"),
    modelTags: ["curtis-1515"],
    platformTags: ["club-car-precedent"],
    kind: "install",
    brand: "curtis",
  },
  {
    id: "b3-curtis-1266",
    title: "Curtis 1266 Manual",
    driveFileId: "1AY0lMnUFXjhIgOVvbDBWyMETdutb9Xbv",
    openUrl: driveFileOpenUrl("1AY0lMnUFXjhIgOVvbDBWyMETdutb9Xbv"),
    modelTags: ["curtis-1266"],
    platformTags: [],
    kind: "manual",
    brand: "curtis",
  },
  {
    id: "b4-curtis-1266a",
    title: "Curtis 1266A / 66R Manual",
    driveFileId: "1VdbfSCGOftZXdqB05Rwapg84xzE5vZgv",
    openUrl: driveFileOpenUrl("1VdbfSCGOftZXdqB05Rwapg84xzE5vZgv"),
    modelTags: ["curtis-1266"],
    platformTags: [],
    kind: "manual",
    brand: "curtis",
  },
  {
    id: "b14-curtis-1232e",
    title: "Curtis 1232E / 34E / 36E / 38E Manual",
    driveFileId: "1M5BqaPg3UogYy0Bj2jS2pwdr9tajKaBH",
    openUrl: driveFileOpenUrl("1M5BqaPg3UogYy0Bj2jS2pwdr9tajKaBH"),
    modelTags: ["curtis-1232e"],
    platformTags: [],
    kind: "manual",
    brand: "curtis",
  },
  {
    id: "d1-danaher-rxv",
    title: "E-Z-GO RXV Danaher Install Sheet",
    driveFileId: "1UMJbpLgE0kUDeePGp9WnxTWpQudqFHfF",
    openUrl: driveFileOpenUrl("1UMJbpLgE0kUDeePGp9WnxTWpQudqFHfF"),
    modelTags: ["danaher"],
    platformTags: ["ezgo-rxv"],
    kind: "install",
    brand: "danaher",
  },
  {
    id: "d2-danaher-gen5",
    title: "Danaher Gen 5 Fault Codes",
    driveFileId: "1O1jDIyzu_qhT8cU2TCNWW7vX27_hiNgF",
    openUrl: driveFileOpenUrl("1O1jDIyzu_qhT8cU2TCNWW7vX27_hiNgF"),
    modelTags: ["danaher"],
    platformTags: [],
    kind: "codes",
    brand: "danaher",
  },
  {
    id: "b11-sevcon-millipak",
    title: "Sevcon Millipak Manual",
    driveFileId: "1W93GJY767M1HVbQ0qx5o9JKQdjuU4NFB",
    openUrl: driveFileOpenUrl("1W93GJY767M1HVbQ0qx5o9JKQdjuU4NFB"),
    modelTags: ["sevcon-millipak"],
    platformTags: [],
    kind: "manual",
    brand: "sevcon",
  },
  {
    id: "b12-sevcon-powerpak-micropak",
    title: "Sevcon Powerpak SEM and Micropak Manual",
    driveFileId: "1HuxYyxT_MlOwvDnPFP3FsOR-larTiM62",
    openUrl: driveFileOpenUrl("1HuxYyxT_MlOwvDnPFP3FsOR-larTiM62"),
    modelTags: ["sevcon-powerpak", "sevcon-micropak"],
    platformTags: [],
    kind: "manual",
    brand: "sevcon",
  },
  {
    id: "b13-sevcon-codes",
    title: "Sevcon Micro Pak / Power Pak Codes",
    driveFileId: "1n64pVIX613uG5GPlg45CzBvUVqlZ_duS",
    openUrl: driveFileOpenUrl("1n64pVIX613uG5GPlg45CzBvUVqlZ_duS"),
    modelTags: ["sevcon-micropak", "sevcon-powerpak"],
    platformTags: [],
    kind: "codes",
    brand: "sevcon",
  },
];

export const CONTROLLER_MODELS: ControllerModel[] = [
  {
    tag: "curtis-1268",
    brand: "curtis",
    name: "Curtis 1268",
    fullName: "Curtis 1268",
    aliases: ["1268", "curtis 1268", "1268 its", "1268its"],
  },
  {
    tag: "curtis-1266",
    brand: "curtis",
    name: "Curtis 1266",
    fullName: "Curtis 1266 / 1266A / 66R",
    aliases: ["1266", "curtis 1266", "1266a", "1266 a", "66r", "1266r"],
  },
  {
    tag: "curtis-1232e",
    brand: "curtis",
    name: "Curtis 1232E",
    fullName: "Curtis 1232E / 34E / 36E / 38E",
    aliases: ["1232e", "1232", "1232se", "1234e", "1236e", "1238e", "1234", "1236", "1238"],
  },
  {
    tag: "curtis-1206mx",
    brand: "curtis",
    name: "Curtis 1206MX",
    fullName: "Curtis 1206MX (PDS)",
    aliases: ["1206mx", "1206 mx", "pds 1206", "1206 pds"],
    family: "1206",
  },
  {
    tag: "curtis-1206sx",
    brand: "curtis",
    name: "Curtis 1206SX",
    fullName: "Curtis 1206SX (DCS)",
    aliases: ["1206sx", "1206 sx", "dcs 1206", "1206 dcs"],
    family: "1206",
  },
  {
    tag: "curtis-1206hb",
    brand: "curtis",
    name: "Curtis 1206HB",
    fullName: "Curtis 1206HB (TXT TCT)",
    aliases: ["1206hb", "1206 hb", "tct 1206", "1206 tct"],
    family: "1206",
  },
  {
    tag: "curtis-1206ac",
    brand: "curtis",
    name: "Curtis 1206AC",
    fullName: "Curtis 1206AC (RXV)",
    aliases: ["1206ac", "1206 ac"],
    family: "1206",
  },
  {
    tag: "curtis-1510",
    brand: "curtis",
    name: "Curtis 1510",
    fullName: "Curtis 1510A (Precedent IQ)",
    aliases: ["1510", "1510a", "curtis 1510", "iq 1510"],
    family: "1510-1515",
  },
  {
    tag: "curtis-1515",
    brand: "curtis",
    name: "Curtis 1515",
    fullName: "Curtis 1515 (Precedent Excel)",
    aliases: ["1515", "curtis 1515", "excel 1515"],
    family: "1510-1515",
  },
  {
    tag: "danaher",
    brand: "danaher",
    name: "Danaher",
    fullName: "Danaher (RXV / Gen 5)",
    aliases: ["danaher", "gen 5", "gen5", "danaher gen 5"],
  },
  {
    tag: "sevcon-millipak",
    brand: "sevcon",
    name: "Sevcon Millipak",
    fullName: "Sevcon Millipak",
    aliases: ["millipak", "milli pak", "sevcon millipak"],
    family: "sevcon",
  },
  {
    tag: "sevcon-powerpak",
    brand: "sevcon",
    name: "Sevcon Powerpak",
    fullName: "Sevcon Powerpak SEM",
    aliases: ["powerpak", "power pak", "sevcon powerpak"],
    family: "sevcon",
  },
  {
    tag: "sevcon-micropak",
    brand: "sevcon",
    name: "Sevcon Micropak",
    fullName: "Sevcon Micropak",
    aliases: ["micropak", "micro pak", "sevcon micropak"],
    family: "sevcon",
  },
];

/** Cart packs that may mention a controller sheet. Never used to auto-open. */
export const PACK_PLATFORM_TAGS: Record<string, ControllerPlatformTag[]> = {
  "ezgo-txt-tct": ["ezgo-txt"],
  "ezgo-txt-dcs": ["ezgo-txt"],
  "ezgo-pds-36": ["ezgo-txt"],
  "ezgo-txt-36-non-pds": ["ezgo-txt"],
  "ezgo-txt-gas": ["ezgo-txt"],
  "ezgo-rxv-ac": ["ezgo-rxv"],
  "ezgo-rxv-gas": ["ezgo-rxv"],
  "club-car-precedent-iq": ["club-car-precedent"],
  "club-car-precedent-excel": ["club-car-precedent"],
  "club-car-precedent-eric": ["club-car-precedent"],
  "club-car-precedent-gas": ["club-car-precedent"],
};

const MODEL_INDEX = new Map(CONTROLLER_MODELS.map((m) => [m.tag, m]));

export function getControllerModel(tag: string): ControllerModel | undefined {
  return MODEL_INDEX.get(tag as ControllerModelTag);
}

export function docsForModelTag(tag: string): ControllerDoc[] {
  return CONTROLLER_DOCS.filter((doc) => doc.modelTags.includes(tag as ControllerModelTag));
}

export function docsForPlatformTag(tag: ControllerPlatformTag): ControllerDoc[] {
  return CONTROLLER_DOCS.filter((doc) => doc.platformTags.includes(tag));
}

export function modelsForFamily(family: ControllerFamilyId): ControllerModel[] {
  return CONTROLLER_MODELS.filter((m) => m.family === family);
}

/** Possible stamps on this cart platform. Do not auto-open — versions often differ. */
export function controllerStampsForPack(packId: string): ControllerModel[] {
  const platforms = PACK_PLATFORM_TAGS[packId] ?? [];
  const tags = new Set<ControllerModelTag>();
  for (const platform of platforms) {
    for (const doc of docsForPlatformTag(platform)) {
      for (const tag of doc.modelTags) tags.add(tag);
    }
  }
  return [...tags].map((tag) => MODEL_INDEX.get(tag)).filter((m): m is ControllerModel => Boolean(m));
}

export const EXCLUDED_CONTROLLER_NOTES = [
  "Curtis 1268 EZGO / Club Car conversion kits",
  "Curtis 1313 handheld user manual",
  "Navitas TAC1 / TAC2 / AC app manuals",
] as const;
