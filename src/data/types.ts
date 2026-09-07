export type ManufacturerId = "club-car" | "ezgo" | "yamaha";
export type WireKind = "power" | "control" | "ground";
export type Side = "n" | "e" | "s" | "w";
export type MeasurementKind = "voltage" | "resistance" | "continuity" | "observation";
export type JobStatus = "in-progress" | "diagnosed" | "complete";
export type Attempt = 1 | 2 | 3;
export type Powertrain = "electric" | "gasoline";
export type BatteryType = "lead-acid" | "lithium";
export type CasePhase = "pack" | "codes" | "steps" | "report";
export type CaseVerdict = "pass" | "fail" | "skip" | "na";

export interface TerminalDef {
  id: string;
  label: string;
  side: Side;
  t: number;
}

export interface TestPointDef {
  id: string;
  label: string;
  x: number;
  y: number;
  componentId: string;
  expected: string;
}

export interface ExpectedValue {
  label: string;
  value: string;
}

export interface ComponentDef {
  id: string;
  ref: string;
  name: string;
  kind:
    | "battery"
    | "switch"
    | "solenoid"
    | "controller"
    | "motor"
    | "sensor"
    | "charger"
    | "computer"
    | "fuse"
    | "receptacle"
    | "buzzer"
    | "brake"
    | "engine"
    | "ignition"
    | "other";
  description: string;
  commonFailures: string[];
  expectedValues: ExpectedValue[];
  x: number;
  y: number;
  w: number;
  h: number;
  terminals: TerminalDef[];
}

export interface WireDef {
  id: string;
  kind: WireKind;
  from: string;
  to: string;
  label?: string;
  waypoints?: { x: number; y: number }[];
}

export interface ChoiceOption {
  id: string;
  label: string;
  result: "pass" | "fail" | "branch";
  branchId?: string;
  unusual?: boolean;
}

export interface MeasurementSpec {
  kind: MeasurementKind;
  prompt: string;
  meterSetup: string;
  unit?: string;
  expectedLabel: string;
  expectedMin?: number;
  expectedMax?: number;
  openIsFail?: boolean;
  options?: ChoiceOption[];
  placeholder?: string;
}

export type Outcome = { kind: "step"; id: string } | { kind: "diagnosis"; id: string };

export interface DiagnosticStep {
  id: string;
  title: string;
  instruction: string;
  caution?: string;
  manualRef: string;
  highlight: string[];
  measurement: MeasurementSpec;
  pass: Outcome;
  fail: Outcome;
  branches?: Record<string, Outcome>;
}

export interface PartRec {
  name: string;
  notes?: string;
}

export interface Diagnosis {
  id: string;
  title: string;
  summary: string;
  likelyCause: string;
  recommendedAction: string;
  parts: PartRec[];
  severity: "info" | "service" | "replace";
}

export interface SymptomDef {
  id: string;
  label: string;
  summary: string;
  manualSection: string;
  startStepId: string;
}

export interface ModelPack {
  id: string;
  manufacturer: ManufacturerId;
  manufacturerLabel: string;
  name: string;
  fullName: string;
  voltage: number;
  powertrain: Powertrain;
  architecture: string;
  years: string;
  /** Inclusive factory years. When set, UI/Start use this instead of parsing `years`. */
  yearMin?: number;
  yearMax?: number;
  diagramTitle: string;
  diagramNotes: string[];
  components: ComponentDef[];
  wires: WireDef[];
  testPoints: TestPointDef[];
  symptoms: SymptomDef[];
  steps: Record<string, DiagnosticStep>;
  diagnoses: Record<string, Diagnosis>;
}

export interface ReadingAttempt {
  attempt: Attempt;
  raw: string;
  numeric?: number;
  optionId?: string;
  inRange: boolean;
  unusual: boolean;
  at: string;
}

export interface LogEntry {
  id: string;
  stepId: string;
  stepTitle: string;
  at: string;
  kind: MeasurementKind;
  expectedLabel: string;
  unit?: string;
  attempts: ReadingAttempt[];
  confirmedRaw: string;
  confirmedNumeric?: number;
  confirmedOptionId?: string;
  result: "pass" | "fail" | "branch" | "skip";
  branchId?: string;
  next: Outcome;
  skipReason?: string;
}

