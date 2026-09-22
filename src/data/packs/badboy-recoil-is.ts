import { buildAcDrive } from "@/data/builders/ac-drive";

export const badboyRecoilIs = buildAcDrive({
  id: "badboy-recoil-is",
  manufacturer: "badboy",
  manufacturerLabel: "Bad Boy",
  name: "Recoil iS 72 V",
  fullName: "Bad Boy Recoil iS 72 V (dual AC motor controllers)",
  years: "Recoil iS 72 V Electrical Service Guide (9/11/2012)",
  architecture: "72 V AC · dual Curtis controllers (front slave / rear master) · 35-pin · six 12 V batteries",
  diagramTitle: "Power and control picture — Recoil iS 72 V",
  diagramNotes: [
    "Plates from the 2012 Recoil iS Electrical Service Guide: Battery Layout (six 12 V in series, B+ / B− 72 V) and Electrical Information – Recoil (FRONT-SLAVE / REAR-MASTER 35-pin).",
    "Two AC motor controllers — rear is master, front is slave. CAN links them. Run / Maintenance–Storage switch sits on the right rear splash guard.",
    "This is the Recoil vehicle harness, not the generic Curtis 1232E/SE manual pack.",
  ],
  controllerName: "Recoil front slave / rear master (35-pin)",
  controllerDesc:
    "Dual AC controllers as drawn on Electrical Information – Recoil. FRONT-SLAVE and REAR-MASTER 35-pin maps: +72 V, +12 V, +5 V, CAN, analog, GND DVR. Confirm which connector you are on before you probe.",
  motorName: "Recoil AC drive motor (front and rear)",
  brakeName: "Hydraulic service brakes + park brake (Recoil iS)",
  brakeOhms: { min: 20, max: 40, label: "Hydraulic service brakes — not an EM park-brake coil on this guide" },
  phaseOhms: { min: 0.2, max: 2.0, label: "U–V, V–W, W–U equal — confirm on the motor" },
  throttleUp: { min: 0.0, max: 1.0, label: "0–100 % throttle command on the 1311 — rest is ~0 %" },
  throttleFull: { min: 3.5, max: 5.0, label: "Throttle pot pin 16 / pot 2 pin 17 — 0–5 V raw on the 2012 guide" },
  packRested: { min: 70, max: 78, label: "70–78 V rested (six 12 V in series)" },
  packCells: "Six 12 V batteries in series (72 V) — Battery Layout plate, front of vehicle is B+",
  packMinV: 60,
  manualPrefix: "Recoil iS 72 V Electrical Service Guide (9/11/2012)",
  errorNotes:
    "Recoil iS: Curtis 1311 handheld / Status LED. Write the code from the Recoil fault chart before you key-cycle. Dual-controller cart — confirm front slave vs rear master on the Electrical Information plate.",
});
