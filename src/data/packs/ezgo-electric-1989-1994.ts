import { buildEzgoDc } from "@/data/builders/ezgo-dc";

export const ezgoElectric19891994 = buildEzgoDc({
  id: "ezgo-electric-1989-1994",
  name: "Electric 1989–1994",
  fullName: "EZ-GO electric 1989–1994 (resistor-coil / solid-state, 36 V)",
  years: "1989–1994 EZ-GO electric (Operation and Service Manual — resistor-coil Section K and solid-state Section N)",
  yearMin: 1989,
  yearMax: 1994,
  architecture: "36 V electric · resistor-coil or solid-state speed control · mechanical F-N-R · six 6 V batteries",
  diagramTitle: "Power and control picture — EZ-GO electric 1989–1994",
  diagramNotes: [
    "Factory plates from the 1989–1994 electric extract: FIG. K-1 ELECTRIC VEHICLE WIRING DIAGRAM (resistor-coil), FIG. N-1 CONTROL AND POWER CIRCUITS (solid-state), and FIG. N-9 WIRING DIAGRAM (solid-state 12 VDC reverse-warning variant).",
    "36 V pack (six 6 V). Resistor-coil carts use the accelerator switch and resistor bank on K-1. Solid-state carts use the control module and 0–5000 Ω potentiometer on N-1 / N-9. Confirm which drawing matches the cart before you probe.",
    "This is not TXT DCS, PDS, or TCT. Marathon gas is a different pack. Charger internals and accessory horn/light circuits were not added.",
  ],
  voltage: 36,
  controllerName: "Resistor-coil / solid-state control module",
  controllerDesc:
    "1989–1994 EZ-GO electric. Resistor-coil: accelerator switch steps the resistor bank (FIG. K-1). Solid-state: control module with potentiometer 0–5000 Ω (FIG. N-1 / FIG. N-9). F-N-R switch works MS-2 / MS-4 (or MS-1 on the 12 VDC reverse-warning N-9 variant). Do not treat this as a DCS or TCT 16-pin cart.",
  throttleName: "Accelerator switch / potentiometer",
  throttleDesc:
    "Resistor-coil: accelerator switch actuates MS-3 in positions 1, 2, 3 and 4 (FIG. K-1). Solid-state: potentiometer 0–5000 Ω on the control module (FIG. N-1 / FIG. N-9). Confirm the drawing. These are not TXT ITS 1.0 / 2.7 V windows.",
  itsClick: { min: 0.0, max: 1.0, label: "first motion — confirm on FIG. K-1 / N-1 / the cart" },
  itsFull: { min: 3.0, max: 5.0, label: "full pedal / pot — confirm on FIG. N-1 (0–5000 Ω) / the cart" },
  solenoidCoil: { min: 40, max: 200, label: "40–200 Ω typical coil (confirm on FIG. K-1 / N-1 / the cart)" },
  packRested: { min: 36, max: 42, label: "36–42 V rested (six 6 V)" },
  packLoad: { min: 32, max: 42, label: "≥ 32 V under load" },
  computerName: "Onboard / Total Charge charger",
  computerKind: "charger",
  computerDesc:
    "Period Total Charge / receptacle path as drawn on the vehicle plates. Charger internals (Section J) were not added.",
  packCells: "Six 6 V batteries (36 V) — FIG. K-1 / FIG. N-1",
  manualPrefix: "EZ-GO Electric Operation and Service Manual (1989–1994) — Sections K and N",
  family: "dcs",
});
