import { buildAcDrive } from "@/data/builders/ac-drive";

export const trackerEvis2020 = buildAcDrive({
  id: "tracker-evis-2020",
  manufacturer: "tracker",
  manufacturerLabel: "Tracker",
  name: "EViS 72 V",
  fullName: "Tracker EViS 72 V (dual AC motor controllers)",
  years: "2020 Tracker EViS 72 V (Repair and Service Manual 10002660-C, Electrical)",
  yearMin: 2020,
  yearMax: 2020,
  architecture: "72 V AC · dual Curtis 1236 (front slave / rear master) · 35-pin · six 12 V batteries",
  diagramTitle: "Power and control picture — Tracker EViS 72 V",
  diagramNotes: [
    "Factory plates from Tracker EViS Repair and Service Manual 10002660-C: Fig. 1 Main Harness Routing, Fig. 2 Main Harness Wiring Diagram, Fig. 3 / Fig. 4 Electrical Schematic, Fig. 9 Front-Slave / Rear-Master 35-pin, and Fig. 19 Winch Contactor Connections.",
    "Two AC motor controllers — rear is master, front is slave. CAN links them. Six 12 V batteries in series (72 V). Confirm which 35-pin you are on before you probe.",
    "This is the EViS golf-cart harness, not Tracker 800SX UTV. Handheld / fault-chart pages were not added (not wiring plates).",
  ],
  controllerName: "EViS front slave / rear master (Curtis 1236, 35-pin)",
  controllerDesc:
    "Dual Curtis 1236 AC controllers as drawn on Fig. 3 / Fig. 4 Electrical Schematic and Fig. 9 Front - Slave and Rear - Master. FRONT-SLAVE and REAR-MASTER 35-pin maps: +72 V, +12 V, +5 V, CAN, analog, GND DVR. Confirm which connector you are on before you probe.",
  motorName: "EViS AC drive motor (front and rear)",
  brakeName: "EM park brake (EViS)",
  brakeOhms: { min: 20, max: 40, label: "EM park-brake coil — confirm on Fig. 3 Electrical Schematic / the cart" },
  phaseOhms: { min: 0.2, max: 2.0, label: "U–V, V–W, W–U equal — confirm on the motor" },
  throttleUp: { min: 0.0, max: 1.0, label: "0–100 % throttle command on the Curtis handheld — rest is ~0 %" },
  throttleFull: { min: 3.5, max: 5.0, label: "Throttle pot pin 16 / pot 2 pin 17 — 0–5 V raw on the 10002660-C guide" },
  packRested: { min: 70, max: 78, label: "70–78 V rested (six 12 V in series)" },
  packCells: "Six 12 V batteries in series (72 V) — Fig. 3 Electrical Schematic / Fig. 5 72V Battery Set Connections",
  packMinV: 60,
  manualPrefix: "Tracker EViS 72 V Repair and Service Manual 10002660-C — Electrical",
  errorNotes:
    "EViS: Curtis handheld / Status LED. Write the code from the 10002660-C fault chart before you key-cycle. Dual-controller cart — confirm front slave vs rear master on Fig. 9.",
});
