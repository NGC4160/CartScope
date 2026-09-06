import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getPack } from "@/data/index";
import { sheetsForPack } from "@/data/wiring";
import { helperManualsNote, snapshotManualStatus } from "@/lib/report-continuity";
import type {
  AiTurn,
  CasePhase,
  CodeSaveRecord,
  JobRecord,
  LogEntry,
  ModelPack,
  PackCheckRecord,
  ReadingAttempt,
  TestBatteryNote,
} from "@/data/types";
import { initialPhase, phaseAfterPack } from "@/lib/case-flow";
import {
  buildAttempt,
  isNumericKind,
  needsUnusualVerify,
  nextAttempt,
  outcomeFor,
  resultFromAttempt,
} from "@/lib/diagnostics";
import { commitMeterReading, meterFieldLabel } from "@/lib/meter-input";
import { uid } from "@/lib/utils";

export interface CreateJobInput {
  modelId: string;
  symptomId: string;
  startStepId: string;
  technician: string;
  serialNumber: string;
  notes: string;
  lastName: string;
  hcpJobNumber: string;
  cartYear: string;
  cartMake: string;
  cartModel: string;
  batteryType?: JobRecord["batteryType"];
  complaintNote: string;
  fuelNote: string;
}

interface JobState {
  jobs: JobRecord[];
  createJob: (input: CreateJobInput) => JobRecord;
  getJob: (id: string) => JobRecord | undefined;
  patchJob: (jobId: string, patch: Partial<JobRecord>) => void;
  setPhase: (jobId: string, phase: CasePhase) => void;
  savePackCheck: (jobId: string, record: PackCheckRecord, testBattery?: TestBatteryNote) => void;
  saveCodeSave: (jobId: string, record: CodeSaveRecord) => void;
  submitReading: (
    jobId: string,
    pack: ModelPack,
    raw: string,
    optionId?: string,
  ) => {
    status: "verify" | "advanced" | "diagnosed" | "invalid";
    job: JobRecord;
    message?: string;
    missingFields?: string[];
  };
  skipToReport: (jobId: string, stepId: string, reason: string) => void;
  skipCheck: (jobId: string, pack: ModelPack, reason: string) => void;
  resetPending: (jobId: string) => void;
  deleteJob: (jobId: string) => void;
  appendAiTurn: (jobId: string, turn: Omit<AiTurn, "at"> & { at?: string }) => void;
  setIncludeAiInReport: (jobId: string, include: boolean) => void;
  confirmReport: (jobId: string) => void;
  jumpToStep: (jobId: string, stepId: string, reason: string) => void;
}

