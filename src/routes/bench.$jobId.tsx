import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Cable, Plus } from "lucide-react";
import { BayWorkspace } from "@/components/bay/BayWorkspace";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { getPack, getSymptom } from "@/data/index";
import { useHydrated } from "@/hooks/use-hydrated";
import { caseTitle } from "@/lib/case-flow";
import { useJobStore } from "@/store/jobs";

export const Route = createFileRoute("/bench/$jobId")({ component: Bench });

function Bench() {
  const { jobId } = Route.useParams();
  const hydrated = useHydrated();
  const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
  const navigate = useNavigate();

  const pack = job ? getPack(job.modelId) : undefined;

  if (!hydrated) {
    return (
      <AppShell lockViewport>
        <p className="p-8 text-sm text-ink-muted">Loading this job…</p>
      </AppShell>
    );
  }

  if (!job || !pack) {
    return (
      <AppShell>
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold">This job is not on this tablet</h1>
          <p className="mt-2 text-sm text-ink-muted">Jobs stay on this tablet only.</p>
          <Button className="mt-6" onClick={() => void navigate({ to: "/" })}>
            New job
          </Button>
        </main>
      </AppShell>
    );
  }

  const symptom = getSymptom(pack, job.symptomId);

  return (
    <AppShell
      lockViewport
      right={
        <>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/wiring/$modelId" params={{ modelId: pack.id }}>
              <Cable className="size-4" />
              <span className="hidden sm:inline">Wire library</span>
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/">
              <Plus className="size-4" />
              <span className="hidden sm:inline">New job</span>
            </Link>
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="no-print flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line bg-surface-2 px-4 py-2 text-sm">
          <span className="font-medium text-ink">{caseTitle(job)}</span>
          <span className="text-ink-subtle">·</span>
          <span className="text-ink-muted">{pack.name}</span>
          <span className="text-ink-subtle">·</span>
          <span className="text-ink-muted">{symptom?.label}</span>
          {pack.powertrain === "gasoline" ? (
            <>
              <span className="text-ink-subtle">·</span>
              <span className="text-ink-muted">Battery pack not applicable</span>
            </>
          ) : job.batteryType ? (
            <>
              <span className="text-ink-subtle">·</span>
              <span className="text-ink-muted">{job.batteryType === "lead-acid" ? "Lead-acid" : "Lithium"}</span>
            </>
          ) : null}
          {job.serialNumber ? (
            <>
              <span className="text-ink-subtle">·</span>
              <span className="font-mono text-xs text-ink-muted"># {job.serialNumber}</span>
            </>
          ) : null}
        </div>
        <BayWorkspace job={job} pack={pack} />
      </div>
    </AppShell>
  );
}
