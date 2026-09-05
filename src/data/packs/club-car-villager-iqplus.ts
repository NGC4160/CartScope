import { buildClubCarIq } from "@/data/builders/club-car-iq";

export const clubCarVillagerIqPlus = buildClubCarIq({
  id: "club-car-villager-iqplus",
  name: "Villager / Transporter IQ Plus",
  fullName: "Club Car Villager 4/6/8 / Transporter 4/6 IQ Plus (48 V)",
  years: "2009–2011 transportation IQ Plus (chassis 103373105 + IQ Plus supplement 103373107)",
  architecture: "IQ Plus (Excel-family) electric · cart computer · gas pedal sensor · 16-pin plug",
  diagramTitle: "Power and control picture — Villager / Transporter IQ Plus 48 V",
  diagramNotes: [
    "IQ Plus on 2008–2011 Villager/Transporter is the Excel-family speed box, not classic IQ. Do not put an IQ speed box in an IQ Plus cart.",
    "The Tow/Run switch is in the battery negative path. Turn it to Tow before you take battery cables off.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. Factory values match Excel: click-switch coil 180–190 Ω, MCOR yellow 0.32 V up → 4.65 V full, yellow to purple 5.67–7.43 kΩ full.",
    "Heavier Villager 8 / Transporter 6: check heat cutback and batteries under load before you replace the speed box.",
    "IQ System transportation (supplement 103373106) is the DS IQ pack.",
  ],
  controllerName: "IQ Plus speed box (controller)",
  controllerDesc:
    "This is the Excel-family electric speed box used on 2009–2011 Villager/Transporter IQ Plus. It uses the same big click switch / gas pedal sensor / cart computer path as Precedent Excel, with transportation speed tables. Check with the Excel/IQ Plus handset before you call a cart slow.",
  computerName: "Cart computer (OBC)",
  computerKind: "computer",
  computerDesc:
    "This is the PowerDrive cart computer on IQ Plus transportation. The charger safety lock (book test 2) and the gray charge wire still apply. If the charger is plugged in, the click switch will not click.",
  computerFailures: ["Cart computer safety lock after the batteries run very low", "Bad charge part", "Rusty six-pin plug in the battery well"],
  throttleName: "MCOR (gas pedal sensor)",
  throttleDesc:
    "The MCOR is the gas pedal sensor on the transportation pedal group. Factory: yellow 0.32 V up → 4.65 V full. Yellow to purple 1 kΩ up → 5.67–7.43 kΩ full. The limit switch must close so the big click switch can turn on.",
  manualPrefix: "2008–2011 Transportation M&S + IQ Plus supplement 103373107 (Excel-family TP 1–16)",
  packCells: "Six 8 V batteries in a row (48 V total)",
  lockoutNote: "If the charger is plugged in, a safety lock stops the click switch. Unplug it before you test.",
  solenoidCoil: { min: 180, max: 190, label: "180–190 Ω" },
});
