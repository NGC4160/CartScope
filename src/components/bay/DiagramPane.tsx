import { useMemo, useState } from "react";
import { ComponentDetail } from "@/components/bench/ComponentDetail";
import { findComponent, SystemDiagram } from "@/components/diagram/SystemDiagram";
import { WiringCanvas } from "@/components/wiring/WiringCanvas";
import { sheetsForPack } from "@/data/wiring";
import type { ModelPack } from "@/data/types";
import { BAY_TAP_MIN_PX } from "@/lib/bay-chrome";
import { ZoomPan } from "@/components/bay/ZoomPan";

const SHEET_KIND: Record<string, string> = {
  full: "Full wire picture",
  power: "Power wires",
  control: "Control wires",
  charge: "Charge wires",
  harness: "Wire bundle",
  pinout: "Plug pins",
  accessory: "Lights and extras",
};

export function DiagramPane({
  pack,
  highlight,
}: {
  pack: ModelPack;
  highlight: string[];
}) {
  const sheets = useMemo(() => sheetsForPack(pack.id), [pack.id]);
  const [tab, setTab] = useState<"schematic" | string>("schematic");
  const [selected, setSelected] = useState<string | null>(null);
  const selectedComp = findComponent(pack, selected);
  const sheet = sheets.find((s) => s.id === tab);

  return (
    <div data-testid="bay-diagram" className="flex h-full min-h-0 flex-col bg-paper">
      <div className="no-print flex flex-nowrap gap-2 overflow-x-auto border-b border-line bg-surface px-2 py-2">
        <TabButton
          active={tab === "schematic"}
          onClick={() => {
            setTab("schematic");
            setSelected(null);
          }}
          title="This check"
          hint="Color picture"
        />
        {sheets.map((s) => (
          <TabButton
            key={s.id}
            active={tab === s.id}
            onClick={() => {
              setTab(s.id);
              setSelected(null);
            }}
            title={s.title}
            hint={SHEET_KIND[s.kind] ?? s.kind}
          />
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        {tab === "schematic" ? (
          <ZoomPan label={pack.diagramTitle}>
            <SystemDiagram
              pack={pack}
              highlight={highlight}
              selectedId={selected}
              onSelect={setSelected}
            />
          </ZoomPan>
        ) : sheet ? (
          <WiringCanvas key={sheet.src} src={sheet.src} alt={sheet.title} />
        ) : (
          <p className="p-4 text-sm text-ink-muted">No picture for this tab.</p>
        )}
        {tab === "schematic" && selectedComp ? (
          <div className="absolute bottom-2 left-2 right-2 z-10 max-h-[42%]">
            <ComponentDetail component={selectedComp} onClose={() => setSelected(null)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 rounded-md px-3 py-2 text-left text-sm shadow-[var(--shadow-border)] " +
        (active ? "bg-navy text-navy-fg" : "bg-surface text-ink")
      }
      style={{ minHeight: BAY_TAP_MIN_PX }}
    >
      <p className="font-medium leading-tight">{title}</p>
      <p className={"font-mono text-[10px] " + (active ? "text-navy-fg/70" : "text-ink-subtle")}>{hint}</p>
    </button>
  );
}
