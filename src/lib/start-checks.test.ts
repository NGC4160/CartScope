import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import type { ModelPack } from "../data/types.ts";
import {
  attemptStartChecks,
  complaintHasFirstStep,
  packYearCheck,
  readHeaderSnapshot,
  reverseOrOneWaySymptom,
  startBlockedReason,
  startBlockers,
  startIsReady,
  type HeaderSnapshot,
} from "./start-checks.ts";
import { initialPhase } from "./case-flow.ts";
import { yearIssueLine, yearStatusNote } from "./year-compat.ts";

/** Real Club Car DS IQ motor-braking path from `club-car-iq`. */
const clubCarDsIq = {
  id: "club-car-ds-iq",
  manufacturerLabel: "Club Car",
  name: "DS IQ / Villager IQ",
  fullName: "Club Car DS IQ, Villager 4/6/8, Transporter 4/6 IQ System (48 V)",
  powertrain: "electric",
  years: "2001–2011 DS IQ; 2008–2011 Villager 4/6/8 and Transporter 4/6 IQ System",
  symptoms: [
    {
      id: "runs-slowly",
      label: "Cart runs slowly",
      summary: "Moves but will not reach speed.",
      startStepId: "psl-speed",
    },
    {
      id: "no-braking",
      label: "Motor braking does not work",
      summary: "Cart runs but motor braking does not.",
      startStepId: "pbr-speed",
    },
  ],
  steps: { "psl-speed": { id: "psl-speed" }, "pbr-speed": { id: "pbr-speed" } },
} as unknown as ModelPack;

/** Real EZ-GO Marathon 4-cycle year copy from `ezgo-marathon-gas`. */
const ezgoMarathonGas = {
  id: "ezgo-marathon-gas",
  manufacturerLabel: "EZ-GO",
  name: "Marathon / GX-444 4-cycle",
  fullName: "EZ-GO Marathon 4-cycle / GX-444 / Freedom / GXT / TUFF1 / PC4GX / BC-360",
  powertrain: "gasoline",
  years:
    "1991–1996 4-cycle gasoline (manual 27206-G01): GX-444, GX-444F Freedom, GX-444F HP, 1992–1994 GXT/1-804, TUFF1, 1992–1995 PC4GX / PC4GXI, 1992–1994 BC-360",
  symptoms: [
    {
      id: "no-crank",
      label: "Engine will not crank",
      summary: "Key START does nothing.",
      startStepId: "g-setup",
    },
  ],
  steps: { "g-setup": { id: "g-setup" } },
} as unknown as ModelPack;

/** Real EZ-GO TXT 48 V TCT ids, year copy, and no-reverse path from `ezgo-dc`. */
const ezgoTxt = {
  id: "ezgo-txt-tct",
  manufacturerLabel: "EZ-GO",
  name: "TXT 48 V TCT",
  fullName: "EZ-GO TXT 48 V TCT (Curtis 1206HB-5201)",
  powertrain: "electric",
  years:
    "TXT 48 V TCT (48V TXT Service Manual, Electronic Speed Control — TCT, Section E) — Fleet / Freedom 48 V TCT",
  symptoms: [
    {
      id: "one-direction",
      label: "Runs one way only",
      summary: "The solenoid clicks. One direction is dead.",
      startStepId: "tdir-fr",
    },
  ],
  steps: { "tdir-fr": { id: "tdir-fr" } },
} as unknown as ModelPack;

/** Real Yamaha YDRE DC ids and year copy from `yamaha-dc` (not a stub catalog). */
const yamahaYdreDc = {
  id: "yamaha-ydre-dc",
  manufacturerLabel: "Yamaha",
  name: "YDRE DC Drive",
  fullName: "Yamaha YDRE / Drive G29 DC (48 V)",
  powertrain: "electric",
  years: "2007–2016 Drive / G29 / YDRE DC (YDRA/E Service Manual, 2016)",
  symptoms: [
    {
      id: "no-operation",
      label: "Will not run either way",
      summary: "The book splits this into two check lists: the solenoid clicks, or it does not.",
      startStepId: "yno-split",
    },
  ],
  steps: { "yno-split": { id: "yno-split" } },
} as unknown as ModelPack;

