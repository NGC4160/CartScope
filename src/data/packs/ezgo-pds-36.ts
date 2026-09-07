import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const ezgoPds36 = buildEzgoDc({
  id: "ezgo-pds-36",
  name: "TXT / Medalist 36 V PDS",
  fullName: "EZ-GO 36 V PDS (TXT / Medalist)",
  years: "36 V PDS TXT / Medalist (EZ-GO 36 V Technicians Repair Manual)",
  architecture: "PDS electric · gas pedal sensor · 16-pin plug · 36 V pack",
  diagramTitle: "Power and control picture — 36 V PDS",
  diagramNotes: [
    "36 V PDS: six 6 V batteries. Do not use 48 V ITS windows. Scale pack limits to 36 V.",
    "The solenoid is the main power switch. It sends big power to the motor. The controller is the PDS unit on the 16-pin plug. PDS 16-pin: red = logic power in RUN; yellow = ITS; black = ITS reference (typically 14–16 V on 36/48 V PDS).",
    "The Run/Tow switch is a safety switch. Towing in Run will take out a PDS controller.",
    "Factory PDS troubleshooting tree sheets (Fig. 10–19 / F-10–F-19) from the 2001+ 36 V book are in the wire library after the Fig. 9 map.",
  ],
  voltage: 36,
  controllerName: "PDS 36 V controller",
  controllerDesc:
    "This is the Precision Drive System controller on a 36 V TXT/Medalist. It uses a 16-pin plug. Red is logic power in RUN. If the gas pedal sensor (ITS) is out of range, the solenoid will not click and the cart may limp. Dragging brakes plus a low 36 V pack often make it limp from heat.",
  throttleName: "ITS (gas pedal sensor)",
  throttleDesc:
    "Gas pedal sensor (ITS) on the 36 V PDS pedal box. Typical PDS yellow: about 0.4 V pedal up and about 4.5 V full pedal (not the TCT 1.0 / 2.7 V window). Confirm against the 36 V technicians manual pin test on the unit in front of you.",
  itsClick: { min: 0.3, max: 1.0, label: "0.30–1.0 V pedal up / first motion" },
  itsFull: { min: 3.5, max: 4.8, label: "3.5–4.8 V full pedal" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω" },
  packRested: { min: 36, max: 42, label: "36–42 V rested (six 6 V)" },
  packLoad: { min: 32, max: 42, label: "≥ 32 V under load" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc: "36 V onboard charger. On-charge pack should climb through the 40s.",
  packCells: "Six 6 V batteries (36 V)",
  manualPrefix: "EZ-GO 36 V Technicians Repair Manual — PDS electrical",
  family: "pds",
});
