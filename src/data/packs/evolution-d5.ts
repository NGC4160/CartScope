import { buildAcDrive } from "@/data/builders/ac-drive";

export const evolutionD5 = buildAcDrive({
  id: "evolution-d5",
  manufacturer: "evolution",
  manufacturerLabel: "Evolution",
  name: "D5 AC System",
  fullName: "Evolution D5 AC System (48 V lithium)",
  years: "Evolution D5 AC system wiring diagrams V1.0 (EV48-400-A / EV48-400-C, 6.3 kW, lithium 110 Ah / 205 Ah)",
  architecture: "48 V AC · EV48-400 · lithium · CAN · touch panel · EM brake optional",
  diagramTitle: "Power and control picture — Evolution D5 AC System V1.0",
  diagramNotes: [
    "D5 MODELS-AC SYSTEM WIRING DIAGRAM V1.0. Printed plates: AC SYSTEM DIAGRAM-V1.0, D5 GENERAL COMMUNICATION DIAGRAM, TOUCH PANEL-V1.0, lithium layout and internal circuit.",
    "Controller callout on the title sheet is EV48-400-A / EV48-400-C, motor 6.3 kW, lithium 110 Ah / 205 Ah. Do not use the generic 1232SE Evolution AC pack for a D5 lithium cart.",
    "LIGHT KITS-V1.0 in the same binder is a lamp identification drawing, not a wire map — it was not added.",
  ],
  controllerName: "EV48-400-A / EV48-400-C",
  controllerDesc:
    "Evolution D5 AC controller as titled on D5 MODELS-AC SYSTEM WIRING DIAGRAM V1.0 (EV48-400-A / EV48-400-C). 35-pin connector and CAN to the lithium pack / touchscreen / sound bar on the communication plates.",
  motorName: "D5 6.3 kW AC induction motor",
  brakeName: "EM brake (optional on AC SYSTEM DIAGRAM-V1.0)",
  brakeOhms: { min: 20, max: 40, label: "Typically 20–40 Ω if an EM park brake is fitted" },
  phaseOhms: { min: 0.2, max: 1.5, label: "phase-to-phase — confirm on the cart (equal)" },
  throttleUp: { min: 0.3, max: 1.0, label: "rest — confirm on the D5 plate" },
  throttleFull: { min: 3.5, max: 4.8, label: "full pedal — confirm on the D5 plate" },
  packRested: { min: 42, max: 58, label: "lithium 48 V pack at rest — match the cart" },
  packCells: "Lithium 110 Ah / 205 Ah as printed on the D5 title sheet",
  packMinV: 42,
  manualPrefix: "Evolution D5 — AC System Wiring Diagrams V1.0",
  errorNotes:
    "D5: charging interlock in the charge socket disables throttle. Key FOB must be in range for the one-key start module. CAN-high / CAN-low on the communication plate. Lithium internal circuit is on LITHIUM BATTERY PACK INTERNAL CIRCUIT DIAGRAM-V1.0.",
});