/** Real Yamaha YDRA year copy and starts-then-dies path from `gas` builder. */
const yamahaYdra = {
  id: "yamaha-ydra",
  manufacturerLabel: "Yamaha",
  name: "YDRA gasoline",
  fullName: "Yamaha YDRA / Drive gasoline (G29 gas)",
  powertrain: "gasoline",
  years: "2007–2016 Drive / G29 gasoline (YDRA/E Service Manual LIT-19626, 2016, chapters 8–9)",
  symptoms: [
    {
      id: "starts-dies",
      label: "Starts then dies",
      summary: "Kill path grounding after start, or the engine is starving for fuel.",
      startStepId: "g-dies",
    },
    {
      id: "low-power",
      label: "Runs, low power",
      summary: "Belt, brakes, filter, exhaust first. Then carb/EFI.",
      startStepId: "g-power",
    },
  ],
  steps: { "g-dies": { id: "g-dies" }, "g-power": { id: "g-power" } },
} as unknown as ModelPack;

function lithiumNoReverseHeader(note = "No reverse"): HeaderSnapshot {
  return {
    lastName: "Patel",
    hcpJobNumber: "880301",
    technician: "Hayden",
    cartYear: "2019",
    serialNumber: "",
    batteryType: "lithium",
    complaintNote: note,
    fuelNote: "",
  };
}

test("filled lithium EZ-GO no-reverse header resolves to the bench path", () => {
  const symptom = reverseOrOneWaySymptom(ezgoTxt);
  assert.ok(symptom);
  assert.equal(symptom?.id, "one-direction");

  const started = attemptStartChecks({
    pack: ezgoTxt,
    symptomId: symptom!.id,
    header: lithiumNoReverseHeader(),
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "tdir-fr");
    assert.equal(started.jobInput.modelId, "ezgo-txt-tct");
    assert.equal(started.jobInput.batteryType, "lithium");
    assert.equal(started.jobInput.lastName, "Patel");
    assert.equal(started.jobInput.technician, "Hayden");
    assert.equal(started.benchPath("job_ezgo"), "/bench/job_ezgo");
  }
});

test("Start click with a missing field returns named errors and does not start", () => {
  const symptom = reverseOrOneWaySymptom(ezgoTxt);
  const started = attemptStartChecks({
    pack: ezgoTxt,
    symptomId: symptom?.id ?? "one-direction",
    header: { ...lithiumNoReverseHeader(), lastName: "", hcpJobNumber: "" },
  });
  assert.equal(started.ok, false);
  if (!started.ok) {
    assert.deepEqual(started.gaps, ["lastName", "hcpJobNumber"]);
    assert.ok(started.messages.some((m) => /last name/i.test(m)));
    assert.ok(started.messages.some((m) => /Housecall Pro/i.test(m)));
  }
});

test("complaint note type / clear / re-type survives into job state", () => {
  const symptomId = reverseOrOneWaySymptom(ezgoTxt)?.id ?? "one-direction";
  const typed = attemptStartChecks({
    pack: ezgoTxt,
    symptomId,
    header: lithiumNoReverseHeader("Lights on, no reverse"),
  });
  assert.equal(typed.ok, true);
  if (typed.ok) {
    assert.equal(typed.jobInput.complaintNote, "Lights on, no reverse");
    assert.equal(typed.jobInput.notes, "Lights on, no reverse");
  }

  const cleared = attemptStartChecks({
    pack: ezgoTxt,
    symptomId,
    header: lithiumNoReverseHeader(""),
  });
  assert.equal(cleared.ok, true);
  if (cleared.ok) {
    assert.equal(cleared.jobInput.complaintNote, "");
    assert.equal(cleared.jobInput.notes, "");
  }

  const retyped = attemptStartChecks({
    pack: ezgoTxt,
    symptomId,
    header: lithiumNoReverseHeader("Intermittent, no reverse after rain"),
  });
  assert.equal(retyped.ok, true);
  if (retyped.ok) {
    assert.equal(retyped.jobInput.complaintNote, "Intermittent, no reverse after rain");
  }

  const form = new FormData();
  form.set("complaintNote", "typed in the form");
  form.set("lastName", "stale-should-lose");
  const fromForm = readHeaderSnapshot(form, lithiumNoReverseHeader("stale note"));
  assert.equal(fromForm.complaintNote, "typed in the form");
  assert.equal(fromForm.lastName, "stale-should-lose");
});

