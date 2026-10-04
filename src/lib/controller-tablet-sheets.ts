import { WIRING_SHEETS, type WiringSheet } from "../data/wiring.ts";

/** Controller stamps that already have JPEG plates in the app. Drive PDFs stay separate. */
const TABLET_SHEET_IDS: Record<string, readonly string[]> = {
  "curtis-1268": [
    "star-classic-1268-fig3",
    "curtis-1268-5403-preinstall",
    "curtis-1268-5403-wiring",
    "curtis-1268-5403-pincheck-3",
    "curtis-1268-5403-pincheck-4",
  ],
  "curtis-1266": ["star-classic-1266-fig2"],
};

export function tabletSheetsForController(tag: string): WiringSheet[] {
  const ids = TABLET_SHEET_IDS[tag] ?? [];
  return ids
    .map((id) => WIRING_SHEETS.find((sheet) => sheet.id === id))
    .filter((sheet): sheet is WiringSheet => Boolean(sheet));
}

export function tabletSheetHref(sheetId: string): string {
  return `/print/wiring/${sheetId}`;
}
