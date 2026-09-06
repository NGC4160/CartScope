import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/case/fields";
import type { DiagnosticStep, JobRecord, ModelPack } from "@/data/types";
import { manualsOnFile, matchObservationToSteps } from "@/lib/manuals";
import { sheetsForPack } from "@/data/wiring";
import { evaluateProof } from "@/lib/proof";
import { runJobAssistant } from "@/lib/run-assistant";
import { useJobStore } from "@/store/jobs";
import { useManualStore } from "@/store/manuals";

export function InFlowGuidance({
  job,
  pack,
  phaseLabel,
}: {
  job: JobRecord;
  pack: ModelPack;
  phaseLabel: string;
}) {
  const appendAiTurn = useJobStore((s) => s.appendAiTurn);
  const jumpToStep = useJobStore((s) => s.jumpToStep);
  const setInclude = useJobStore((s) => s.setIncludeAiInReport);
  const propose = useManualStore((s) => s.propose);
  const setStatus = useManualStore((s) => s.setStatus);
  const allCandidates = useManualStore((s) => s.candidates);
  const candidates = useMemo(
    () => allCandidates.filter((c) => c.packId === pack.id),
    [allCandidates, pack.id],
  );

  const proof = evaluateProof(job, pack);
  const coverage = useMemo(() => manualsOnFile(pack, sheetsForPack(pack.id)), [pack]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<DiagnosticStep[]>([]);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [candTitle, setCandTitle] = useState("");
  const [candNote, setCandNote] = useState("");
  const [candUrl, setCandUrl] = useState("");

  async function sendObservation() {
    const question = draft.trim();
    if (!question || busy) return;
    setBusy(true);
    setError(null);
    setDraft("");
    const localHits = matchObservationToSteps(pack, question, job.currentStepId);
    setSuggested(localHits);
    appendAiTurn(job.id, { role: "user", text: question });
    try {
      const res = await runJobAssistant(
        job,
        "TECH OBSERVATION — use manuals, procedures, wire pictures, and checklists on file first. " +
          "Only then a legitimate OEM or reputable factory source. Not forums. " +
          "If this observation should change the diagnostic path, pick the next factory check. " +
          question,
      );
      if (!res.ok) {
        setError(res.error);
        const fallback = coverage.onFile
          ? "Helper is offline. Use the factory check on this screen and the wire pictures on file."
          : `${coverage.summary} Stay on the meter-evidence path. Do not invent or auto-add a manual.`;
        if (localHits.length === 0) {
          setReply(fallback);
          appendAiTurn(job.id, { role: "assistant", text: fallback });
        }
      } else {
        appendAiTurn(job.id, { role: "assistant", text: res.text });
        setReply(res.text);
        if (res.suggestedStepId && pack.steps[res.suggestedStepId]) {
          setSuggested([pack.steps[res.suggestedStepId]!, ...localHits.filter((s) => s.id !== res.suggestedStepId)]);
        }
      }
    } catch {
      setError("Could not reach the helper. The factory check on this screen still stands.");
    } finally {
      setBusy(false);
    }
  }

  function sourceCandidate() {
    if (candTitle.trim().length < 4) {
      setError("Write the candidate manual title. Do not attach an unverified PDF.");
      return;
    }
    propose({
      packId: pack.id,
      title: candTitle.trim(),
      sourceNote: candNote.trim() || "OEM / reputable source candidate. Not added to the shop library yet.",
      sourceUrl: candUrl.trim() || undefined,
    });
    setCandTitle("");
    setCandNote("");
    setCandUrl("");
    setSourceOpen(false);
    setError(null);
  }

  return (
    <section className="mt-5 rounded-md border border-navy/20 bg-surface-2 p-3">
      <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-navy">ON THIS CHECK</p>
      <p className="mt-1 text-sm font-medium text-ink">{phaseLabel}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{proof.nextHint}</p>
      {proof.conflicts.map((c) => (
        <p key={c} className="mt-2 text-sm text-warn">
          {c}
        </p>
      ))}

      <div className="mt-3 rounded-md bg-paper-sunken px-3 py-2">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
          <BookOpen className="size-3.5" />
          Manuals first
        </p>
        <p className={"mt-1 text-sm leading-relaxed " + (coverage.onFile ? "text-ink" : "text-warn")}>
          {coverage.summary}
        </p>
        {coverage.onFile ? (
          <ul className="mt-2 space-y-1 text-xs text-ink-muted">
            {coverage.items.slice(0, 4).map((item) => (
              <li key={`${item.kind}-${item.title}`}>
                {item.title}
                {item.ref ? ` — ${item.ref}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2">
            <Button variant="secondary" size="sm" onClick={() => setSourceOpen((o) => !o)}>
              Source a candidate manual
            </Button>
            <p className="mt-1 text-xs text-ink-muted">
              A candidate is only a suggestion. It is not added to the shop library until someone approves it. No
              unverified PDF is saved automatically.
            </p>
          </div>
        )}
        {sourceOpen ? (
          <div className="mt-3 space-y-2">
            <Field label="Candidate title">
              <input
                value={candTitle}
                onChange={(e) => setCandTitle(e.target.value)}
                className={inputClass}
                placeholder="OEM service manual title and year"
              />
            </Field>
            <Field label="Where you would get it" hint="OEM site or a licensed shop source. Not a forum thread.">
              <input value={candNote} onChange={(e) => setCandNote(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Link (optional)">
              <input value={candUrl} onChange={(e) => setCandUrl(e.target.value)} className={inputClass} />
            </Field>
            <Button size="sm" onClick={sourceCandidate}>
              Save candidate for approval
            </Button>
          </div>
        ) : null}
        {candidates.length > 0 ? (
          <ul className="mt-2 space-y-2 text-sm">
            {candidates.map((c) => (
              <li key={c.id} className="rounded-md bg-surface px-3 py-2">
                <p className="font-medium text-ink">{c.title}</p>
                <p className="text-xs text-ink-muted">
                  {c.status === "proposed" ? "Waiting for shop approval" : c.status} · {c.sourceNote}
                </p>
                {c.status === "proposed" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setStatus(c.id, "approved")}>
                      Approve for shop library
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(c.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          What you see (changes the next check)
        </span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={inputClass + " mt-1 min-h-20 py-2"}
          placeholder="Customer slang is fine here. Example: solenoid clicks, no roll, tow/run in run…"
          maxLength={800}
          disabled={busy}
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => void sendObservation()} disabled={busy || !draft.trim()}>
          <Send className="size-4" />
          Use this to pick the next check
        </Button>
        <label className="flex min-h-10 items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={job.includeAiInReport !== false}
            onChange={(e) => setInclude(job.id, e.target.checked)}
            className="size-4 accent-navy"
          />
          Put helper notes on the report
        </label>
      </div>
      {busy ? <p className="mt-2 font-mono text-xs text-ink-subtle">Looking in the factory book first…</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {reply ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{reply}</p> : null}
      {suggested.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Go to a different factory check</p>
          <div className="mt-1 grid gap-2">
            {suggested.map((step) => (
              <Button
                key={step.id}
                variant="secondary"
                className="h-auto min-h-11 justify-start whitespace-normal py-2 text-left"
                onClick={() => jumpToStep(job.id, step.id, draft || reply || step.title)}
              >
                <ChevronRight className="size-4 shrink-0" />
                <span>
                  <span className="font-medium">{step.title}</span>
                  <span className="mt-0.5 block text-xs font-normal text-ink-muted">{step.manualRef}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