test("Yamaha YDRA 2016 starts checks; an out-of-book year is named, not a silent no-op", () => {
  const supported = attemptStartChecks({
    pack: yamahaYdra,
    symptomId: "starts-dies",
    header: {
      lastName: "Brooks",
      hcpJobNumber: "880302",
      technician: "Hayden",
      cartYear: "2016",
      serialNumber: "",
      batteryType: "",
      complaintNote: "runs rough / dies under load",
      fuelNote: "",
    },
  });
  assert.equal(supported.ok, true);
  if (supported.ok) {
    assert.equal(supported.startStepId, "g-dies");
    assert.equal(supported.jobInput.complaintNote, "runs rough / dies under load");
    assert.equal(supported.benchPath("job_ydra"), "/bench/job_ydra");
    assert.match(supported.yearNote ?? "", /2016/);
    assert.match(supported.routeLabel, /Yamaha/);
    assert.match(supported.routeLabel, /YDRA/);
  }

  const unsupported = attemptStartChecks({
    pack: yamahaYdra,
    symptomId: "starts-dies",
    header: {
      lastName: "Brooks",
      hcpJobNumber: "880302",
      technician: "Hayden",
      cartYear: "2018",
      serialNumber: "",
      batteryType: "",
      complaintNote: "runs rough / dies under load",
      fuelNote: "",
    },
  });
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) {
    assert.ok(unsupported.yearMessage);
    assert.match(unsupported.yearMessage ?? "", /2018/);
    assert.match(unsupported.yearMessage ?? "", /2007/);
    assert.ok(unsupported.messages.includes(unsupported.yearMessage ?? ""));
    assert.ok(unsupported.messages.some((m) => /Start route:/.test(m)));
    assert.match(unsupported.routeLabel, /2018/);
  }
});

test("Club Car DS V-Glide 1994 starts checks and names the year", () => {
  const vglide = {
    id: "club-car-ds-vglide",
    manufacturerLabel: "Club Car",
    name: "DS V-Glide 36 V",
    fullName: "Club Car DS V-Glide 36 Volt",
    powertrain: "electric",
    years: "1994–2000 DS V-Glide 36 V (1994 DS M&S; 1995–96 Section 19; 2000 supplement 102067504)",
    symptoms: [
      {
        id: "no-operation",
        label: "Cart will not run — no solenoid click",
        summary: "Small-wire path",
        startStepId: "vno-setup",
      },
    ],
    steps: { "vno-setup": { id: "vno-setup" } },
  } as unknown as ModelPack;

  const started = attemptStartChecks({
    pack: vglide,
    symptomId: "no-operation",
    header: {
      lastName: "Ng",
      hcpJobNumber: "880304",
      technician: "Hayden",
      cartYear: "1994",
      serialNumber: "",
      batteryType: "lead-acid",
      complaintNote: "Round 3 no-manual path",
      fuelNote: "",
    },
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "vno-setup");
    assert.match(started.yearNote ?? "", /1994/);
    assert.equal(started.benchPath("job_vglide"), "/bench/job_vglide");
  }
});

test("gas header with last name, HCP, year, and who-checked starts without a battery type", () => {
  const started = attemptStartChecks({
    pack: yamahaYdra,
    symptomId: "starts-dies",
    header: {
      lastName: "GasPR14",
      hcpJobNumber: "881602",
      technician: "Hayden",
      cartYear: "2012",
      serialNumber: "",
      batteryType: "",
      complaintNote: "",
      fuelNote: "",
    },
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "g-dies");
    assert.equal(started.jobInput.batteryType, undefined);
    assert.equal(started.jobInput.technician, "Hayden");
  }
});

test("Club Car IQ Motor braking starts when the header is filled", () => {
  const symptom = clubCarDsIq.symptoms.find((s) => s.id === "no-braking");
  assert.ok(symptom);
  assert.equal(symptom?.label, "Motor braking does not work");
  assert.equal(complaintHasFirstStep(clubCarDsIq, "no-braking"), true);
  const started = attemptStartChecks({
    pack: clubCarDsIq,
    symptomId: "no-braking",
    header: {
      lastName: "Brake",
      hcpJobNumber: "880701",
      technician: "Hayden",
      cartYear: "2006",
      serialNumber: "",
      batteryType: "lead-acid",
      complaintNote: "Motor braking does not work",
      fuelNote: "",
    },
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "pbr-speed");
    assert.equal(started.jobInput.symptomId, "no-braking");
  }
});

