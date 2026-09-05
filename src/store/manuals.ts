import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import type { ManualCandidate } from "@/lib/manuals";

interface ManualState {
  candidates: ManualCandidate[];
  propose: (input: { packId: string; title: string; sourceNote: string; sourceUrl?: string }) => ManualCandidate;
  setStatus: (id: string, status: ManualCandidate["status"]) => void;
  forPack: (packId: string) => ManualCandidate[];
}

export const useManualStore = create<ManualState>()(
  persist(
    (set, get) => ({
      candidates: [],
      propose: (input) => {
        const row: ManualCandidate = {
          id: uid("man"),
          packId: input.packId,
          title: input.title.trim(),
          sourceNote: input.sourceNote.trim(),
          sourceUrl: input.sourceUrl?.trim() || undefined,
          status: "proposed",
          at: new Date().toISOString(),
        };
        set({ candidates: [row, ...get().candidates] });
        return row;
      },
      setStatus: (id, status) => {
        set({
          candidates: get().candidates.map((c) => (c.id === id ? { ...c, status } : c)),
        });
      },
      forPack: (packId) => get().candidates.filter((c) => c.packId === packId),
    }),
    { name: "cartscope-manuals-v1" },
  ),
);
