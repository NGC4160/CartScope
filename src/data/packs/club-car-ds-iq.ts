import { buildClubCarIq } from "@/data/builders/club-car-iq";

export const clubCarDsIq = buildClubCarIq({
  id: "club-car-ds-iq",
  name: "DS IQ / Villager IQ",
  fullName: "Club Car DS IQ, Villager 4/6/8, Transporter 4/6 IQ System (48 V)",
  years: "2001–2011 DS IQ; 2008–2011 Villager 4/6/8 and Transporter 4/6 IQ System (transportation chassis 103373105 + IQ supplement 103373106)",
  architecture: "IQ electric · cart computer · gas pedal sensor · 16-pin plug",
  diagramTitle: "Power and control picture — DS IQ / Villager IQ 48 V",
  diagramNotes: [
    "DS-body IQ and 2008–2011 transportation IQ System share the same Precedent IQ electric tree. That means Tow/Run, cart computer safety lock, MCOR gas pedal sensor, 16-pin plug, and a 180–190 Ω solenoid coil.",
    "The Tow/Run switch is in the battery negative path. Turn it to Tow before you take battery cables off.",
    "IQ Plus transportation (supplement 103373107) is a different pack. Do not mix IQ and IQ Plus controllers.",
    "Heavier Villager 8 / Transporter 6 carts often slow down from heat cutback or weak batteries under load.",
    "Gas transportation is FE290 or FE350. Check the engine tag.",
  ],
  controllerName: "IQ controller (DS / transportation)",
  controllerDesc:
    "This is the IQ electric controller used on DS IQ and 2008–2011 Villager/Transporter IQ System. It uses the same Diagnostic Menu (TG1) and Troubleshooting Guide 2 steps as Precedent IQ. Transportation controllers may use different speed tables. Check with the IQDM-P before you call a cart slow.",
  computerName: "Cart computer (OBC)",
  computerKind: "computer",
  computerDesc:
    "This is the PowerDrive cart computer on DS IQ and Villager/Transporter IQ. Solenoid safety lock (TP 2) and the gray-wire charge path (TP 11) use the same tests as Precedent IQ.",
  computerFailures: [
    "Cart computer safety lock after the batteries run very low",
    "Bad charge part",
    "Rusty six-pin plug in the battery well",
  ],
  throttleName: "MCOR (gas pedal sensor)",
  throttleDesc:
    "The MCOR is the gas pedal sensor on the DS / Villager pedal group. Factory: yellow 0.32 V up → 4.65 V full. Yellow to purple 1 kΩ up → 5.67–7.43 kΩ full. The limit switch must close so the solenoid can turn on.",
  manualPrefix: "2008–2011 DS Villager/Transporter M&S · IQ System supplement 103373106 (same TP 1–16 as Precedent IQ Section 11)",
  packCells: "Six 8 V batteries in a row (48 V total)",
  lockoutNote: "If the charger is plugged in, a safety lock stops the solenoid. Unplug it before you test.",
  solenoidCoil: { min: 180, max: 190, label: "180–190 Ω" },
});
