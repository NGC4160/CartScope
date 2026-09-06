import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrainStatus } from "@/components/case/BrainStatus";
import { Field, inputClass } from "@/components/case/fields";
import type { JobRecord, ModelPack } from "@/data/types";
import { submitBrainCopy } from "@/lib/brain-submit";
import { plainCaseSummary } from "@/lib/case-summary";
import { formatReading } from "@/lib/diagnostics";
import { formatHandheldRecord } from "@/lib/handheld";
import { PackNaBanner } from "@/components/case/PackNaBanner";
import { formatPackCellLine } from "@/lib/pack-rules";
import { packNaCopy } from "@/lib/pack-na";
import { evaluateProof } from "@/lib/proof";
import { manualsOnFile } from "@/lib/manuals";
import { manualsReportLines, partialReportGaps } from "@/lib/report-continuity";
import { sheetsForPack } from "@/data/wiring";
import { formatTime } from "@/lib/utils";
import { useJobStore } from "@/store/jobs";
import { useManualStore } from "@/store/manuals";

export function CaseReport({
  job,
  pack,
  printMode = false,
}: {
  job: JobRecord;
  pack: ModelPack;
  printMode?: boolean;
}) {
  const proof = evaluateProof(job, pack);
  const confirm = useJobStore((s) => s.confirmReport);
  const patch = useJobStore((s) => s.patchJob);
  const setPhase = useJobStore((s) => s.setPhase);
  const allCandidates = useManualStore((s) => s.candidates);
  const candidates = allCandidates.filter((c) => c.packId === pack.id);
  const coverage = manualsOnFile(pack, sheetsForPack(pack.id));
  const manualLines = manualsReportLines(job.manualStatus, coverage, candidates);
  const partialGaps = partialReportGaps(job, pack);
  const symptom = pack.symptoms.find((s) => s.id === job.symptomId);
  const [copied, setCopied] = useState(false);
  const [retest, setRetest] = useState(job.retestNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [filing, setFiling] = useState(false);

  const summary = plainCaseSummary({ ...job, retestNote: retest }, pack, proof);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the text and copy it yourself.");
    }
  }

  async function fileShopCopy(snapshot: JobRecord) {
    setFiling(true);
    try {
      const record = await submitBrainCopy(snapshot, pack);
      patch(snapshot.id, { brainCopy: record });
    } finally {
      setFiling(false);
    }
  }

  async function onConfirm() {
    if (job.reportConfirmed) return;
    const next = { ...job, retestNote: retest.trim() };
    patch(job.id, { retestNote: next.retestNote });
    confirm(job.id);
    await fileShopCopy({ ...next, reportConfirmed: true, status: "complete" });
  }

  return (
    <div className={"flex h-full min-h-0 flex-col " + (printMode ? "bg-white" : "bg-surface")}>
      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        {!printMode ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button onClick={() => window.print()}>
              <Printer className="size-4" />
              Print / save PDF
            </Button>
            <Button variant="secondary" onClick={() => void copy()}>
              <Copy className="size-4" />
              {copied ? "Copied" : "Copy for Housecall Pro"}
            </Button>
            <Button variant="ghost" onClick={() => setPhase(job.id, "steps")}>
              Back to checks
            </Button>
          </div>
        ) : null}

        <p className="font-mono text-xs tracking-[0.18em] text-navy">WHAT WE FOUND</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{pack.fullName}</h1>
        <p className="text-sm text-ink-muted">{symptom?.label}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Row label="Customer last name" value={job.lastName || "—"} />
          <Row label="Housecall Pro job number" value={job.hcpJobNumber || "—"} />
          <Row label="Year" value={job.cartYear || "—"} />
          <Row label="Make" value={job.cartMake || pack.manufacturerLabel} />
          <Row label="Model" value={job.cartModel || pack.name} />
          <Row label="Serial" value={job.serialNumber || "—"} />
          <Row
            label={pack.powertrain === "electric" ? "Battery type" : "Fuel note"}
            value={
              pack.powertrain === "electric"
                ? job.batteryType === "lead-acid"
                  ? "Lead-acid"
                  : job.batteryType === "lithium"
                    ? "Lithium"
                    : "—"
                : job.fuelNote || "—"
            }
          />
          <Row label="Status" value={job.reportConfirmed ? "Complete" : job.status === "diagnosed" ? "Ready to review" : "Still working"} />
          <Row label="Started" value={formatTime(job.createdAt)} />
          <Row label="Updated" value={formatTime(job.updatedAt)} />
        </dl>
        {job.complaintNote ? (
          <p className="mt-3 text-sm">
            <span className="font-medium">Complaint note: </span>
            {job.complaintNote}
          </p>
        ) : null}

        {partialGaps.length > 0 ? (
          <section className="mt-4 rounded-md bg-warn-bg px-3 py-3 text-sm text-ink">
            <p className="font-medium">Partial report</p>
            <p className="mt-1">Factory or handheld checks were skipped. Cause is not proven from those missing numbers.</p>
            <ul className="mt-2 list-disc pl-5">
              {partialGaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 border border-line p-4">
          <h2 className="font-display text-lg font-semibold">Manuals first</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {manualLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        {packNaCopy(pack) ? (
          <div className="mt-6">
            <PackNaBanner pack={pack} />
          </div>
        ) : job.packCheck ? (
          <section className="mt-6 border border-line p-4">
            <h2 className="font-display text-lg font-semibold">Battery pack</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {job.packCheck.cellCount} × {job.packCheck.nominalV} V · {job.packCheck.chemistry} · {job.packCheck.verdict}
            </p>
            {job.packCheck.chemistry === "lead-acid" ? (
              <ul className="mt-2 grid gap-1 font-mono text-sm">
                {job.packCheck.cells.map((c) => (
                  <li key={c.index}>{formatPackCellLine(c)}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm">
                Monitor {job.packCheck.lithiumMonitorV || "—"} V
                {job.packCheck.lithiumMinCell ? ` · lowest cell ${job.packCheck.lithiumMinCell}` : ""}
              </p>
            )}
            {job.packCheck.irCouldNotMeasure ? (
              <p className="mt-2 text-sm">
                Could not measure internal resistance
                {job.packCheck.irSkipReason ? `: ${job.packCheck.irSkipReason}` : "."}
              </p>
            ) : null}
            {job.packCheck.ageLabelPhotoNote ? (
              <p className="mt-1 text-sm">Date label photo: {job.packCheck.ageLabelPhotoNote}</p>
            ) : null}
            {job.packCheck.issues.map((i) => (
              <p key={i} className="mt-1 text-sm text-ink">{i}</p>
            ))}
            {job.batteryType === "lithium" ? (
              <p className="mt-2 text-sm text-ink-muted">
                A cart that runs is not a finished conversion. This report does not claim UL listing or a ten-year warranty.
              </p>
            ) : null}
          </section>
        ) : null}

        {job.testBattery?.used ? (
          <section className="mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm text-ink">
            Later steps used a known-good test battery. Measured pack problem: {job.testBattery.measuredProblem}
          </section>
        ) : null}

        {job.codeSave ? (
          <section className="mt-4 border border-line p-4">
            <h2 className="font-display text-lg font-semibold">Handheld files and codes</h2>
            {(() => {
              const hh = formatHandheldRecord(job, pack, "device");
              if (!hh) return null;
              return (
                <>
                  {job.codeSave.couldNotConnect ? (
                    <p className="mt-1 text-sm">
                      Could not connect / could not save
                      {job.codeSave.connectReason ? `: ${job.codeSave.connectReason}` : "."}
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 font-mono text-sm">Program file: {hh.program}</p>
                      <p className="font-mono text-sm">Log file: {hh.log}</p>
                      <p className="mt-2 text-sm">Present codes: {hh.present}</p>
                      <p className="text-sm">History codes: {hh.history}</p>
                    </>
                  )}
                  <p className="mt-2 text-sm">Fault counters: {hh.counters}</p>
                  <p className="text-sm">Odometer: {hh.odometer}</p>
                  <p className="text-sm">Fault odometer: {hh.faultOdometer}</p>
                  {job.codeSave.photoNote ? <p className="text-sm">Photo: {job.codeSave.photoNote}</p> : null}
                  <p className="text-sm">Cleared after save: {job.codeSave.cleared ? "yes" : "no"}</p>
                </>
              );
            })()}
          </section>
        ) : null}

        {job.pathRedirects?.length ? (
          <section className="mt-6 border border-line p-4">
            <h2 className="font-display text-lg font-semibold">Path changes from what the tech saw</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {job.pathRedirects.map((r, i) => (
                <li key={`${r.at}-${i}`}>
                  {r.fromStepId} → {r.toStepId}
                  {r.reason ? ` — ${r.reason}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <h2 className="mt-6 font-display text-lg font-semibold">Checks</h2>
        <table className="mt-2 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink">
              <th className="py-1 pr-2 font-medium">#</th>
              <th className="py-1 pr-2 font-medium">Check</th>
              <th className="py-1 pr-2 font-medium">Look for</th>
              <th className="py-1 pr-2 font-medium">Got</th>
              <th className="py-1 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {job.log.map((e, i) => (
              <tr key={e.id} className="border-b border-line align-top">
                <td className="py-2 pr-2 font-mono text-xs">{i + 1}</td>
                <td className="py-2 pr-2">
                  <p>{e.stepTitle}</p>
                  {e.skipReason ? <p className="text-xs text-ink-muted">Skip: {e.skipReason}</p> : null}
                </td>
                <td className="py-2 pr-2 font-mono text-xs">{e.expectedLabel}</td>
                <td className="py-2 pr-2 font-mono text-xs">{formatReading(e.confirmedRaw, e.unit)}</td>
                <td className="py-2 font-mono text-xs">
                  {e.result === "pass" ? "looks OK" : e.result === "fail" ? "looks wrong" : e.result === "skip" ? "skipped" : e.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {job.log.length === 0 ? <p className="mt-2 text-sm text-ink-muted">No factory checks saved yet.</p> : null}

        <section className="mt-6 border border-line p-4">
          <h2 className="font-display text-lg font-semibold">Cause and repair</h2>
          <p className="mt-2 text-sm">
            <span className="font-medium">Proven cause: </span>
            {proof.provenCause ?? "Not proven yet"}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-medium">Recommended repair: </span>
            {proof.recommendedRepair ?? "Not enough proof to recommend a repair yet."}
          </p>
          {proof.mayShowParts && pack.diagnoses[job.diagnosisId ?? ""]?.parts.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm">
              {pack.diagnoses[job.diagnosisId!].parts.map((p) => (
                <li key={p.name}>
                  {p.name}
                  {p.notes ? ` — ${p.notes}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {proof.conflicts.map((c) => (
            <p key={c} className="mt-2 text-sm text-warn">{c}</p>
          ))}
        </section>

        {!printMode ? (
          <div className="mt-4">
            <Field label="Re-test after repair (optional)">
              <textarea
                value={retest}
                onChange={(e) => setRetest(e.target.value)}
                className={inputClass + " min-h-20 py-2"}
                disabled={job.reportConfirmed}
              />
            </Field>
          </div>
        ) : job.retestNote ? (
          <p className="mt-4 text-sm">
            <span className="font-medium">Re-test after repair: </span>
            {job.retestNote}
          </p>
        ) : null}

        {job.techObservation?.trim() ? (
          <section className="mt-6 border border-line p-4">
            <h2 className="font-display text-lg font-semibold">What the tech saw</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{job.techObservation.trim()}</p>
          </section>
        ) : null}

        {job.includeAiInReport !== false && job.aiLog && job.aiLog.length > 0 ? (
          <section className="mt-6">
            <h2 className="font-display text-lg font-semibold">Helper notes</h2>
            {job.aiLog.map((t, i) => (
              <p key={`${t.at}-${i}`} className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                <span className="font-medium">{t.role === "user" ? "Who checked it: " : "Helper: "}</span>
                {t.text}
              </p>
            ))}
          </section>
        ) : null}

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        {!printMode ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {job.reportConfirmed ? (
              <p className="flex items-center gap-2 text-sm text-ok">
                <Check className="size-4" />
                This case is marked complete.
              </p>
            ) : (
              <Button onClick={() => void onConfirm()} className="min-w-52" disabled={filing}>
                Review and confirm
              </Button>
            )}
            <Button variant="ghost" asChild>
              <Link to="/print/report/$jobId" params={{ jobId: job.id }}>
                Print-friendly view
              </Link>
            </Button>
          </div>
        ) : null}

        {!printMode && (job.reportConfirmed || job.brainCopy) ? (
          <BrainStatus
            copy={job.brainCopy}
            busy={filing}
            onRetry={() => void fileShopCopy({ ...job, retestNote: retest.trim() })}
          />
        ) : null}

        <p className="mt-8 text-[11px] text-ink-subtle">
          These numbers follow the factory check list for this cart, plus the shop pack and code rules. The full case
          stays on this tablet. A shop brain copy with no last name and no job number is made when you confirm.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
