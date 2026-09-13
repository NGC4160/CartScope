import { useEffect, useState } from "react";
import { jobsMatchDurable, persistTabletJobs, readLiveJobsRaw } from "@/lib/jobs-persist";
import { useJobStore } from "@/store/jobs";

let hydrateInFlight: Promise<void> | null = null;
let hydrateFinished = false;

export function resetJobHydrateForTests(): void {
  hydrateInFlight = null;
  hydrateFinished = false;
}

/**
 * One rehydrate per tab. Extra useHydrated() mounts (root + Home + bench,
 * Strict Mode) must not start a second read that can overwrite a newer save.
 */
export function hydrateJobStore(): Promise<void> {
  const persistApi = useJobStore.persist;
  if (!persistApi) return Promise.resolve();
  if (hydrateFinished && persistApi.hasHydrated()) return Promise.resolve();
  if (!hydrateInFlight) {
    hydrateInFlight = Promise.resolve(persistApi.rehydrate())
      .then(() => {
        hydrateFinished = true;
        const jobs = useJobStore.getState().jobs;
        if (!jobs.length) return;
        if (!jobsMatchDurable(readLiveJobsRaw(), jobs)) {
          persistTabletJobs(jobs);
        }
      })
      .finally(() => {
        hydrateInFlight = null;
      });
  }
  return hydrateInFlight;
}

/** True after zustand persist has read the tablet job store. */
export function useHydrated() {
  const persistApi = useJobStore.persist;
  const [hydrated, setHydrated] = useState(() => persistApi?.hasHydrated() ?? false);
  useEffect(() => {
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    if (hydrateFinished || persistApi.hasHydrated()) {
      setHydrated(true);
      const jobs = useJobStore.getState().jobs;
      if (jobs.length && !jobsMatchDurable(readLiveJobsRaw(), jobs)) {
        persistTabletJobs(jobs);
      }
      return;
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    void hydrateJobStore().then(() => setHydrated(true));
    return unsub;
  }, [persistApi]);
  return hydrated;
}
