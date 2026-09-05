import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const ezgoTxtDcs = buildEzgoDc({
  id: "ezgo-txt-dcs",
  name: "TXT DCS 1996–2001",
  fullName: "EZ-GO TXT DCS (1996–2001 series)",
  years: "1996–2001 TXT DCS (manual 28407-G01, 1997) — TXT Fleet, TXT Fleet DCS, TXT Freedom, TXT Freedom DCS, TXT4 Caddy",
  architecture: "DCS electric · gas pedal sensor · 16-pin DCS controller",
  diagramTitle: "Power and control picture — TXT DCS 1996–2001",
  diagramNotes: [
    "DCS (Drive Control System) came before PDS/TCT. Same solenoid + gas pedal sensor + 16-pin layout. The DCS controller and motor do not swap with later TCT 1206HB parts.",
    "The solenoid is the main power switch. It sends big power to the motor. The controller is the DCS unit. Confirm pack first. DCS carts are 36 V or 48 V depending on pack. This tree is written for the 48 V DCS pack in the 96–01 manual. Scale ×0.75 on a 36 V DCS.",
    "The Run/Tow switch is a safety switch. Turn it to Tow before you take battery cables off.",
  ],
  voltage: 48,
  controllerName: "DCS controller",
  controllerDesc:
    "1996–2001 TXT Drive Control System controller. 16-pin harness, ITS gas pedal sensor, solenoid B+ feed. DCS does not use the 1206HB fault table. Status is solenoid click, gas pedal sensor voltage, and motor ohms. Do not put a TCT 1206HB in a DCS cart without the matching motor and harness.",
  throttleName: "ITS (DCS gas pedal sensor)",
  throttleDesc:
    "DCS gas pedal sensor (ITS). Typical yellow-signal window about 0.4 V up to about 4.5 V full. A DCS cart with no click and a dead ITS is the pedal box, not the solenoid coil.",
  itsClick: { min: 0.3, max: 1.0, label: "0.30–1.0 V pedal up / first motion" },
  itsFull: { min: 3.5, max: 4.8, label: "3.5–4.8 V full pedal" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω" },
  packRested: { min: 42, max: 54.5, label: "42–54.5 V rested (48 V DCS)" },
  packLoad: { min: 38, max: 54.5, label: "≥ 38 V under load" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc: "Period DCS charger / receptacle. Burned pins are a common no-charge on 96–01 TXT.",
  packCells: "Six 8 V batteries (48 V DCS) or six 6 V (36 V DCS — scale voltages)",
  manualPrefix: "EZ-GO TXT 96–01 Series DCS Service Manual",
  family: "dcs",
});
