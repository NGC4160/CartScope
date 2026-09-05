import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Cable,
  Check,
  ChevronRight,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import type { JobRecord, ModelPack } from "@/data/types";
import { termHints, unitHelp } from "@/data/plain-terms";
import { Button } from "@/components/ui/button";
import { isMotorIsolationStep } from "@/lib/case-flow";
import { formatClock } from "@/lib/utils";
import { formatReading, rangeLabel } from "@/lib/diagnostics";
import { evaluateProof } from "@/lib/proof";
import { useJobStore } from "@/store/jobs";

function formatReadingSafe(raw: string, unit?: string): string {
  if (!unit) return raw;
  if (/[a-zΩµ]/i.test(raw)) return raw;
  return `${raw} ${unit}`;
}

export function StepPanel({ job, pack }: { job: JobRecord; pack: ModelPack }) {
  const submit = useJobStore((s) => s.submitReading);
  const resetPending = useJobStore((s) => s.resetPending);
  const skipToReport = useJobStore((s) => s.skipToReport);
  const skipCheck = useJobStore((s) => s.skipCheck);
  const patchJob = useJobStore((s) => s.patchJob);
  const setPhase = useJobStore((s) => s.setPhase);
  const step = pack.steps[job.currentStepId];
  const diagnosis = job.diagnosisId ? pack.diagnoses[job.diagnosisId] : undefined;
  const symptom = pack.symptoms.find((s) => s.id === job.symptomId);
  const pending = job.pending;
  const spec = step?.measurement;
  const proof = evaluateProof(job, pack);
  const [raw, setRaw] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [showSkip, setShowSkip] = useState(false);

  const attemptCount = pending?.attempts.length ?? 0;
  const verifyPhase = pending ? attemptCount : 0;

  const numeric = spec && (spec.kind === "voltage" || spec.kind === "resistance");
  const help = spec ? unitHelp(spec.kind, spec.unit) : null;
  const hints = useMemo(() => {
    if (!step || !spec) return [];
    return termHints(`${step.title} ${step.instruction} ${spec.meterSetup} ${spec.prompt}`);
  }, [step, spec]);

  const progress = useMemo(() => {
    const total = Object.keys(pack.steps).length;
    return Math.min(100, Math.round(((job.log.length + (diagnosis ? 1 : 0)) / Math.max(total, 1)) * 100));
  }, [job.log.length, diagnosis, pack.steps]);

  const motorStep = step ? isMotorIsolationStep(step) : false;
  const motorReady = Boolean(job.motorUnlock?.commandedNoMove && job.motorUnlock?.controllerUnplugged);

  function onSubmit() {
    if (!step || !spec) return;
    setError(null);
    if (motorStep && !motorReady) {
      setError("Unlock this motor check first. The speed box must be unplugged from the motor.");
      return;
    }
    if (numeric) {
      if (!raw.trim()) {
        setError("Type the number from your meter. Then we can go on.");
        return;
      }
    } else if (!selected) {
      setError("Tap what you saw. Then we can go on.");
      return;
    }
    submit(job.id, pack, numeric ? raw.trim() : selected ?? raw, selected ?? undefined);
    setRaw("");
    setSelected(null);
  }

  if (diagnosis && (job.casePhase === "report" || job.status === "diagnosed" || job.status === "complete")) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <Header symptom={symptom?.label} progress={100} done />
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <p className="font-mono text-xs font-semibold tracking-wide text-navy">CHECKS FINISHED</p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink">{diagnosis.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{diagnosis.summary}</p>
          <Block title="Most likely why" body={diagnosis.likelyCause} />
          <Block
            title="Recommended repair"
            body={proof.recommendedRepair ?? "Not enough proof to recommend a repair yet."}
          />
          {proof.mayShowParts && diagnosis.parts.length > 0 ? (
            <div className="mt-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink">Parts with proof</h3>
              <ul className="mt-2 space-y-2">
                {diagnosis.parts.map((p) => (
                  <li key={p.name} className="rounded-md bg-paper-sunken px-3 py-2">
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    {p.notes ? <p className="text-xs text-ink-muted">{p.notes}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">No parts list yet. The helper will not guess parts before proof.</p>
          )}
          {proof.conflicts.map((c) => (
            <p key={c} className="mt-2 text-sm text-warn">{c}</p>
          ))}
          <Button className="mt-5" onClick={() => setPhase(job.id, "report")}>
            Review the report
            <ChevronRight className="size-4" />
          </Button>
          <LogList job={job} />
        </div>
      </div>
    );
  }

  if (!step || !spec) {
    return <p className="p-4 text-sm text-ink-muted">This step is missing. Start a new job.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header symptom={symptom?.label} progress={progress} />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="font-mono text-xs font-semibold tracking-wide text-navy">
          CHECK {job.log.length + 1}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink">{step.title}</h2>
        <p className="mt-1 text-xs text-ink-subtle">{step.manualRef}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink">{step.instruction}</p>
        {hints.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-md bg-ok-bg px-3 py-2 text-xs leading-relaxed text-ink">
            {hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}
        {step.caution ? (
          <div className="mt-3 flex gap-2 rounded-md bg-warn-bg px-3 py-2 text-sm text-warn">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{step.caution}</p>
          </div>
        ) : null}

        <Button variant="secondary" size="sm" className="mt-3" asChild>
          <Link to="/wiring/$modelId" params={{ modelId: pack.id }}>
            <Cable className="size-4" />
            Open wire picture
          </Link>
        </Button>

        {motorStep ? (
          <div className="mt-4 rounded-md bg-warn-bg px-3 py-3 text-sm text-ink">
            <p className="font-medium text-warn">Motor electrical test lock</p>
            <p className="mt-1">
              Never megger or take milli-ohm readings with the speed box (controller) still connected. Unlock only if
              the drive was commanded and the cart still will not move.
            </p>
            <label className="mt-2 flex min-h-10 items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-navy"
                checked={Boolean(job.motorUnlock?.commandedNoMove)}
                onChange={(e) =>
                  patchJob(job.id, {
                    motorUnlock: {
                      commandedNoMove: e.target.checked,
                      controllerUnplugged: Boolean(job.motorUnlock?.controllerUnplugged),
                    },
                  })
                }
              />
              The contactor closed, the speed box asked the motor to run, and the cart still did not move.
            </label>
            <label className="mt-2 flex min-h-10 items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-navy"
                checked={Boolean(job.motorUnlock?.controllerUnplugged)}
                onChange={(e) =>
                  patchJob(job.id, {
                    motorUnlock: {
                      commandedNoMove: Boolean(job.motorUnlock?.commandedNoMove),
                      controllerUnplugged: e.target.checked,
                    },
                  })
                }
              />
              The speed box is unplugged from the motor.
            </label>
          </div>
        ) : null}

        <div className={"mt-4 " + (motorStep && !motorReady ? "pointer-events-none opacity-40" : "")}>
          <div className="rounded-md bg-paper-sunken px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Set your meter like this</p>
            <p className="mt-1 text-sm text-ink">{spec.meterSetup}</p>
            <p className="mt-2 font-mono text-sm tabular-nums text-navy">
              Look for: {rangeLabel(spec)}
            </p>
            {help ? <p className="mt-2 text-xs leading-relaxed text-ink-muted">{help}</p> : null}
          </div>

          {verifyPhase > 0 ? (
            <div className="mt-4 rounded-md bg-warn-bg px-3 py-3 text-warn">
              <p className="flex items-center gap-2 font-display text-sm font-semibold">
                <AlertTriangle className="size-4" />
                {verifyPhase === 1
                  ? "That number looks wrong. Check it two more times."
                  : "Check it one more time."}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink">
                {verifyPhase === 1
                  ? "The first number is not in the factory book range. Measure the same place again."
                  : "Type a third number. We save all three on the report before we go on."}
              </p>
              <ol className="mt-2 space-y-1 font-mono text-xs tabular-nums text-ink">
                {pending?.attempts.map((a) => (
                  <li key={a.attempt}>
                    #{a.attempt} {formatClock(a.at)} — {formatReadingSafe(a.raw, spec.unit)}
                    {a.unusual ? " · looks wrong" : " · looks OK"}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {numeric ? (
            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                {verifyPhase === 0 ? "Your number" : verifyPhase === 1 ? "Second number" : "Third number"}
                {spec.unit ? ` (${spec.unit})` : ""}
              </span>
              <div className="mt-1 flex gap-2">
                <input
                  inputMode="decimal"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={spec.placeholder ?? "Type the number"}
                  className="min-h-14 flex-1 rounded-md bg-surface px-3 font-mono text-xl tabular-nums text-ink shadow-[var(--shadow-border)] outline-none placeholder:text-ink-subtle"
                />
                {spec.kind === "resistance" ? (
                  <Button type="button" variant="secondary" onClick={() => setRaw("OL")} className="min-w-16">
                    OL
                  </Button>
                ) : null}
              </div>
            </label>
          ) : (
            <div className="mt-4 grid gap-2">
              {spec.options?.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className={
                    "min-h-14 rounded-md px-4 text-left text-sm font-medium shadow-[var(--shadow-border)] transition-[background-color,box-shadow] duration-150 " +
                    (selected === opt.id
                      ? "bg-navy text-navy-fg"
                      : "bg-surface text-ink hover:shadow-[var(--shadow-border-hover)]")
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onSubmit} className="min-w-40 flex-1" disabled={motorStep && !motorReady}>
            {verifyPhase === 0 ? "Save and go on" : verifyPhase === 1 ? "Save second check" : "Save third check"}
            <ChevronRight className="size-4" />
          </Button>
          {pending ? (
            <Button variant="ghost" onClick={() => resetPending(job.id)} title="Throw away extra checks">
              <RotateCcw className="size-4" />
              Start this check over
            </Button>
          ) : null}
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="text-sm text-ink-muted underline"
            onClick={() => setShowSkip((s) => !s)}
          >
            Skip this check with a written reason
          </button>
          {showSkip ? (
            <div className="mt-2">
              <textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="min-h-20 w-full rounded-md bg-surface px-3 py-2 text-sm text-ink shadow-[var(--shadow-border)]"
                placeholder="Write why you cannot finish this check."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={skipReason.trim().length < 8}
                  onClick={() => {
                    skipCheck(job.id, pack, skipReason.trim());
                    setSkipReason("");
                    setShowSkip(false);
                    setRaw("");
                    setSelected(null);
                  }}
                >
                  Skip and keep going
                </Button>
                <Button
                  variant="ghost"
                  disabled={skipReason.trim().length < 8}
                  onClick={() => skipToReport(job.id, step.id, skipReason.trim())}
                >
                  Skip remaining and open the report
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <LogList job={job} />
      </div>
    </div>
  );
}

function Header({
  symptom,
  progress,
  done,
}: {
  symptom?: string;
  progress: number;
  done?: boolean;
}) {
  return (
    <div className="shrink-0 border-b border-line px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-ink">{symptom ?? "Checks"}</p>
        <p className="flex items-center gap-1 font-mono text-xs tabular-nums text-ink-subtle">
          {done ? <Check className="size-3.5 text-ok" /> : <ClipboardList className="size-3.5" />}
          {done ? "Done" : `${progress}%`}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-sunken">
        <div
          className="h-full rounded-full bg-navy transition-[width] duration-250 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

function LogList({ job }: { job: JobRecord }) {
  if (job.log.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink">Numbers you saved</h3>
      <ol className="mt-2 space-y-2">
        {job.log.map((e, i) => (
          <li key={e.id} className="rounded-md bg-surface-2 px-3 py-2">
            <p className="text-sm font-medium text-ink">
              {i + 1}. {e.stepTitle}
            </p>
            <p className="font-mono text-xs tabular-nums text-ink-muted">
              {formatClock(e.at)} · {formatReading(e.confirmedRaw, e.unit)} · {plainResult(e.result)}
              {e.attempts.length > 1 ? ` · ${e.attempts.length} checks` : ""}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function plainResult(result: string): string {
  if (result === "pass") return "looks OK";
  if (result === "fail") return "looks wrong";
  if (result === "skip") return "skipped";
  return result;
}
