import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const ezgoTxt = buildEzgoDc({
  id: "ezgo-txt-tct",
  name: "TXT 48 V TCT",
  fullName: "EZ-GO TXT 48 V TCT (Curtis 1206HB-5201)",
  years: "TXT 48 V TCT (48V TXT Service Manual, Electronic Speed Control — TCT, Section E) — Fleet / Freedom 48 V TCT",
  architecture: "TCT electric · Curtis 1206HB-5201 · gas pedal sensor",
  diagramTitle: "Power and control picture — TXT 48 V TCT",
  diagramNotes: [
    "This is the 48 V TCT electric tree, not PDS. The speed box (controller) is a Curtis 1206HB-5201. Section E of the 48 V TXT service manual.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. ITS factory: 1.0 V ± 0.3 V when the big click switch clicks; 2.7 V ± 0.5 V at full pedal.",
    "The Run/Tow switch is a safety switch. After you put battery cables back on, leave Run/Tow in Tow about 30 seconds before Run so the 1206HB can pre-charge.",
    "Power cables: CB+ to the big click switch, CB− to battery B−, A1/C from motor 4 AWG. 16-pin from the main harness.",
  ],
  voltage: 48,
  controllerName: "Curtis 1206HB-5201 TCT speed box (controller)",
  controllerDesc:
    "TXT TCT electric speed box, 16-pin main harness, KSI on white. Fault table is Section E: HW FAILSAFE, FIELD MISSING, M− SHORTED, CURRENT SENSE FAULT, MAIN DROPOUT 1/2, MAIN DRIVER ON/OFF, MOTOR STALL, MAIN COIL OPEN, SPEED SENSOR FAULT, MAIN WELDED, HPD, THERMAL CUTBACK, OVERVOLTAGE, LOW BATTERY VOLTAGE, THROTTLE FAULT. Response codes 1–9 (armature 0, field 0, contactor off, limp 75 %, thermal current limit, throttle scaled to 0, walk-away).",
  throttleName: "ITS (gas pedal sensor)",
  throttleDesc:
    "Solid-state gas pedal sensor (ITS) on the pedal box. Factory procedure: 1.0 V ± 0.3 V at big click switch click, 2.7 V ± 0.5 V full pedal. The plunger must enter the ITS body the right way (Figs. 10–12). THROTTLE FAULT = open or shorted wiring, or a bad ITS.",
  itsClick: { min: 0.7, max: 1.3, label: "1.0 V ± 0.3 V at big click switch click" },
  itsFull: { min: 2.2, max: 3.2, label: "2.7 V ± 0.5 V full pedal" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω (replace if open/short; welded large posts = replace)" },
  packRested: { min: 48, max: 54.5, label: "48–54.5 V rested" },
  packLoad: { min: 42, max: 54.5, label: "≥ 42 V under load" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc: "OEM onboard charger (PowerWise / Lester / Delta-Q depending on year). DC output at the pack through the receptacle.",
  packCells: "Six 8 V batteries (48 V TXT)",
  manualPrefix: "48 V TXT Service Manual, Section E — Electronic Speed Control TCT",
  family: "tct",
});
