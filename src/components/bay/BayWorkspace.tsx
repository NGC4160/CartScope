import { useEffect, useMemo, useRef, useState } from "react";
import { BayActionBar, useBayChrome } from "@/components/bay/BayActionBar";
import { BAY_CHECK_FORM_ID, BAY_REPORT_FORM_ID, createBaySubmitSlot } from "@/lib/bay-chrome-action";
import { BayDock } from "@/components/bay/BayDock";
import { BayHelperSheet } from "@/components/bay/BayHelperSheet";
import { DiagramPane } from "@/components/bay/DiagramPane";
import { CaseReport } from "@/components/case/CaseReport";
import { CodeGate } from "@/components/case/CodeGate";
import { PackGate } from "@/components/case/PackGate";
import { StepPanel } from "@/components/bench/StepPanel";
import { Button } from "@/components/ui/button";
import type { JobRecord, ModelPack } from "@/data/types";
import { getSymptom } from "@/data/index";
import {
  BAY_SPLIT_MIN_PX,
  BAY_TAP_MIN_PX,
  bayHasDiagram,
  bayProgressChip,
  defaultBayPane,
  type BayPane,
} from "@/lib/bay-chrome";
import { bayChecksPaneProps, bayChecksWorkspaceMounted } from "@/lib/bay-layer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useJobStore } from "@/store/jobs";

export function BayWorkspace({ job, pack }: { job: JobRecord; pack: ModelPack }) {
  const setPhase = useJobStore((s) => s.setPhase);
  const [pane, setPane] = useState<BayPane>(() => defaultBayPane(job));
  const [checkChrome, setCheckChrome] = useBayChrome();
  const [reportChrome, setReportChrome] = useBayChrome();
  const checkSlot = useRef(createBaySubmitSlot()).current;
  const reportSlot = useRef(createBaySubmitSlot()).current;
  const split = useMediaQuery(`(min-width: ${BAY_SPLIT_MIN_PX}px)`);
  const phase = job.casePhase ?? "steps";
  const step = pack.steps[job.currentStepId];
  const highlight = step?.highlight ?? [];
  const hasDiagram = bayHasDiagram(pack);
  const symptom = getSymptom(pack, job.symptomId);

  const helperLabel = useMemo(() => {
    if (phase === "pack") return "Pack check";
    if (phase === "codes") return "Handheld Program and Log";
    return step?.title ?? symptom?.label ?? "This check";
  }, [phase, step?.title, symptom?.label]);

  useEffect(() => {
    if (job.casePhase === "report") setPane("report");
  }, [job.casePhase]);

  function goPane(next: BayPane) {
    if (next === "diagram" && !hasDiagram) return;
    setPane(next);
  }

  function backToChecks() {
    setPane("checks");
    if (job.casePhase === "report" && !job.reportConfirmed) {
      setPhase(job.id, "steps");
    }
  }

  const showSplitDiagram = split && pane !== "report" && hasDiagram;
  const showOverlayDiagram = !split && pane === "diagram" && hasDiagram;
  const showHelper = pane === "helper";
  const showReport = pane === "report";
  const mountChecks = bayChecksWorkspaceMounted(showReport);

  const checkPanel =
    phase === "pack" ? (
      <PackGate job={job} pack={pack} onChrome={setCheckChrome} bindSubmit={checkSlot.bind} />
    ) : phase === "codes" ? (
      <CodeGate job={job} pack={pack} onChrome={setCheckChrome} bindSubmit={checkSlot.bind} />
    ) : (
      <StepPanel
        job={job}
        pack={pack}
        onChrome={setCheckChrome}
        bindSubmit={checkSlot.bind}
        onOpenDiagram={() => goPane("diagram")}
        onOpenReport={() => {
          setPhase(job.id, "report");
          setPane("report");
        }}
      />
    );

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-bay-report-open={showReport ? "" : undefined}
    >
      <BayDock
        value={pane}
        onChange={goPane}
        diagramDisabled={!hasDiagram}
        hideChecks={showReport}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {mountChecks ? (
          <div {...bayChecksPaneProps(false)}>
            {showSplitDiagram ? (
              <div className="relative min-h-0 min-w-0 flex-[1.25] border-r border-line">
                <DiagramPane pack={pack} highlight={highlight} jobId={job.id} />
              </div>
            ) : null}

            <div
              className={
                "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden " +
                (showSplitDiagram ? "min-w-[22rem] max-w-[42%]" : "")
              }
            >
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div className="absolute inset-0">{checkPanel}</div>
              </div>
              {job.techObservation?.trim() && !showHelper ? (
                <button
                  type="button"
                  className="no-print truncate border-t border-line bg-surface-2 px-3 py-2 text-left text-xs text-ink"
                  style={{ minHeight: BAY_TAP_MIN_PX }}
                  onClick={() => setPane("helper")}
                >
                  <span className="font-medium">What the tech saw: </span>
                  {job.techObservation.trim()}
                </button>
              ) : null}
              <div
                className={showHelper ? "pointer-events-none" : "relative z-30 shrink-0 overflow-visible"}
                aria-hidden={showHelper || undefined}
              >
                <BayActionBar
                  chrome={checkChrome}
                  formId={BAY_CHECK_FORM_ID}
                  fire={checkSlot.outcome}
                  armed={!showHelper}
                />
              </div>
              {showHelper ? (
                <BayHelperSheet
                  job={job}
                  pack={pack}
                  phaseLabel={helperLabel}
                  onClose={() => setPane("checks")}
                  onGoPane={goPane}
                  hasDiagram={hasDiagram}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div {...bayChecksPaneProps(true)} />
        )}

        {showReport ? (
          <div className="flex min-h-0 flex-1 flex-col" data-testid="bay-report-pane" data-bay-report-pane="">
            <p className="no-print border-b border-line bg-paper-sunken px-4 py-2 text-sm text-ink">
              {job.status === "diagnosed" || job.reportConfirmed
                ? "Report draft — confirm when the case is ready."
                : "Report peek — numbers on this job stay put. Go back to the same check."}
            </p>
            <div className="min-h-0 flex-1 flex-col flex">
              <CaseReport
                job={job}
                pack={pack}
                peek
                onBackToChecks={backToChecks}
                onChrome={setReportChrome}
                bindSubmit={reportSlot.bind}
              />
            </div>
            <BayActionBar
              chrome={
                reportChrome ?? {
                  chip: bayProgressChip(job, pack),
                  label: "Back to checks",
                  onAction: backToChecks,
                }
              }
              formId={BAY_REPORT_FORM_ID}
              fire={reportSlot.outcome}
            />
          </div>
        ) : null}

        {showOverlayDiagram ? (
          <div
            className="absolute inset-0 z-50 flex flex-col bg-paper"
            role="dialog"
            aria-label="Wire picture"
            data-testid="bay-diagram-overlay"
          >
            <div className="min-h-0 flex-1">
              <DiagramPane pack={pack} highlight={highlight} jobId={job.id} />
            </div>
            <div className="no-print shrink-0 border-t border-navy-deep bg-surface px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
              <Button
                className="w-full min-h-14 text-base"
                style={{ minHeight: Math.max(BAY_TAP_MIN_PX, 56) }}
                onClick={() => setPane("checks")}
              >
                Done — same check
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
