import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Cable, FileDown, Plus } from "lucide-react";
import { useState } from "react";
import { AssistantDock } from "@/components/assistant/AssistantDock";
import { ComponentDetail } from "@/components/bench/ComponentDetail";
import { StepPanel } from "@/components/bench/StepPanel";
import { CaseHelper } from "@/components/case/CaseHelper";
import { CaseReport } from "@/components/case/CaseReport";
import { CodeGate } from "@/components/case/CodeGate";
import { PackGate } from "@/components/case/PackGate";
import { findComponent, SystemDiagram } from "@/components/diagram/SystemDiagram";
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
  const setPhase = useJobStore((s) => s.setPhase);
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const pack = job ? getPack(job.modelId) : undefined;
  const step = pack && job ? pack.steps[job.currentStepId] : undefined;
  const highlight = step?.highlight ?? [];
  const phase = job?.casePhase ?? "steps";

  if (!hydrated) {
    return (
      <AppShell>
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
  const selectedComp = findComponent(pack, selected);

  const checkPanel =
    phase === "pack" ? (
      <PackGate job={job} pack={pack} />
    ) : phase === "codes" ? (
      <CodeGate job={job} pack={pack} />
    ) : (
      <StepPanel job={job} pack={pack} />
    );

  return (
    <AppShell
      right={
        <>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/wiring/$modelId" params={{ modelId: pack.id }}>
              <Cable className="size-4" />
              <span className="hidden sm:inline">Wire pictures</span>
            </Link>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPhase(job.id, "report")}>
            <FileDown className="size-4" />
            <span className="hidden sm:inline">Report</span>
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

        {phase === "report" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <CaseReport job={job} pack={pack} />
            <CaseHelper job={job} pack={pack} />
            <AssistantDock modelId={pack.id} job={job} />
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="relative h-[32vh] min-h-44 shrink-0 border-b border-line bg-surface lg:h-auto lg:min-h-0 lg:flex-1 lg:border-b-0">
                <div className="flex h-full items-center justify-center p-2 lg:p-3">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]">
                    <SystemDiagram
                      pack={pack}
                      highlight={highlight}
                      selectedId={selected}
                      onSelect={setSelected}
                    />
                  </div>
                </div>
                {selectedComp ? (
                  <div className="absolute bottom-2 left-2 right-2 z-10 max-h-[48%] lg:bottom-4 lg:left-4 lg:right-4">
                    <ComponentDetail component={selectedComp} onClose={() => setSelected(null)} />
                  </div>
                ) : (
                  <p className="hidden px-4 pb-2 text-xs text-ink-subtle lg:block">
                    Tap a part to read what it does. Yellow parts are for this step.
                  </p>
                )}
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col border-line bg-surface lg:max-w-[42%] lg:border-l">
                {checkPanel}
              </div>
            </div>
            <CaseHelper job={job} pack={pack} />
            <AssistantDock modelId={pack.id} job={job} />
          </>
        )}
      </div>
    </AppShell>
  );
}
