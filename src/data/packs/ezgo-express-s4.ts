import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const ezgoExpressS4 = buildEzgoDc({
  id: "ezgo-express-s4",
  name: "Express S4 High Output",
  fullName: "EZ-GO Express S4 High Output (48 V)",
  years: "Express S4 High Output (manual 635085) — 48 V Sepex with ITS, 24-pin J1, handheld programmer on 4-pin Molex",
  architecture: "48 V electric · gas pedal sensor · 24-pin J1 · speed sensor · Run-Storage · blink-code faults",
  diagramTitle: "Power and control picture — Express S4 High Output 48 V",
  diagramNotes: [
    "This is a 48 V electric cart with a gas pedal sensor (ITS). It is not an RXV AC inverter. Do not ohm U/V/W.",
    "The big click switch (solenoid) is the main power switch. It sends big power to the motor. ITS factory (manual p. 95): 1.0 V ± 0.3 V when the big click switch clicks; 2.7 V ± 0.5 V at full pedal. J1-13 ITS output 1–3.5 V; J1-15 ITS supply 16–17 V.",
    "The Run-Storage switch is under the passenger seat. STORAGE is for storage (speed box drain). RUN is for testing. Towing in Run, or leaving Storage selected, is a classic no-go.",
    "The speed box face blinks fault codes (1-1 HW failsafe, 1-2 throttle, 1-3 speed sensor, 1-4 HPD, 1-5 motor stall, 2-1 low pack, 3-2 solenoid welded, 3-4 field missing, 5-2 main coil open, …). Write the blinks down before you key-cycle.",
  ],
  voltage: 48,
  controllerName: "Express S4 48 V electric speed box (controller)",
  controllerDesc:
    "Solid-state electric speed box under the passenger seat. Pedal box on 24-pin J1. Speed sensor on 3-pin J2. Downhill regen braking uses the tail speed sensor. Anti-stall cuts power if the motor is stalled. Blink-code chart (Fig. 7): 1-1 hardware failsafe (motor wiring then speed box), 1-2 throttle fault (pedal box / ITS), 1-3 speed sensor, 1-4 HPD, 1-5 motor stall, 2-1 low battery, 2-2 high battery, 2-3 thermal cutback, 3-1 main driver OFF, 3-2 solenoid welded, 3-3 precharge, 3-4 field missing, 5-1 key SRO, 5-2 main coil open. Handheld programmer on the 4-pin Molex.",
  throttleName: "ITS (gas pedal sensor)",
  throttleDesc:
    "Solid-state ITS in the enclosed pedal box, plunger on the pedal. Factory: sit in the seat, FNR to N then F, key ON, probe the white ITS wire to pack B−. 1.0 V ± 0.3 V at big click switch click, 2.7 V ± 0.5 V full pedal. Set plunger-to-ITS face with a 7/32 in drill bit, pedal up. J1-13 = 1–3.5 V ITS output. J1-15 = 16–17 V ITS supply (if J1-15 is low, unplug the ITS — voltage comes back = bad ITS, stays low = bad speed box).",
  itsClick: { min: 0.7, max: 1.3, label: "1.0 V ± 0.3 V at big click switch click" },
  itsFull: { min: 2.2, max: 3.2, label: "2.7 V ± 0.5 V full pedal" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω (5-2 Main coil open if open/short)" },
  packRested: { min: 48, max: 54.5, label: "≈ 48 V reference (six 8 V or eight 6 V)" },
  packLoad: { min: 42, max: 54.5, label: "≥ 42 V under load (2-1 Low battery if not)" },
  computerName: "Onboard charger",
  computerKind: "charger",
  computerDesc:
    "OEM onboard charger through the receptacle. Run-Storage in STORAGE unhooks speed-box drain for storage. Charging with STORAGE selected is fine. Driving is not.",
  packCells: "48 V pack (six 8 V or eight 6 V — match the unit; manual notes ~48 V on 8-battery applications)",
  manualPrefix: "Express S4 High Output Service Manual 635085 — Electronic Speed Control",
  family: "tct",
  towName: "Run / Storage switch",
  towDesc:
    "Express S4 uses a Run-Storage switch under the passenger seat, not a golf-car Tow/Run label. RUN powers speed-box logic. STORAGE unhooks the 48 V system so it will not drain the pack in storage. Test in RUN. STORAGE left selected is a classic no-go.",
});
