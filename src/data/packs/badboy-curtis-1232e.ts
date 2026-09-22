import { buildAcDrive } from "@/data/builders/ac-drive";

export const badboyCurtis1232e = buildAcDrive({
  id: "badboy-curtis-1232e",
  manufacturer: "badboy",
  manufacturerLabel: "Bad Boy",
  name: "Curtis 1232E / SE",
  fullName: "Bad Boy Buggy — Curtis 1232E/SE AC controller",
  years: "Curtis 1232E/34E/36E/38E & 1232SE/34SE/36SE/38SE Manual, os 31 – May 2017 (Bad Boy Buggy binder)",
  architecture: "Curtis 1232E/SE AC · 35-pin AMPSEAL · 24–96 V · quadrature encoder",
  diagramTitle: "Power and control picture — Curtis 1232E/SE (Bad Boy binder)",
  diagramNotes: [
    "Plates from the Bad Boy Buggy Curtis controller manual (os 31 – May 2017): Figure 3 Basic Wiring Diagram, 35-pin AMPSEAL / Table 2 Low Power Connections, and Figure 4–6 throttle wiring.",
    "This is the generic Curtis 1232E/SE schematic. Ambush vehicle harnesses are on the Ambush gas / electric packs. Recoil iS 72 V dual-controller plates are on the Recoil iS pack.",
    "Main contactor coil must be wired to the controller as shown in Figure 3. Throttle Type 1 / 2 / 3 are separate figures — match the throttle on the cart.",
  ],
  controllerName: "Curtis 1232E / 1232SE",
  controllerDesc:
    "Curtis 1232E/SE (family 1232E/34E/36E/38E and SE) as drawn in Figure 3 Basic Wiring Diagram. 35-pin AMPSEAL (AMP 776164-1). B+ / B− / U / V / W power terminals. Confirm the model stamp on the controller.",
  motorName: "AC induction / SPM motor (as fitted)",
  brakeName: "EM brake (J1 driver on Figure 3)",
  brakeOhms: { min: 20, max: 40, label: "Typically 20–40 Ω if an EM park brake is fitted" },
  phaseOhms: { min: 0.2, max: 2.0, label: "U–V, V–W, W–U equal — confirm on the motor" },
  throttleUp: { min: 0.3, max: 1.0, label: "rest — match Throttle Type 1 / 2 / 3 on the plate" },
  throttleFull: { min: 3.5, max: 4.8, label: "full pedal — match the throttle figure on the cart" },
  packRested: { min: 24, max: 96, label: "24–96 V as stamped on the controller (Figure 3 note)" },
  packCells: "Pack voltage as stamped on the Curtis controller (24 / 36 / 48 / 72 / 80 / 96 V)",
  packMinV: 24,
  manualPrefix: "Curtis 1232E/SE Manual os 31 – May 2017 — Installation and Wiring",
  errorNotes:
    "Curtis 1232E/SE: Status LED / 1313 programmer. Write the code from Table 6 before you key-cycle. Figure 3 is the basic vehicle schematic. Table 2 is the 35-pin map. Ambush / Recoil vehicle harnesses are on their own packs.",
});
