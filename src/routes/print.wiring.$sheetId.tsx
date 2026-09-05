import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getPack } from "@/data/index";
import { getSheet } from "@/data/wiring";

type WiringSearch = { modelId?: string };

export const Route = createFileRoute("/print/wiring/$sheetId")({
  validateSearch: (search: Record<string, unknown>): WiringSearch => ({
    modelId: typeof search.modelId === "string" ? search.modelId : undefined,
  }),
  component: PrintWiring,
});

function PrintWiring() {
  const { sheetId } = Route.useParams();
  const { modelId } = Route.useSearch();
  const sheet = getSheet(sheetId);
  const pack = modelId ? getPack(modelId) : undefined;

  useEffect(() => {
    if (sheet) document.title = `${sheet.title} — CartScope`;
  }, [sheet]);

  if (!sheet) {
    return (
      <main className="p-8">
        <p>We do not know this picture.</p>
        <Link to="/wiring">All wire maps</Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white text-ink">
      <style>{`@media print { @page { size: letter ${sheet.landscape ? "landscape" : "portrait"}; margin: 0.4in; } }`}</style>
      <div className="no-print flex items-center gap-3 border-b border-line px-4 py-3">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print / save PDF
        </Button>
        <Button variant="ghost" asChild>
          {pack ? (
            <Link to="/wiring/$modelId" params={{ modelId: pack.id }}>
              Back
            </Link>
          ) : (
            <Link to="/wiring">Back</Link>
          )}
        </Button>
        <p className="ml-auto text-sm text-ink-muted">
          {sheet.landscape ? "Print sideways" : "Print upright"} · factory picture
        </p>
      </div>
      <div className="flex flex-1 flex-col p-4 print:p-2">
        <header className="mb-2 print:mb-1">
          <p className="font-mono text-[11px] tracking-wide text-navy">CARTSCOPE · WIRE PICTURE FROM THE BOOK</p>
          <h1 className="font-display text-xl font-semibold leading-tight">{sheet.title}</h1>
          <p className="text-xs text-ink-muted">
            {pack?.fullName ? `${pack.fullName} · ` : ""}
            {sheet.manualRef}
          </p>
        </header>
        <img
          src={sheet.src}
          alt={sheet.title}
          className="wiring-print w-full outline outline-1 -outline-offset-1 outline-line-strong"
        />
      </div>
    </main>
  );
}
