import { buildAcDrive } from "@/data/builders/ac-drive";

export const evolutionAc = buildAcDrive({
  id: "evolution-ac",
  manufacturer: "evolution",
  manufacturerLabel: "Evolution",
  name: "AC Drive 1232SE",
  fullName: "Evolution AC Drive (Curtis 1232SE)",
  years: "Evolution AC Drive electrical extract — 1232SE SYSTEM DIAGRAM / 35-pin connector (Curtis 1232SE family)",
  architecture: "48 V AC · Curtis 1232SE · 35-pin · speed encoder · solenoid",
  diagramTitle: "Power and control picture — Evolution AC Drive 1232SE",
  diagramNotes: [
    "Factory plates from the Evolution Alternating-Current Drive electrical extract: 1232SE SYSTEM DIAGRAM and 35pins connector for AC controller.",
    "The standalone Evolution touchscreen wiring diagram is on this pack. D5 models have their own AC system / communication / lithium plates — pick Evolution D5 for those.",
    "This is an OEM Evolution extract, not the generic Curtis 1232E/SE manual (that lives on the Bad Boy Curtis pack).",
  ],
  controllerName: "Curtis 1232SE",
  controllerDesc:
    "Curtis 1232SE AC inverter as drawn on the Evolution 1232SE SYSTEM DIAGRAM. 35-pin connector labels on the extract: KSI, interlock, F/R, pedal, pot wiper/high/low, encoder A/B, coil return, EM brake optional.",
  motorName: "Evolution AC induction motor",
  brakeName: "EM brake (optional on the 35-pin plate)",
  brakeOhms: { min: 20, max: 40, label: "Typically 20–40 Ω if an EM park brake is fitted" },
  phaseOhms: { min: 0.4, max: 0.8, label: "0.4–0.8 Ω each, and equal — confirm on the cart" },
  throttleUp: { min: 0.3, max: 1.0, label: "0.3–1.0 V rest — confirm on the cart" },
  throttleFull: { min: 3.5, max: 4.8, label: "3.5–4.8 V full pedal — confirm on the cart" },
  packRested: { min: 42, max: 54.5, label: "42–54.5 V" },
  packCells: "48 V pack (6 V / 8 V / 12 V batteries as fitted — match the cart)",
  packMinV: 42,
  manualPrefix: "Evolution Alternating-Current Drive — Electrical (1232SE SYSTEM DIAGRAM)",
  errorNotes:
    "Evolution 1232SE: plug in the 1313 handheld and write the code before you key-cycle. The extract’s Appendix 2 is the 1232SE troubleshooting chart. No-code path: pack ≥ 42 V → solenoid → U/V/W → encoder 5 V + pulse.",
});
