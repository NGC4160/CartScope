import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AssistantDock } from "@/components/assistant/AssistantDock";
import { AppShell } from "@/components/layout/AppShell";
import { WiringCanvas } from "@/components/wiring/WiringCanvas";
import { Button } from "@/components/ui/button";
import { getPack } from "@/data/index";
import { sheetsForPack } from "@/data/wiring";

export const Route = createFileRoute("/wiring/$modelId")({ component: WiringModel });

const KIND_LABEL: Record<string, string> = {
  full: "Full wire picture",
  power: "Power wires",
  control: "Control wires",
  charge: "Charge wires",
  harness: "Wire bundle",
  pinout: "Plug pins",
  accessory: "Lights and extras",
};

function WiringModel() {
  const { modelId } = Route.useParams();
  const pack = getPack(modelId);
  const sheets = useMemo(() => (pack ? sheetsForPack(pack.id) : []), [pack]);
  const [sheetId, setSheetId] = useState(sheets[0]?.id);
  useEffect(() => {
    setSheetId(sheets[0]?.id);
  }, [pack?.id, sheets]);
  const sheet = sheets.find((s) => s.id === sheetId) ?? sheets[0];

  if (!pack) {
    return (
      <AppShell>
        <main className="p-8">
          <p>We do not know this cart.</p>
          <Link to="/wiring">All wire maps</Link>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      right={
        <>
          {sheet ? (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/print/wiring/$sheetId" params={{ sheetId: sheet.id }} search={{ modelId: pack.id }}>
                <Printer className="size-4" />
                <span className="hidden sm:inline">Print picture</span>
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/wiring">All carts</Link>
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-line bg-surface-2 px-4 py-2">
          <p className="font-medium text-ink">{pack.fullName}</p>
          <p className="font-mono text-[11px] text-ink-subtle">{pack.architecture}</p>
        </div>

        {sheets.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-xl font-semibold">No scanned picture for this cart</p>
            <p className="mt-2 max-w-md text-sm text-ink-muted">
              Use the color picture on the check screen. We can add more book pages later.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/">Start a job</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="no-print flex flex-nowrap gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-2">
              {sheets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSheetId(s.id)}
                  className={
                    "min-h-12 shrink-0 rounded-md px-3 py-2 text-left text-sm shadow-[var(--shadow-border)] " +
                    (sheet?.id === s.id ? "bg-navy text-navy-fg" : "bg-surface text-ink")
                  }
                >
                  <p className="font-medium leading-tight">{s.title}</p>
                  <p className={"font-mono text-[10px] " + (sheet?.id === s.id ? "text-navy-fg/70" : "text-ink-subtle")}>
                    {KIND_LABEL[s.kind] ?? s.kind}
                  </p>
                </button>
              ))}
            </div>
            {sheet ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <p className="no-print border-b border-line bg-paper px-4 py-1.5 font-mono text-[11px] text-ink-muted">
                  {sheet.manualRef}
                </p>
                <div className="min-h-72 flex-1">
                  <WiringCanvas key={sheet.src} src={sheet.src} alt={sheet.title} />
                </div>
              </div>
            ) : null}
          </>
        )}
        <AssistantDock modelId={pack.id} />
      </div>
    </AppShell>
  );
}
