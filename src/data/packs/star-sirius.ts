import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const starSirius = buildEzgoDc({
  id: "star-sirius",
  manufacturer: "star",
  manufacturerLabel: "Star EV",
  name: "Sirius / Star chassis",
  fullName: "Star EV Sirius / Star chassis (Curtis 1243)",
  years:
    "Star chassis 2007 Curtis 1243 (Cartaholics community) · Sirius body electrical (Service Manual V 1.06, 5-27-25)",
  architecture: "Curtis 1243 DC electric · Star chassis · Sirius body / 12 V accessory",
  diagramTitle: "Power and control picture — Star chassis Curtis 1243 / Sirius body electrical",
  diagramNotes: [
    "The chassis wire map is a community Cartaholics 2007 sheet for Curtis 1243-43301 — not a factory Star SM plate. The printed title is VII Schematic diagram of the electrical system. Treat that source as community, not OEM.",
    "Sirius body electrical plates are factory (Service Manual V 1.06, 5-27-25): combination-switch continuity, Sirius Headlight Wiring Diagram, Sirius Turn Signal Wiring Diagram, and the 2024 Star Sirius Add-on Cruise Control Wiring Harness.",
    "The Sirius electrical system is dual-sided: pack voltage plus a 12 V accessory converter. These factory plates are body / lighting / cruise — not a full chassis schematic.",
    "ICON / Revenge is not on this pack. The ICON gas manual on file is parts-only — no wiring plates were added.",
  ],
  voltage: 48,
  controllerName: "Curtis 1243-43301",
  controllerDesc:
    "Curtis 1243 as printed on the Cartaholics 2007 Star chassis sheet (model 1243-43301). H-H1 = pack connected to the cart; H-H2 = pack connected to the charger. Use the plate — do not assume EZ-GO J1 pin numbers.",
  throttleName: "Accelerator (Curtis 1243)",
  throttleDesc:
    "Accelerator on the community chassis schematic. Compare the plate. Do not use Express / TXT ITS windows as factory numbers for Star.",
  itsClick: { min: 0.2, max: 1.5, label: "first-motion — confirm on the chassis plate" },
  itsFull: { min: 3.0, max: 5.0, label: "full pedal — confirm on the chassis plate" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω typical Curtis coil (confirm on the cart)" },
  packRested: { min: 48, max: 54.5, label: "pack at rest — match the cart (often 48 V)" },
  packLoad: { min: 42, max: 54.5, label: "pack under load — match the cart" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc:
    "Charger path as drawn on the Cartaholics 2007 chassis sheet. Sirius body electrical uses a 12 V converter for accessories.",
  packCells: "Pack as found on the cart — the community chassis plate does not invent a cell count",
  manualPrefix: "Star chassis Cartaholics 2007 Curtis 1243 · Sirius Service Manual V 1.06 body electrical",
  family: "dcs",
  towName: "Key / storage path",
  towDesc:
    "The community chassis plate shows a storage / charger path (H-H1 / H-H2). Confirm the cart in front of you before you open the pack.",
});
