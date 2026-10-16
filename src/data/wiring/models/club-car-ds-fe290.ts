import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "fe350-main",
    title: "Kawasaki FE350 — electric and gas-pedal sensor wires",
    manualRef: "2015 Precedent M&S §13 FE350 wire maps",
    src: "/wiring/fe350-main.jpg",
    kind: "full",
    landscape: true,
  },
  {
    id: "fe350-accessories",
    title: "Kawasaki FE350 — lights and extras",
    manualRef: "2015 Precedent M&S §13 FE350 wire maps",
    src: "/wiring/fe350-accessories.jpg",
    kind: "accessory",
    landscape: true,
  },
  {
    id: "dsgas-circuits",
    title: "DS gas — starter-generator wires (Fig. 12-4)",
    manualRef: "1995–96 DS M&S, Section 12, page 12-4",
    src: "/wiring/dsgas-circuits.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "dsgas-kill",
    title: "DS gas — spark and kill-switch wires (Fig. 12-7)",
    manualRef: "1995–96 DS M&S, Section 12, page 12-5",
    src: "/wiring/dsgas-kill.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "dsgas-oil",
    title: "DS gas — low-oil warning wires (Fig. 12-9)",
    manualRef: "1995–96 DS M&S, Section 12, page 12-6",
    src: "/wiring/dsgas-oil.jpg",
    kind: "control",
    landscape: false,
  },
];
