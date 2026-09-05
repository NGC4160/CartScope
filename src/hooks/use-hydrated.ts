import { useEffect, useState } from "react";
import { useJobStore } from "@/store/jobs";

/** True after zustand persist has read localStorage. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useJobStore.persist.hasHydrated());
  useEffect(() => {
    if (useJobStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useJobStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