function touch(job: JobRecord, patch: Partial<JobRecord>): JobRecord {
  return { ...job, ...patch, updatedAt: new Date().toISOString() };
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      jobs: [],
      createJob: (input) => {
        const now = new Date().toISOString();
        const pack = getPack(input.modelId);
        const manualStatus = pack
          ? snapshotManualStatus(pack, sheetsForPack(pack.id))
          : undefined;
        const manualsNote = manualStatus ? helperManualsNote(manualStatus) : null;
        const job: JobRecord = {
          id: uid("job"),
          createdAt: now,
          updatedAt: now,
          technician: input.technician.trim(),
          serialNumber: input.serialNumber.trim(),
          notes: input.notes.trim(),
          modelId: input.modelId,
          symptomId: input.symptomId,
          currentStepId: input.startStepId,
          status: "in-progress",
          log: [],
          lastName: input.lastName.trim(),
          hcpJobNumber: input.hcpJobNumber.trim(),
          cartYear: input.cartYear.trim(),
          cartMake: input.cartMake.trim(),
          cartModel: input.cartModel.trim(),
          batteryType: input.batteryType,
          complaintNote: input.complaintNote.trim(),
          fuelNote: input.fuelNote.trim(),
          casePhase: pack ? initialPhase(pack) : "steps",
          manualStatus,
          includeAiInReport: true,
          aiLog: manualsNote ? [{ at: now, role: "assistant", text: manualsNote }] : [],
          techObservation: "",
        };
        set({ jobs: [job, ...get().jobs] });
        return job;
      },
      getJob: (id) => get().jobs.find((j) => j.id === id),
      patchJob: (jobId, patch) => {
        set({
          jobs: get().jobs.map((j) => (j.id === jobId ? touch(j, patch) : j)),
        });
      },
      setPhase: (jobId, phase) => {
        set({
          jobs: get().jobs.map((j) => (j.id === jobId ? touch(j, { casePhase: phase }) : j)),
        });
      },
      savePackCheck: (jobId, record, testBattery) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return;
        const pack = getPack(job.modelId);
        const nextPhase =
          record.verdict === "fail" && !testBattery?.used
            ? "pack"
            : pack
              ? phaseAfterPack(pack)
              : "steps";
        set({
          jobs: get().jobs.map((j) =>
            j.id === jobId
              ? touch(j, {
                  packCheck: record,
                  testBattery: testBattery?.used ? testBattery : j.testBattery,
                  casePhase: nextPhase,
                })
              : j,
          ),
        });
      },
      saveCodeSave: (jobId, record) => {
        set({
          jobs: get().jobs.map((j) =>
            j.id === jobId ? touch(j, { codeSave: record, casePhase: "steps" }) : j,
          ),
        });
      },
      submitReading: (jobId, pack, raw, optionId) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) throw new Error("Job not found");
        const step = pack.steps[job.pending?.stepId ?? job.currentStepId];
        if (!step) throw new Error("Step not found");

        if (isNumericKind(step.measurement.kind)) {
          const commit = commitMeterReading(raw, { kind: step.measurement.kind });
          if (!commit.ok) {
            return {
              status: "invalid" as const,
              job,
              message: commit.message,
              missingFields: commit.missingFields,
            };
          }
          raw = commit.raw;
        } else if (!optionId) {
          return {
            status: "invalid" as const,
            job,
            message: "Tap what you saw. Then we can go on.",
            missingFields: [meterFieldLabel(step.measurement.kind)],
          };
        }

        const prior = job.pending?.stepId === step.id ? job.pending.attempts : [];
        const attempt = buildAttempt(step.measurement, raw, nextAttempt(prior.length), optionId);
        const attempts = [...prior, attempt];

        const unusualGate = needsUnusualVerify(step.measurement, attempt, attempts.length);
        if (unusualGate) {
          const next: JobRecord = touch(job, {
            pending: {
              stepId: step.id,
              attempts,
              required: attempts.length === 1 ? 2 : 3,
            },
          });
          set({ jobs: get().jobs.map((j) => (j.id === jobId ? next : j)) });
          return { status: "verify" as const, job: next };
        }

        const confirmed = attempts[attempts.length - 1]!;
        const { result, branchId } = resultFromAttempt(step.measurement, confirmed);
        const nextOutcome = outcomeFor(step, result, branchId);
        const entry: LogEntry = {
          id: uid("log"),
          stepId: step.id,
          stepTitle: step.title,
          at: confirmed.at,
          kind: step.measurement.kind,
          expectedLabel: step.measurement.expectedLabel,
          unit: step.measurement.unit,
          attempts,
          confirmedRaw: confirmed.raw,
          confirmedNumeric: confirmed.numeric,
          confirmedOptionId: confirmed.optionId,
          result,
          branchId,
          next: nextOutcome,
        };

        let updated: JobRecord;
        if (nextOutcome.kind === "step") {
          updated = touch(job, {
            currentStepId: nextOutcome.id,
            log: [...job.log, entry],
            pending: undefined,
          });
        } else {
          updated = touch(job, {
            status: "diagnosed",
            diagnosisId: nextOutcome.id,
            log: [...job.log, entry],
            pending: undefined,
            casePhase: "report",
          });
        }
        set({ jobs: get().jobs.map((j) => (j.id === jobId ? updated : j)) });
        return {
          status: updated.status === "diagnosed" ? ("diagnosed" as const) : ("advanced" as const),
          job: updated,
        };
      },
      skipCheck: (jobId, pack, reason) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return;
        const step = pack.steps[job.currentStepId];
        if (!step) return;
        const nextOutcome = step.pass;
        const entry: LogEntry = {
          id: uid("log"),
          stepId: step.id,
          stepTitle: step.title,
          at: new Date().toISOString(),
          kind: step.measurement.kind,
          expectedLabel: step.measurement.expectedLabel,
          unit: step.measurement.unit,
          attempts: [],
          confirmedRaw: `Skipped: ${reason}`,
          result: "skip",
          next: nextOutcome,
          skipReason: reason,
        };
        const updated =
          nextOutcome.kind === "step"
            ? touch(job, {
                currentStepId: nextOutcome.id,
                log: [...job.log, entry],
                pending: undefined,
                skipReasons: { ...(job.skipReasons ?? {}), [step.id]: reason },
              })
            : touch(job, {
                status: "diagnosed",
                diagnosisId: nextOutcome.id,
                log: [...job.log, entry],
                pending: undefined,
                casePhase: "report",
                skipReasons: { ...(job.skipReasons ?? {}), [step.id]: reason },
              });
        set({ jobs: get().jobs.map((j) => (j.id === jobId ? updated : j)) });
      },
      skipToReport: (jobId, stepId, reason) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return;
        const pack = getPack(job.modelId);
        const step = pack?.steps[stepId];
        const entry: LogEntry | undefined = step
          ? {
              id: uid("log"),
              stepId,
              stepTitle: step.title,
              at: new Date().toISOString(),
              kind: step.measurement.kind,
              expectedLabel: step.measurement.expectedLabel,
              unit: step.measurement.unit,
              attempts: [],
              confirmedRaw: `Skipped: ${reason}`,
              result: "skip",
              next: { kind: "step", id: job.currentStepId },
              skipReason: reason,
            }
          : undefined;
        set({
          jobs: get().jobs.map((j) =>
            j.id === jobId
              ? touch(j, {
                  casePhase: "report",
                  skipReasons: { ...(j.skipReasons ?? {}), [stepId]: reason },
                  log: entry ? [...j.log, entry] : j.log,
                })
              : j,
          ),
        });
      },
      resetPending: (jobId) => {
        set({
          jobs: get().jobs.map((j) =>
            j.id === jobId ? touch(j, { pending: undefined }) : j,
          ),
        });
      },
      deleteJob: (jobId) => {
        set({ jobs: get().jobs.filter((j) => j.id !== jobId) });
      },
      appendAiTurn: (jobId, turn) => {
        const at = turn.at ?? new Date().toISOString();
        set({
          jobs: get().jobs.map((j) =>
            j.id === jobId
              ? touch(j, {
                  aiLog: [...(j.aiLog ?? []), { at, role: turn.role, text: turn.text }],
                  includeAiInReport: j.includeAiInReport !== false,
                })
              : j,
          ),
        });
      },
      setIncludeAiInReport: (jobId, include) => {
        set({
          jobs: get().jobs.map((j) => (j.id === jobId ? touch(j, { includeAiInReport: include }) : j)),
        });
      },
      confirmReport: (jobId) => {
        set({
          jobs: get().jobs.map((j) =>
            j.id === jobId
              ? touch(j, {
                  reportConfirmed: true,
                  status: "complete",
                  casePhase: "report",
                })
              : j,
          ),
        });
      },
      jumpToStep: (jobId, stepId, reason) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return;
        const pack = getPack(job.modelId);
        if (!pack?.steps[stepId]) return;
        set({
          jobs: get().jobs.map((j) =>
            j.id === jobId
                ? touch(j, {
                  currentStepId: stepId,
                  casePhase: j.casePhase === "report" ? "steps" : j.casePhase,
                  pending: undefined,
                  pathRedirects: [
                    ...(j.pathRedirects ?? []),
                    {
                      at: new Date().toISOString(),
                      fromStepId: j.currentStepId,
                      toStepId: stepId,
                      reason,
                    },
                  ],
                })
              : j,
          ),
        });
      },
    }),
    { name: "cartscope-jobs-v1" },
  ),
);

export function lastAttempts(job: JobRecord): ReadingAttempt[] {
  return job.pending?.attempts ?? [];
}
