import { useEffect, useState } from "react";
import { useJobStore } from "@/store/jobs";

/** True after zustand persist has read the tablet job store. */
export function useHydrated() {
  const persistApi = useJobStore.persist;
  const [hydrated, setHydrated] = useState(() => persistApi?.hasHydrated() ?? false);
  useEffect(() => {
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    void persistApi.rehydrate();
    return unsub;
  }, [persistApi]);
  return hydrated;
}
