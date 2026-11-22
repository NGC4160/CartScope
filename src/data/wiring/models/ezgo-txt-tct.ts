import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "txt-electrical-1",
    title: "TXT 48 V — electric system map (M-1)",
    manualRef: "48 V TXT Service Manual, Section M page M-1",
    src: "/wiring/txt-electrical-1.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "txt-electrical-2",
    title: "TXT 48 V — electric system map (M-2)",
    manualRef: "48 V TXT Service Manual, Section M page M-2",
    src: "/wiring/txt-electrical-2.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "txt-electrical-3",
    title: "TXT 48 V — electric system map (M-3)",
    manualRef: "48 V TXT Service Manual, Section M page M-3",
    src: "/wiring/txt-electrical-3.jpg",
    kind: "harness",
    landscape: false,
  },
  {
    id: "txt-electrical-4",
    title: "TXT 48 V — electric system map (M-4)",
    manualRef: "48 V TXT Service Manual, Section M page M-4",
    src: "/wiring/txt-electrical-4.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "txt48-fig8",
    title: "Fig. 8 Controller Connectors and Connections",
    manualRef:
      "48 V TXT Service Manual, Electronic Speed Control — TCT, Fig. 8 Controller Connectors and Connections, page E-8",
    src: "/wiring/txt48-fig8-controller-connectors.jpg",
    kind: "pinout",
    landscape: false,
  },
  {
    id: "txt48-fig9",
    title: "Fig. 9 Controller Wiring Diagram",
    manualRef:
      "48 V TXT Service Manual, Electronic Speed Control — TCT, Fig. 9 Controller Wiring Diagram, page E-9",
    src: "/wiring/txt48-fig9-controller-wiring.jpg",
    kind: "full",
    landscape: false,
  },
];
