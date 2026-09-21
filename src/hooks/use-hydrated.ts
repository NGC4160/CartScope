import { useEffect, useState } from "react";
import {
  jobsMatchDurable,
  jobsSessionMutated,
  persistTabletJobs,
  readLiveJobsRaw,
} from "@/lib/jobs-persist";
import { hydrateSharedJobs } from "@/lib/shared-jobs-client";
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
      .then(async () => {
        hydrateFinished = true;
        const jobs = useJobStore.getState().jobs;
        if (jobs.length && !jobsMatchDurable(readLiveJobsRaw(), jobs)) {
          await persistTabletJobs(jobs);
        }
        void hydrateSharedJobs({
          getJobs: () => useJobStore.getState().jobs,
          setJobs: async (next) => {
            useJobStore.setState({ jobs: next });
            await persistTabletJobs(next);
          },
          sessionMutated: jobsSessionMutated(),
        });
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
        void persistTabletJobs(jobs);
      }
      return;
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    void hydrateJobStore().then(() => setHydrated(true));
    return unsub;
  }, [persistApi]);
  return hydrated;
}
