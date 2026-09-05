import { buildClubCarIq } from "@/data/builders/club-car-iq";

export const clubCarPrecedentExcel = buildClubCarIq({
  id: "club-car-precedent-excel",
  name: "Precedent Excel",
  fullName: "Club Car Precedent Excel (48 V)",
  years: "2008–2014 Precedent Excel (manual 103373101, 2008 IQ System and Excel M&S; 2009–2011 electric Precedent)",
  architecture: "Excel electric · cart computer · gas pedal sensor · 16-pin plug",
  diagramTitle: "Power and control picture — Precedent Excel 48 V",
  diagramNotes: [
    "Excel shares Tow/Run, MCOR (gas pedal sensor), cart computer safety lock, and the 16-pin plug with IQ. Use Excel speed box part numbers. Do not put an IQ speed box in an Excel cart.",
    "The Tow/Run switch is in the battery negative path. Turn it to Tow before you take battery cables off.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. The coil is still 180–190 Ω. MCOR voltage and ohms use the same Test Procedure 4 window (0.32–4.65 V / 5.67–7.43 kΩ).",
    "2009–2011 Villager/Transporter IQ Plus is a different transportation pack (supplement 103373107).",
  ],
  controllerName: "Excel speed box (controller)",
  controllerDesc:
    "This is the Excel electric speed box used on 2008+ Precedent Excel. It uses the same big click switch / gas pedal sensor / cart computer path as IQ, with Excel software and the Excel handset. Big plus power comes through the big click switch. Big minus power comes through Tow/Run. Do not mix IQ and Excel speed boxes.",
  computerName: "Cart computer (OBC)",
  computerKind: "computer",
  computerDesc:
    "The cart computer watches the charger safety lock and the PowerDrive charge path on Excel carts built before ERIC. Book test 2 still applies: the red 18-gauge at the six-pin must read pack voltage with the charger out.",
  computerFailures: [
    "Cart computer safety lock after the batteries run very low",
    "Bad charge path — pack never reaches 50+ V",
    "Rusty six-pin plug",
  ],
  throttleName: "MCOR (gas pedal sensor)",
  throttleDesc:
    "Same MCOR as IQ Precedent: a two-pin limit switch plus a three-pin sensor that changes ohms as you press the pedal. Yellow 0.32 V up → 4.65 V full. Yellow to purple 1 kΩ up → 5.67–7.43 kΩ full. Excel will not click the big click switch without the limit switch.",
  manualPrefix: "2008 Precedent IQ System and Excel M&S (103373101) Section 11",
  packCells: "Six 8 V batteries in a row (48 V total)",
  lockoutNote: "Excel also stops the click switch while the charger is plugged in. Unplug J1 before you test a dead cart.",
  solenoidCoil: { min: 180, max: 190, label: "180–190 Ω" },
});
