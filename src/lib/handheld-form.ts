export type HandheldBlocker = {
  field: string;
  message: string;
};

export function handheldSaveBlockers(input: {
  noConnect: boolean;
  connectReason: string;
  programFile: string;
  present: string;
  history: string;
  loggerNotUsed: boolean;
  logFile: string;
  noReadings: boolean;
  odometer: string;
  faultOdo: string;
  counterNotes: string;
  hasCounter: boolean;
}): HandheldBlocker[] {
  const blockers: HandheldBlocker[] = [];
  if (input.noConnect) {
    if (input.connectReason.trim().length < 4) {
      blockers.push({
        field: "Could not connect reason",
        message: "Write a short reason that the handheld could not connect or could not save.",
      });
    }
    return blockers;
  }

  if (!input.programFile.trim()) {
    blockers.push({
      field: "Program file name",
      message: "Enter the program file name you used on the handheld.",
    });
  }
  if (!input.present.trim()) {
    blockers.push({
      field: "Present codes",
      message: "Write present codes from the program file or handheld screen. Write None if the screen shows none.",
    });
  }
  if (!input.history.trim()) {
    blockers.push({
      field: "History codes",
      message: "Write history codes from the same program file. Write None if the screen shows none.",
    });
  }
  if (!input.loggerNotUsed && !input.logFile.trim()) {
    blockers.push({
      field: "Log file name",
      message: "Enter the log file name, or check that the logger was not used.",
    });
  }
  const readingsOk =
    input.noReadings ||
    input.odometer.trim().length > 0 ||
    input.faultOdo.trim().length > 0 ||
    input.counterNotes.trim().length > 0 ||
    input.hasCounter;
  if (!readingsOk) {
    blockers.push({
      field: "Fault counters / odometer",
      message:
        "Write odometer, fault odometer, or a fault counter, or check that this controller does not show them.",
    });
  }
  return blockers;
}
