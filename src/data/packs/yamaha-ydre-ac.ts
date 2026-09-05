import { buildAcDrive } from "@/data/builders/ac-drive";

export const yamahaYdreAc = buildAcDrive({
  id: "yamaha-ydre-ac",
  manufacturer: "yamaha",
  manufacturerLabel: "Yamaha",
  name: "YDRE AC Drive",
  fullName: "Yamaha YDRE AC Drive (48 V)",
  years: "Later YDRE AC Drive (YDRA/E Service Manual AC sections; G29 AC family)",
  architecture: "YDRE AC electric · 48 V · tail speed sensor · park brake if fitted",
  diagramTitle: "Power and control picture — Yamaha YDRE AC 48 V",
  diagramNotes: [
    "YDRE AC Drive is the three-phase cart after YDRE DC. Do not use the Chapter 9 DC click-switch split tree on an AC cart.",
    "The big click switch (solenoid) is the main power switch. It sends pack power into the speed box (controller). The speed box is a three-phase AC inverter. U/V/W phase ohms should be equal and typically 0.4–0.8 Ω. The tail speed sensor (encoder) is needed for motion.",
    "The Tow/Run switch is a safety switch. Never push or tow an AC YDRE in Run.",
  ],
  controllerName: "YDRE AC motor control unit (speed box)",
  controllerDesc:
    "Yamaha YDRE AC inverter (speed box). Three-phase output, tail speed sensor input, 5 V gas pedal sensor reference. Stored faults are handled like other AC golf-car inverters: pack voltage, click switch / leftover power, park brake if fitted, U/V/W, tail speed sensor, then the MCU. Z-2 / PC Genius where fitted.",
  motorName: "YDRE AC drive motor",
  brakeName: "Park brake (electric magnet if fitted)",
  brakeOhms: { min: 20, max: 40, label: "Typically 20–40 Ω if an EM park brake is fitted" },
  phaseOhms: { min: 0.4, max: 0.8, label: "0.4–0.8 Ω each, and equal" },
  throttleUp: { min: 0.3, max: 1.0, label: "0.3–1.0 V rest" },
  throttleFull: { min: 3.5, max: 4.8, label: "3.5–4.8 V full pedal" },
  packRested: { min: 42, max: 54.5, label: "42–54.5 V" },
  packCells: "Six 8 V batteries in a row (48 V total)",
  packMinV: 42,
  manualPrefix: "YDRA/E Service Manual — YDRE AC Drive electrical",
  errorNotes:
    "YDRE AC: if a handset or display shows a code, write it down before you key-cycle. No-code path: pack ≥ 42 V → big click switch click → park-brake release (if fitted) → U/V/W 0.4–0.8 Ω → tail speed sensor 5 V + pulse → MCU. Do not use the YDRE DC Chapter 9 click-switch jumper-to-A2 test on an AC inverter.",
});
