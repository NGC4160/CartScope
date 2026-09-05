import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useEffect } from "react";
import { SystemDiagram } from "@/components/diagram/SystemDiagram";
import { Button } from "@/components/ui/button";
import { getPack } from "@/data/index";

export const Route = createFileRoute("/print/diagram/$modelId")({
  component: PrintDiagram,
});

function PrintDiagram() {
  const { modelId } = Route.useParams();
  const pack = getPack(modelId);

  useEffect(() => {
    document.title = pack ? `${pack.diagramTitle} — CartScope` : "Picture — CartScope";
  }, [pack]);

  if (!pack) {
    return (
      <main className="p-8">
        <p>We do not know this cart.</p>
        <Link to="/">Home</Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white text-ink">
      <div className="no-print flex items-center gap-3 border-b border-line px-4 py-3">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print / save PDF
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/">Back</Link>
        </Button>
        <p className="ml-auto text-sm text-ink-muted">Print this picture on one page</p>
      </div>
      <div className="flex flex-1 flex-col p-4 print:p-0">
        <div className="w-full">
          <SystemDiagram pack={pack} printMode />
        </div>
        <footer className="mt-2 grid gap-1 text-[11px] leading-snug text-ink-muted print:mt-1">
          {pack.diagramNotes.map((n) => (
            <p key={n}>{n}</p>
          ))}
          <p className="font-mono">
            CartScope · {pack.fullName} · Power wires = red · Control wires = blue · Ground wires = green
          </p>
        </footer>
      </div>
    </main>
  );
}
