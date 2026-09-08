import { useLayoutEffect } from "react";
import { isOverlayChrome, pointHitsBayStart } from "@/lib/bay-chrome-hit";

/**
 * Same-document Grok pill over Job header Start. Lives outside NewJobWizard
 * so the wizard does not import overlay helpers (that minify rebound
 * stopped Start after #31). Synthesizes a click on the Start control.
 */
export function StartOverlayCatch() {
  useLayoutEffect(() => {
    function onPointerUp(event: PointerEvent) {
      if (!isOverlayChrome(event.target)) return;
      if (!pointHitsBayStart(event.clientX, event.clientY)) return;
      const btn = document.querySelector("[data-start-checks]");
      if (!(btn instanceof HTMLElement)) return;
      if (btn.getAttribute("data-start-ready") !== "true") return;
      event.preventDefault();
      event.stopPropagation();
      btn.click();
    }
    document.addEventListener("pointerup", onPointerUp, true);
    return () => document.removeEventListener("pointerup", onPointerUp, true);
  }, []);
  return null;
}
