import { createFileRoute, Link } from "@tanstack/react-router";
import { Cable } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { MANUFACTURERS, MODEL_PACKS, packsFor } from "@/data/index";
import { sheetsForPack } from "@/data/wiring";

export const Route = createFileRoute("/wiring/")({ component: WiringLibrary });

function WiringLibrary() {
  return (
    <AppShell
      right={
        <Button variant="secondary" size="sm" asChild>
          <Link to="/">Back</Link>
        </Button>
      }
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="font-mono text-xs font-semibold tracking-[0.18em] text-navy">WIRE PICTURES FROM THE BOOK</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">Wire maps</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          These are the real wire pictures from the factory books. Pick the cart. Pinch to zoom. Print a copy for the
          stall.
        </p>

        <div className="mt-8 grid gap-8">
          {MANUFACTURERS.map((m) => (
            <section key={m.id}>
              <h2 className="font-display text-xl font-semibold text-ink">{m.label}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {packsFor(m.id).map((p) => {
                  const n = sheetsForPack(p.id).length;
                  return (
                    <Link
                      key={p.id}
                      to="/wiring/$modelId"
                      params={{ modelId: p.id }}
                      className="flex min-h-24 items-start gap-3 rounded-lg bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
                    >
                      <Cable className="mt-0.5 size-5 shrink-0 text-navy" />
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-ink">{p.name}</p>
                        <p className="text-sm text-ink-muted">{p.fullName}</p>
                        <p className="mt-1 font-mono text-[11px] text-ink-subtle">
                          {n} wire picture{n === 1 ? "" : "s"} · {p.years}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs text-ink-subtle">
          {MODEL_PACKS.length} carts · each picture shows the book figure or section
        </p>
      </main>
    </AppShell>
  );
}
