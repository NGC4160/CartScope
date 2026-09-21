import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const ezgoExpressL6 = buildEzgoDc({
  id: "ezgo-express-l6",
  name: "Express L6",
  fullName: "EZ-GO Express L6 Electric (48 V)",
  years: "Express L6 Electric (manual 625621) — 48 V Sepex with ITS, 24-pin J1, Run-Tow/Maintenance",
  architecture: "48 V electric · gas pedal sensor · 24-pin J1 · speed sensor · Run-Tow/Maintenance · blink-code faults",
  diagramTitle: "Power and control picture — Express L6 48 V",
  diagramNotes: [
    "This is the Express L6 electric tree from SM 625621 (shared with Express S6). It is not Express S4 High Output (manual 635085).",
    "The solenoid is the main power switch. It sends big power to the motor. Fig. 10 is the 48 Volt Wiring Diagram. J1-13 ITS output 1–3.5 V; J1-15 ITS supply 16–17 V.",
    "The Run-Tow/Maintenance switch is under the passenger seat (Fig. 2). Test in RUN. Tow/Maintenance left selected is a classic no-go.",
    "Fig. 8 48 volt Fault Codes: 1-1 hardware failsafe, 1-2 throttle, 1-3 speed sensor, 1-4 HPD, 1-5 motor stall, 2-1 low pack, 3-2 solenoid welded, 5-2 main coil open, … Write the blinks down before you key-cycle.",
  ],
  voltage: 48,
  controllerName: "Express L6 48 V electric controller",
  controllerDesc:
    "Solid-state electric controller under the passenger seat (SM 625621). Pedal box on 24-pin J1. Speed sensor on J2. Fig. 8 48 volt Fault Codes and Fig. 9 Controller Connectors and Connections. Handheld programmer on J3.",
  throttleName: "ITS (gas pedal sensor)",
  throttleDesc:
    "Solid-state ITS in the enclosed pedal box. Fig. 12 J-1 Pin Connector Diagnostics (Continued): J1-13 = 1–3.5 V ITS output (pedal up to wide open). J1-15 = 16–17 V ITS supply (if J1-15 is low, unplug the ITS — voltage comes back = bad ITS, stays low = bad controller).",
  itsClick: { min: 0.7, max: 1.3, label: "1.0 V ± 0.3 V at solenoid click" },
  itsFull: { min: 2.2, max: 3.2, label: "2.7 V ± 0.5 V full pedal" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω (5-2 Main coil open if open/short)" },
  packRested: { min: 48, max: 54.5, label: "≈ 48 V reference (six 8 V or eight 6 V)" },
  packLoad: { min: 42, max: 54.5, label: "≥ 42 V under load (2-1 Low battery if not)" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc: "OEM onboard charger through the receptacle. Run-Tow/Maintenance in Tow/Maintenance unhooks controller drain for storage.",
  packCells: "48 V pack (six 8 V or eight 6 V — match the unit; SM 625621 notes ~48 V on 8-battery applications)",
  manualPrefix: "Express L6/S6 Electric Service Manual 625621 — Electronic Speed Control",
  family: "tct",
  towName: "Run-Tow/Maintenance switch",
  towDesc:
    "Express L6/S6 uses a Run-Tow/Maintenance switch under the passenger seat (Fig. 2). RUN powers controller logic. Tow/Maintenance unhooks the 48 V system so it will not drain the pack. Test in RUN.",
});