export interface AiTurn {
  at: string;
  role: "user" | "assistant";
  text: string;
}

export interface PackCellReading {
  index: number;
  volts: string;
  ir?: string;
  /** Shop scale used when the tech typed `ir`. Default milliohms. */
  irUnit?: "mohm" | "megohm";
  irCouldNot?: boolean;
  irSkipReason?: string;
  ageMonthYear?: string;
  ageNotReadable?: boolean;
  agePhotoNote?: string;
}

export interface PackCheckRecord {
  at: string;
  chemistry: BatteryType;
  cellCount: number;
  nominalV: number;
  cells: PackCellReading[];
  loadDropPct?: string;
  batteryAgeYears?: string;
  irCouldNotMeasure?: boolean;
  irSkipReason?: string;
  ageLabelPhotoNote?: string;
  irSpreadNote?: string;
  verdict: CaseVerdict;
  issues: string[];
  lithiumMonitorV?: string;
  lithiumMinCell?: string;
  lithiumFaults?: string;
  lithiumNoMonitor?: boolean;
}

export interface CodeSaveRecord {
  at: string;
  present: string;
  history: string;
  photoNote: string;
  couldNotConnect: boolean;
  connectReason?: string;
  cleared: boolean;
  programFileName?: string;
  logFileName?: string;
  loggerNotUsed?: boolean;
  faultCounters?: { fault: string; count: string }[];
  faultCounterNotes?: string;
  odometer?: string;
  faultOdometer?: string;
  noControllerReadings?: boolean;
}

export interface TestBatteryNote {
  used: boolean;
  measuredProblem: string;
}

export type BrainCopyStatus = "ready" | "queued" | "sent" | "failed";

export interface BrainCopyRecord {
  status: BrainCopyStatus;
  filename: string;
  path: string;
  markdown: string;
  at: string;
  sentAt?: string;
  error?: string;
  attempts: number;
}

export interface JobRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  technician: string;
  serialNumber: string;
  notes: string;
  modelId: string;
  symptomId: string;
  currentStepId: string;
  status: JobStatus;
  diagnosisId?: string;
  log: LogEntry[];
  aiLog?: AiTurn[];
  includeAiInReport?: boolean;
  pending?: {
    stepId: string;
    attempts: ReadingAttempt[];
    required: 2 | 3;
  };
  lastName?: string;
  hcpJobNumber?: string;
  cartYear?: string;
  cartMake?: string;
  cartModel?: string;
  batteryType?: BatteryType;
  complaintNote?: string;
  fuelNote?: string;
  casePhase?: CasePhase;
  packCheck?: PackCheckRecord;
  codeSave?: CodeSaveRecord;
  testBattery?: TestBatteryNote;
  skipReasons?: Record<string, string>;
  motorUnlock?: {
    commandedNoMove: boolean;
    controllerUnplugged: boolean;
  };
  retestNote?: string;
  reportConfirmed?: boolean;
  provenCauseOverride?: string;
  brainCopy?: BrainCopyRecord;
  pathRedirects?: { at: string; fromStepId: string; toStepId: string; reason: string }[];
  manualStatus?: {
    onFile: boolean;
    summary: string;
  };
  /** Typed tech observation — kept even when helper results refresh. */
  techObservation?: string;
  /** In-progress pack fields, persisted on blur before Save. */
  packDraft?: PackDraft;
  /** In-progress factory-check meter/choice, kept when switching Diagram / Helper / Report. */
  meterDraft?: { stepId: string; raw: string; selected: string | null };
}

export interface PackDraftCell {
  volts: string;
  ir: string;
  irUnit?: "mohm" | "megohm";
  age: string;
  ageSkip: boolean;
}

export interface PackDraft {
  cells: PackDraftCell[];
  loadDrop?: string;
  monitorV?: string;
  minCell?: string;
  faults?: string;
  noMonitor?: boolean;
  irSkip?: boolean;
  irSkipReason?: string;
  agePhoto?: string;
  testNote?: string;
}
