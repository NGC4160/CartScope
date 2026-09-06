import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { NewJobWizard } from "@/components/wizard/NewJobWizard";
import { Button } from "@/components/ui/button";
import { getPack, getSymptom, MODEL_PACKS } from "@/data/index";
import { WIRING_SHEETS } from "@/data/wiring";
import { caseTitle, statusLabel } from "@/lib/case-flow";
import { formatTime } from "@/lib/utils";
import { useJobStore, type CreateJobInput } from "@/store/jobs";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const jobs = useJobStore((s) => s.jobs);
  const createJob = useJobStore((s) => s.createJob);
  const [fresh, setFresh] = useState(false);
  const showWizard = jobs.length === 0 || fresh;

  function startJob(input: CreateJobInput) {
    setFresh(true);
    const job = createJob(input);
    void navigate({ to: "/bench/$jobId", params: { jobId: job.id } });
  }

  return (
    <AppShell
      right={
        jobs.length > 0 && !fresh ? (
          <Button size="sm" onClick={() => setFresh(true)}>
            <Plus className="size-4" />
            New job
          </Button>
        ) : null
      }
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        <div className="mb-8">
          <p className="font-mono text-xs font-semibold tracking-[0.18em] text-navy">CART CHECKS</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Find the problem. One step at a time.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
            Pick the cart. Pick what is wrong. Write the customer last name, the Housecall Pro job number, and who
            checked it. Follow
            the factory checks. Save every meter number. The helper will not guess parts until the numbers prove a
            cause.
          </p>
          <p className="mt-3 font-mono text-xs text-ink-subtle">
            {MODEL_PACKS.length} carts · {MODEL_PACKS.filter((p) => p.powertrain === "electric").length} electric ·{" "}
            {MODEL_PACKS.filter((p) => p.powertrain === "gasoline").length} gas · {WIRING_SHEETS.length} wire pictures
          </p>
        </div>

        {showWizard ? (
          <NewJobWizard
            onStartJob={startJob}
            onCancel={jobs.length > 0 ? () => setFresh(false) : undefined}
          />
        ) : (
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Recent cases</h2>
            <ul className="mt-3 grid gap-2">
              {jobs.map((j) => {
                const pack = getPack(j.modelId);
                const symptom = pack ? getSymptom(pack, j.symptomId) : undefined;
                return (
                  <li key={j.id}>
                    <Link
                      to="/bench/$jobId"
                      params={{ jobId: j.id }}
                      className="flex min-h-16 items-center gap-4 rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                    >
                      <FileText className="size-5 shrink-0 text-navy" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{caseTitle(j)}</p>
                        <p className="truncate text-sm text-ink-muted">
                          {pack?.name ?? j.modelId} · {symptom?.label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs tabular-nums text-ink-subtle">{formatTime(j.updatedAt)}</p>
                        <p className="text-xs text-ink-muted">{statusLabel(j)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </AppShell>
  );
}
