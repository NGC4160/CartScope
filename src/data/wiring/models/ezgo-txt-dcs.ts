import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "dcs-connector",
    title: "Fig. E-7 Checking Voltage on Ten Pin Connector",
    manualRef:
      "TXT 96–01 DCS Service Manual (28407-G01), Fig. E-7 Checking Voltage on Ten Pin Connector, page E-6 — Electronic Speed Control (DCS)",
    src: "/wiring/dcs-connector.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "dcs-wiring",
    title: "Fig. E-16 Wiring Diagram",
    manualRef:
      "TXT 96–01 DCS Service Manual (28407-G01), Fig. E-16 Wiring Diagram, page E-14 — Electronic Speed Control (DCS)",
    src: "/wiring/dcs-wiring.jpg",
    kind: "full",
    landscape: false,
  },
// Factory Fig. E-6 — 96-01 EZGO TXT DCS Service Manual (28407-G01), Drive 1mqKd5SC2tksQExnGmn5iUUOdFMcEG7PT.
// Kind/landscape match YDRE Ch.9 / TXT PDS troubleshooting trees. ezgo-txt-dcs only.
  {
    id: "dcs-e6-ten-pin-troubleshooting",
    title: "Fig. E-6 Ten Pin Connector Troubleshooting Diagram",
    manualRef:
      "TXT 96–01 DCS Service Manual (28407-G01), Fig. E-6 Ten Pin Connector Troubleshooting Diagram, page E-5 — Electronic Speed Control (DCS)",
    src: "/wiring/dcs-e6-ten-pin-troubleshooting.png",
    kind: "control",
    landscape: false,
  },
  {
    id: "dcs-g21",
    title: "Fig. G-21 Wiring Diagram",
    manualRef:
      "TXT 96–01 DCS Service Manual (28407-G01), Fig. G-21 Wiring Diagram, page G-16 — Electronic Speed Control (4-pin / 1206)",
    src: "/wiring/dcs-fig-g21-wiring.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "dcs-l3",
    title: "Fig. L-3 Powerwise™ Wiring Diagram",
    manualRef: "TXT 96–01 DCS Service Manual (28407-G01), Fig. L-3 Powerwise™ Wiring Diagram, page L-4 — Battery Charger",
    src: "/wiring/dcs-fig-l3-powerwise.jpg",
    kind: "charge",
    landscape: false,
  },
  {
    id: "dcs-l4",
    title: "Fig. L-4 Powerwise™ + Wiring Diagram",
    manualRef: "TXT 96–01 DCS Service Manual (28407-G01), Fig. L-4 Powerwise™ + Wiring Diagram, page L-5 — Battery Charger",
    src: "/wiring/dcs-fig-l4-powerwise-plus.jpg",
    kind: "charge",
    landscape: false,
  },
];