test("Marathon year 2010 blocks Start with a readable year error; 1996 starts", () => {
  const header2010: HeaderSnapshot = {
    lastName: "Yearbug",
    hcpJobNumber: "880702",
    technician: "Hayden",
    cartYear: "2010",
    serialNumber: "",
    batteryType: "",
    complaintNote: "",
    fuelNote: "",
  };
  const blocked = startBlockers({
    pack: ezgoMarathonGas,
    symptomId: "no-crank",
    header: header2010,
  });
  assert.equal(startIsReady(blocked), false);
  assert.ok(blocked.some((b) => b.kind === "year"));
  assert.ok(blocked.some((b) => /2010/.test(b.message) && /1991/.test(b.message) && /1996/.test(b.message)));

  const startedBad = attemptStartChecks({
    pack: ezgoMarathonGas,
    symptomId: "no-crank",
    header: header2010,
  });
  assert.equal(startedBad.ok, false);
  if (!startedBad.ok) {
    assert.ok(startedBad.yearMessage);
    assert.match(startedBad.yearMessage ?? "", /2010/);
    assert.match(startedBad.yearMessage ?? "", /1991–1996|1991-1996/);
  }

  const startedOk = attemptStartChecks({
    pack: ezgoMarathonGas,
    symptomId: "no-crank",
    header: { ...header2010, cartYear: "1996" },
  });
  assert.equal(startedOk.ok, true);
  if (startedOk.ok) {
    assert.equal(startedOk.startStepId, "g-setup");
  }
});

