import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { JobRecord } from "../data/types.ts";
import { SHARED_JOBS_API_PATH, SHARED_MIGRATED_KEY, toSharedJobsDocument } from "./shared-jobs.ts";
import {
  hydrateSharedJobs,
  resetSharedJobsClientForTests,
  scheduleSharedPush,
} from "./shared-jobs-client.ts";

function sampleJob(id: string, technician = "Hayden Silva"): JobRecord {
  return {
    id,
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-21T00:01:00.000Z",
    technician,
    serialNumber: "",
    notes: "",
    modelId: "yamaha-ydre-dc",
    symptomId: "no-operation",
    currentStepId: "yno-split",
    status: "in-progress",
    log: [],
    lastName: "Martinez",
    hcpJobNumber: "HCP-5212",
    cartYear: "2012",
    cartMake: "Yamaha",
    cartModel: "YDRE",
    batteryType: "lead-acid",
    complaintNote: "",
    fuelNote: "",
    casePhase: "codes",
    techObservation: "Solenoid clicks, no spark at the plug.",
  };
}

type FetchCall = {
  url: string;
  method: string;
  body: unknown;
};

function installWindow(disk: Map<string, string>) {
  const storage = {
    getItem: (key: string) => disk.get(key) ?? null,
    setItem: (key: string, value: string) => {
      disk.set(key, String(value));
    },
    removeItem: (key: string) => {
      disk.delete(key);
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: storage,
      addEventListener: () => {},
    },
    configurable: true,
  });
}

function restoreWindow(
  prevWindow: PropertyDescriptor | undefined,
  prevLocal: PropertyDescriptor | undefined,
) {
  if (prevWindow) Object.defineProperty(globalThis, "window", prevWindow);
  else Reflect.deleteProperty(globalThis, "window");
  if (prevLocal) Object.defineProperty(globalThis, "localStorage", prevLocal);
  else Reflect.deleteProperty(globalThis, "localStorage");
}

afterEach(() => {
  resetSharedJobsClientForTests();
});

test("hydrate replaces local jobs with the shared store", async () => {
  const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const prevFetch = globalThis.fetch;
  installWindow(new Map());
  const cloud = sampleJob("job_cloud");
  let jobs = [sampleJob("job_local")];
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push({ url: String(input), method: "GET", body: null });
    return new Response(
      JSON.stringify({
        ok: true,
        empty: false,
        configured: true,
        ...toSharedJobsDocument({ jobs: [cloud] }),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
  try {
    await hydrateSharedJobs({
      getJobs: () => jobs,
      setJobs: (next) => {
        jobs = next;
      },
      sessionMutated: false,
    });
    assert.equal(jobs[0]?.id, "job_cloud");
    assert.equal(jobs[0]?.technician, "Hayden Silva");
    assert.equal(jobs[0]?.techObservation, "Solenoid clicks, no spark at the plug.");
    assert.equal(calls[0]?.url, SHARED_JOBS_API_PATH);
    assert.equal(globalThis.localStorage.getItem(SHARED_MIGRATED_KEY), "1");
  } finally {
    globalThis.fetch = prevFetch;
    restoreWindow(prevWindow, prevLocal);
  }
});

test("empty cloud uploads local jobs once", async () => {
  const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const prevFetch = globalThis.fetch;
  installWindow(new Map());
  const local = sampleJob("job_local");
  let jobs = [local];
  const puts: unknown[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "GET") {
      return new Response(JSON.stringify({ ok: true, empty: true, configured: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      migrate?: boolean;
      jobs?: JobRecord[];
    };
    puts.push(body);
    return new Response(
      JSON.stringify({
        ok: true,
        empty: false,
        configured: true,
        wrote: true,
        migrated: true,
        ...toSharedJobsDocument({ jobs: body.jobs ?? [] }),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
  try {
    await hydrateSharedJobs({
      getJobs: () => jobs,
      setJobs: (next) => {
        jobs = next;
      },
      sessionMutated: false,
    });
    assert.equal(puts.length, 1);
    assert.equal((puts[0] as { migrate?: boolean }).migrate, true);
    assert.equal((puts[0] as { jobs: JobRecord[] }).jobs[0]?.id, "job_local");
    assert.equal(jobs[0]?.id, "job_local");
    assert.equal(globalThis.localStorage.getItem(SHARED_MIGRATED_KEY), "1");
  } finally {
    globalThis.fetch = prevFetch;
    restoreWindow(prevWindow, prevLocal);
  }
});

test("session mutation keeps this bay's jobs instead of a late cloud GET", async () => {
  const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const prevFetch = globalThis.fetch;
  installWindow(new Map());
  let jobs = [sampleJob("job_this_tab")];
  let setCount = 0;
  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        ok: true,
        empty: false,
        configured: true,
        ...toSharedJobsDocument({ jobs: [sampleJob("job_other_tab")] }),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
  try {
    await hydrateSharedJobs({
      getJobs: () => jobs,
      setJobs: () => {
        setCount += 1;
      },
      sessionMutated: true,
    });
    assert.equal(setCount, 0);
    assert.equal(jobs[0]?.id, "job_this_tab");
  } finally {
    globalThis.fetch = prevFetch;
    restoreWindow(prevWindow, prevLocal);
  }
});

test("unconfigured store leaves the tablet cache alone", async () => {
  const prevWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const prevLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const prevFetch = globalThis.fetch;
  installWindow(new Map());
  let jobs = [sampleJob("job_local")];
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ ok: true, empty: true, configured: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  try {
    await hydrateSharedJobs({
      getJobs: () => jobs,
      setJobs: (next) => {
        jobs = next;
      },
      sessionMutated: false,
    });
    assert.equal(jobs[0]?.id, "job_local");
    scheduleSharedPush([sampleJob("job_new")]);
    await new Promise((resolve) => setTimeout(resolve, 20));
  } finally {
    globalThis.fetch = prevFetch;
    restoreWindow(prevWindow, prevLocal);
  }
});
