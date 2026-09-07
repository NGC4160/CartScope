import { buildEzgoDc } from "@/data/builders/ezgo-dc";

/** Wiring-library pack for 2001+ TXT 36 V Non-PDS (series 1206). */
export const ezgoTxt36NonPds = buildEzgoDc({
  id: "ezgo-txt-36-non-pds",
  name: "TXT 36 V Non-PDS",
  fullName: "EZ-GO TXT 36 V Non-PDS (Curtis 1206 series)",
  years: "2001+ EZ-GO TXT 36 V Service Manual — Non-PDS electronic speed control",
  architecture: "Non-PDS electric · Curtis 1206 · series motor · mechanical F&R · 36 V pack",
  diagramTitle: "Power and control picture — TXT 36 V Non-PDS",
  diagramNotes: [
    "36 V Non-PDS TXT: six 6 V batteries. This is the series 1206 cart from the 2001+ 36 V book, not DCS 1996–2001 and not PDS.",
    "The solenoid is the main power switch. The controller is a Curtis 1206. Motor posts are A1, A2, S1, S2. The direction switch is the mechanical F&R with MS2 (in gear) and MS4 (reverse only).",
    "Factory Non-PDS troubleshooting tree sheets (Fig. 7–14 / E-5–E-12) from the 2001+ 36 V book are in the wire library after the Fig. 19 map.",
  ],
  voltage: 36,
  controllerName: "Curtis 1206 Non-PDS controller",
  controllerDesc:
    "This is the Non-PDS 1206 on a 36 V TXT. Pins 1–6 are the small control wires. Big posts are B−, M−, B+, and A2. Do not treat this as a PDS 16-pin unit or a TCT 1206HB.",
  throttleName: "ITS (gas pedal sensor)",
  throttleDesc:
    "Gas pedal sensor (ITS) in the Non-PDS pedal box with MS3. Confirm the window on the 2001+ 36 V book for the cart in front of you. Typical first-move / full-pedal numbers are in the 36 V range, not the TCT 1.0 / 2.7 V window.",
  itsClick: { min: 0.3, max: 1.0, label: "0.30–1.0 V pedal up / first motion" },
  itsFull: { min: 3.5, max: 4.8, label: "3.5–4.8 V full pedal" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω" },
  packRested: { min: 36, max: 42, label: "36–42 V rested (six 6 V)" },
  packLoad: { min: 32, max: 42, label: "≥ 32 V under load" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc: "36 V onboard charger. On-charge pack should climb through the 40s.",
  packCells: "Six 6 V batteries (36 V)",
  manualPrefix: "2001+ EZ-GO TXT 36 V Service Manual — Non-PDS electronic speed control",
  family: "dcs",
});