test("DS FE350 year 1996 starts Check 1; year 2010 stays blocked with the 1991–1996 range", () => {
  const fe350 = {
    id: "club-car-ds-gas",
    manufacturerLabel: "Club Car",
    name: "DS FE350 gasoline",
    fullName: "Club Car DS gasoline (Kawasaki FE350)",
    powertrain: "gasoline",
    years:
      "1991–1996 Club Car DS gasoline (Kawasaki FE350; 1995–96 DS gas/electric; 2000 Club Car Service Manual). FE290 DS/Villager is a separate pack.",
    yearMin: 1991,
    yearMax: 1996,
    symptoms: [
      {
        id: "no-crank",
        label: "Engine will not crank",
        summary: "Key START does nothing.",
        startStepId: "g-setup",
      },
    ],
    steps: { "g-setup": { id: "g-setup" } },
  } as unknown as ModelPack;

  const header1996: HeaderSnapshot = {
    lastName: "Fe350",
    hcpJobNumber: "HCP-5803",
    technician: "Hayden",
    cartYear: "1996",
    serialNumber: "",
    batteryType: "",
    complaintNote: "No crank.",
    fuelNote: "",
  };
  const started = attemptStartChecks({
    pack: fe350,
    symptomId: "no-crank",
    header: header1996,
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "g-setup");
    assert.equal(started.benchPath("job_fe350"), "/bench/job_fe350");
  }

  const blocked = attemptStartChecks({
    pack: fe350,
    symptomId: "no-crank",
    header: { ...header1996, cartYear: "2010" },
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(startIsReady(blocked.blockers), false);
    assert.match(blocked.yearMessage ?? "", /2010/);
    assert.match(blocked.yearMessage ?? "", /1991–1996|1991-1996/);
    assert.doesNotMatch(blocked.yearMessage ?? "", /1991–1990|1991-1990/);
    assert.doesNotMatch(blocked.yearMessage ?? "", /1995–1996|1995-1996/);
    const yearCheck = packYearCheck(fe350, "2010");
    const field = yearIssueLine(yearCheck);
    const liveBlockers = startBlockers({
      pack: fe350,
      symptomId: "no-crank",
      header: { ...header1996, cartYear: "2010" },
      yearCheck,
    });
    const yearBlock = liveBlockers.find((b) => b.kind === "year");
    assert.ok(field);
    assert.equal(yearBlock?.message, field);
    assert.equal(startBlockedReason(field, liveBlockers), field);
    assert.equal(yearBlock?.message, blocked.yearMessage);
    assert.match(field, /1991–1996|1991-1996/);
    assert.doesNotMatch(field, /1991–1990|1991-1990/);
    assert.equal(yearStatusNote(yearCheck), yearCheck.message);
  }
});

test("DS FE350 blank Year keeps Start blocked; 1990 stays blocked; 1996 starts", () => {
  const fe350 = {
    id: "club-car-ds-gas",
    manufacturerLabel: "Club Car",
    name: "DS FE350 gasoline",
    fullName: "Club Car DS gasoline (Kawasaki FE350)",
    powertrain: "gasoline",
    years:
      "1991–1996 Club Car DS gasoline (Kawasaki FE350; 1995–96 DS gas/electric; 2000 Club Car Service Manual). FE290 DS/Villager is a separate pack.",
    yearMin: 1991,
    yearMax: 1996,
    symptoms: [
      {
        id: "no-crank",
        label: "Engine will not crank",
        summary: "Key START does nothing.",
        startStepId: "g-setup",
      },
    ],
    steps: { "g-setup": { id: "g-setup" } },
  } as unknown as ModelPack;

  const header: HeaderSnapshot = {
    lastName: "Test",
    hcpJobNumber: "M72008",
    technician: "Hayden Silva",
    cartYear: "",
    serialNumber: "",
    batteryType: "",
    complaintNote: "Engine will not crank",
    fuelNote: "",
  };

  const blankBlockers = startBlockers({
    pack: fe350,
    symptomId: "no-crank",
    header,
  });
  assert.equal(startIsReady(blankBlockers), false);
  assert.ok(blankBlockers.some((b) => b.message === "Year is required."));

  const blank = attemptStartChecks({
    pack: fe350,
    symptomId: "no-crank",
    header,
  });
  assert.equal(blank.ok, false);
  if (!blank.ok) {
    assert.ok(blank.gaps.includes("cartYear"));
    assert.ok(blank.messages.includes("Year is required."));
    assert.equal(blank.yearMessage, null);
    assert.equal(startBlockedReason(blank.yearMessage, blank.blockers), "Year is required.");
  }

  const wrong = attemptStartChecks({
    pack: fe350,
    symptomId: "no-crank",
    header: { ...header, cartYear: "1990" },
  });
  assert.equal(wrong.ok, false);
  if (!wrong.ok) {
    assert.equal(startIsReady(wrong.blockers), false);
    assert.match(wrong.yearMessage ?? "", /1990/);
    assert.match(wrong.yearMessage ?? "", /1991–1996|1991-1996/);
    assert.ok(wrong.blockers.some((b) => b.kind === "year"));
  }

  const started = attemptStartChecks({
    pack: fe350,
    symptomId: "no-crank",
    header: { ...header, cartYear: "1996" },
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.startStepId, "g-setup");
    assert.equal(started.jobInput.cartYear, "1996");
    assert.equal(started.jobInput.technician, "Hayden Silva");
    assert.equal(started.benchPath("job_fe350"), "/bench/job_fe350");
  }
});

test("a missing first factory check is named, never a silent no-op", () => {
  const broken = {
    ...ezgoTxt,
    symptoms: [{ id: "one-direction", label: "Runs one way only", summary: "", startStepId: "missing-step" }],
    steps: {},
  } as unknown as ModelPack;
  const started = attemptStartChecks({
    pack: broken,
    symptomId: "one-direction",
    header: lithiumNoReverseHeader(),
  });
  assert.equal(started.ok, false);
  if (!started.ok) {
    assert.ok(started.messages.length > 0);
    assert.ok(started.messages.some((m) => /first factory check/i.test(m)));
    assert.ok(started.messages.some((m) => /Start route:/.test(m)));
    assert.match(started.routeLabel, /EZ-GO/);
  }
});

test("empty FormData year does not wipe a live FE350 1996", () => {
  const live: HeaderSnapshot = {
    lastName: "Test",
    hcpJobNumber: "M29011",
    technician: "Hayden",
    cartYear: "1996",
    serialNumber: "",
    batteryType: "",
    complaintNote: "No crank.",
    fuelNote: "",
  };
  const form = new FormData();
  form.set("lastName", "Test");
  form.set("hcpJobNumber", "M29011");
  form.set("technician", "Hayden");
  form.set("cartYear", "");
  form.set("complaintNote", "No crank.");
  const snap = readHeaderSnapshot(form, live);
  assert.equal(snap.cartYear, "1996");
  assert.equal(snap.lastName, "Test");
});

test("Job header wizard must not import yearIssueLine (that minify rebound broke FE350 Start in #31)", () => {
  const src = readFileSync(new URL("../components/wizard/NewJobWizard.tsx", import.meta.url), "utf8");
  const imports = src.split("export function NewJobWizard")[0] ?? src;
  assert.doesNotMatch(imports, /yearIssueLine/);
  assert.doesNotMatch(imports, /startBlockedReason/);
  assert.doesNotMatch(imports, /isOverlayChrome|bay-chrome-hit|StartOverlayCatch/);
  assert.match(src, /onClick=\{onStartClick\}/);
  assert.doesNotMatch(src, /onPointerUp/);
});

test("Save bar is padded off the Grok pill; Start stays inset without overlay imports", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\[data-bay-chrome\]\s*\{[^}]*padding-right:\s*11\.5rem\s*!important/s);
  assert.match(css, /\[data-start-checks\]\s*\{[^}]*margin-right:\s*11\.5rem/s);
});

