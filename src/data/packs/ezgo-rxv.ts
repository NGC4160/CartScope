import { buildAcDrive } from "@/data/builders/ac-drive";

export const ezgoRxv = buildAcDrive({
  id: "ezgo-rxv-ac",
  manufacturer: "ezgo",
  manufacturerLabel: "EZ-GO",
  name: "RXV AC",
  fullName: "EZ-GO RXV Fleet / Freedom / Shuttle 2+2 AC (48 V)",
  years: "2008–2012+ RXV AC (RXV Fleet, Freedom, Shuttle 2+2 electric service manual, Section O)",
  architecture: "AC electric · electric park brake · 4×12 V · Section O error codes",
  diagramTitle: "Power and control picture — RXV AC 48 V",
  diagramNotes: [
    "Four 12 V batteries. Section O: 42 VDC minimum, 63 VDC maximum on DC-bus tests.",
    "The big click switch (solenoid) is the main power switch. It sends pack power into the speed box (controller). The speed box is a three-phase AC inverter. U–V, V–W, W–U each 0.4–0.8 Ω (errors 8976 AC Over Current, 9024 AC Short Circuit).",
    "Park-brake coil 27 ± 3 Ω (error 25107 startup test).",
    "Gas pedal sensor 0.35–4.8 V typical. Must be ≤ 0.85 V when the pedal switch closes.",
    "The Run/Tow switch is a safety switch. Never tow an RXV with Run/Tow in Run.",
  ],
  controllerName: "RXV AC speed box (Sevcon / Dana)",
  controllerDesc:
    "RXV three-phase AC inverter (speed box). 23-pin signal plug, 5 V gas pedal sensor reference, brake-release output, CAN/status. Section O error table: 8976, 9024, 12576 DC Bus Timeout, 12817/12818 DC Bus High, 12833 DC Bus Low, 16912 Motor Temp, 17168 Heat Sink Temp, 20753 15 V supply, 20755 5 V supply, 25104 Direction, 25107 park brake, 25108 brake sensor. Power resistor on the energy-burn circuit 0.2–0.5 Ω.",
  motorName: "RXV AC drive motor",
  brakeName: "Park brake (electric magnet)",
  brakeOhms: { min: 24, max: 30, label: "27 ± 3 Ω" },
  phaseOhms: { min: 0.4, max: 0.8, label: "0.4–0.8 Ω each, and equal" },
  throttleUp: { min: 0.35, max: 1.0, label: "0.35–1.0 V rest (≤ 0.85 V at switch close)" },
  throttleFull: { min: 3.5, max: 4.8, label: "3.5–4.8 V full pedal" },
  packRested: { min: 42, max: 54.5, label: "42–54.5 V (42 V min / 63 V max on DC-bus tests)" },
  packCells: "Four 12 V batteries in a row (48 V total)",
  packMinV: 42,
  manualPrefix: "RXV Electric Service Manual, Section O — Troubleshooting and Diagnostics",
  errorNotes:
    "RXV Section O error table:\n8976 AC Over Current — key cycle; U/V/W 0.4–0.8 Ω; motor then speed box.\n9024 AC Short Circuit — same U/V/W then swap-speed-box test.\n12576 DC Bus Timeout — bus not 24 V in 10 s after key. Pack ≥ 42 V; click-switch metal pads; resistor module at B−.\n12817 DC Bus High (software, pack > 63 V) / 12818 hardware > 67 V — battery cables < 0.1 Ω to posts; click-switch drop; power resistor 0.2–0.5 Ω; resistor module.\n12833 DC Bus Low (bus < 18 V) — same power-path tree, pack ≥ 42 V.\n16912 Motor Temp High — motor ≥ 150 °C; thermocouple 400–1300 Ω (1300 Ω = 150 °C).\n17168 Heat Sink Temp High — speed box ≥ 120 °C; outside sink < 80 °C.\n20753 15 V supply low — reverse alarm 100–500 Ω, relay 1–50 Ω.\n20755 5 V supply low/high — 5 V harness short.\n25104 Direction Error — FNR.\n25107 park brake startup — coil 27 ± 3 Ω.\n25108 Brake Sensor Error.",
});
