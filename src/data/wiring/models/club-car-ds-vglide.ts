import type { WiringSheet } from "../types.ts";

export const sheets: WiringSheet[] = [
  {
    id: "vglide-schematic",
    title: "V-Glide 36 V — control, power, and charge map (Fig. 19-2)",
    manualRef: "1995–96 DS M&S, Figure 19-2, page 19-3",
    src: "/wiring/vglide-schematic.jpg",
    kind: "full",
    landscape: false,
  },
  {
    id: "vglide-control",
    title: "V-Glide 36 V — control-wire test map (Fig. 19-4)",
    manualRef: "1995–96 DS M&S, Figure 19-4, page 19-7",
    src: "/wiring/vglide-control.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "vglide-power",
    title: "V-Glide 36 V — power-wire test map (Fig. 19-5)",
    manualRef: "1995–96 DS M&S, Figure 19-5, page 19-9",
    src: "/wiring/vglide-power.jpg",
    kind: "power",
    landscape: false,
  },
// Club Car DS 2000 supplements — gap fill vs 1995–96 Fig. 19 / 20 / 21 plates
  {
    id: "ds2000-vglide-fig11-2",
    title: "2000 V-Glide 36 V — Figure 11-2 Speed Controller",
    manualRef:
      "2000 V-Glide 36-Volt Vehicle Maintenance and Service Supplement, Figure 11-2 Speed Controller, page 11-3",
    src: "/wiring/ds2000-vglide-fig11-2-speed-controller.jpg",
    kind: "control",
    landscape: false,
  },
  {
    id: "ds2000-vglide-fig11-3",
    title: "2000 V-Glide 36 V — Figure 11-3 Vehicle Wiring Diagram",
    manualRef:
      "2000 V-Glide 36-Volt Vehicle Maintenance and Service Supplement, Figure 11-3 Vehicle Wiring Diagram, page 11-4",
    src: "/wiring/ds2000-vglide-fig11-3-vehicle.jpg",
    kind: "full",
    landscape: false,
  },
];