test("sticky Save fires pointerdown and click on the button and still steals only overlay chrome", () => {
  const src = readFileSync(new URL("../components/bay/BayActionBar.tsx", import.meta.url), "utf8");
  assert.match(src, /createBayGesture/);
  assert.match(src, /isOverlayChrome/);
  assert.match(src, /onPointerDown=\{onPrimaryPointerDown\}/);
  assert.match(src, /onClick=\{onPrimaryClick\}/);
  assert.match(src, /pr-\[11\.5rem\]/);
  assert.doesNotMatch(src, /pointHitsBayStart|data-start-checks/);
});

test("real Yamaha YDRE DC pack still starts Will not run either way on yno-split", () => {
  const src = readFileSync(new URL("../data/builders/yamaha-dc.ts", import.meta.url), "utf8");
  assert.match(src, /id:\s*"yamaha-ydre-dc"/);
  assert.match(src, /id:\s*"no-operation"/);
  assert.match(src, /startStepId:\s*"yno-split"/);
  assert.match(src, /["']yno-split["']/);
});

test("Yamaha YDRE DC valid header Starts to Check 1 (pack first, yno-split queued)", () => {
  const header: HeaderSnapshot = {
    lastName: "Test",
    hcpJobNumber: "HCP-YDRE-01",
    technician: "Hayden Silva",
    cartYear: "2012",
    serialNumber: "",
    batteryType: "lead-acid",
    complaintNote: "Will not run either way.",
    fuelNote: "",
  };
  assert.equal(complaintHasFirstStep(yamahaYdreDc, "no-operation"), true);
  assert.equal(initialPhase(yamahaYdreDc), "pack");

  const started = attemptStartChecks({
    pack: yamahaYdreDc,
    symptomId: "no-operation",
    header,
  });
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.symptomId, "no-operation");
    assert.equal(started.startStepId, "yno-split");
    assert.equal(started.jobInput.modelId, "yamaha-ydre-dc");
    assert.equal(started.jobInput.lastName, "Test");
    assert.equal(started.jobInput.technician, "Hayden Silva");
    assert.equal(started.jobInput.batteryType, "lead-acid");
    assert.equal(started.benchPath("job_ydre"), "/bench/job_ydre");
    assert.match(started.routeLabel, /Yamaha/);
    assert.match(started.routeLabel, /YDRE/);
  }
});

test("bay UX must prove Yamaha YDRE Start leaves Job header on its own", () => {
  const src = readFileSync(new URL("../../scripts/qa-bay-ux.mjs", import.meta.url), "utf8");
  assert.match(src, /runYamahaYdreStartToFirstCheck/);
  assert.match(src, /Hayden Silva/);
  assert.match(src, /YDRE DC/);
  assert.match(src, /keyboardActivateStart/);
});

test("bay UX must prove FE350 blank Year cannot Start", () => {
  const src = readFileSync(new URL("../../scripts/qa-bay-ux.mjs", import.meta.url), "utf8");
  assert.match(src, /FE350 blank Year/);
  assert.match(src, /Year is required/);
  assert.match(src, /FE350 1990/);
  assert.match(src, /mouseClickStart/);
});

test("Start overlay catch lives outside the wizard and clicks the Start control", () => {
  const src = readFileSync(new URL("../components/wizard/StartOverlayCatch.tsx", import.meta.url), "utf8");
  assert.match(src, /isOverlayChrome/);
  assert.match(src, /pointHitsBayStart/);
  assert.match(src, /data-start-checks/);
  assert.match(src, /\.click\(\)/);
});
