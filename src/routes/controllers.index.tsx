import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ControllerLookup, ControllerStampList } from "@/components/cart/ControllerLookup";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CONTROLLER_DOCS } from "@/data/controllers";
import type { ControllerResolveResult } from "@/lib/controller-resolve";

export const Route = createFileRoute("/controllers/")({ component: ControllersLibrary });

function ControllersLibrary() {
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState<ControllerResolveResult | null>(null);

  return (
    <AppShell
      right={
        <Button variant="secondary" size="sm" asChild>
          <Link to="/">Back</Link>
        </Button>
      }
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="font-mono text-xs font-semibold tracking-[0.18em] text-navy">CONTROLLER BOOKS FROM DRIVE</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">Controllers</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          Type the model stamped on the box. We open that controller’s books. Cart year, make, and model still opens
          the vehicle book — these PDFs are not dumped onto a random cart.
        </p>

        <div className="mt-6 rounded-lg bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
          <ControllerLookup query={query} result={lookup} onQuery={setQuery} onResult={setLookup} />
        </div>

        <details className="mt-8">
          <summary className="cursor-pointer font-display text-lg font-semibold text-ink">All stamps on file</summary>
          <div className="mt-4">
            <ControllerStampList />
          </div>
        </details>
        <p className="mt-8 font-mono text-xs text-ink-subtle">
          {CONTROLLER_DOCS.length} Drive books · tagged by controller model · Navitas / 1313 / 1268 kits left out
        </p>
      </main>
    </AppShell>
  );
}
