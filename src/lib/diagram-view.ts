/** Persist diagram zoom/pan across dock switches without writing the job. */

export type DiagramView = {
  scale: number;
  x: number;
  y: number;
};

export const BAY_DIAGRAM_DEFAULT_SCALE = 1.45;
export const BAY_DIAGRAM_MIN_SCALE = 0.35;
export const BAY_DIAGRAM_MAX_SCALE = 3;

const views = new Map<string, DiagramView>();

export function diagramViewKey(jobId: string, tab: string): string {
  return `${jobId}:${tab}`;
}

export function readDiagramView(key: string): DiagramView | null {
  return views.get(key) ?? null;
}

export function writeDiagramView(key: string, view: DiagramView): DiagramView {
  const next = {
    scale: clampDiagramScale(view.scale),
    x: view.x,
    y: view.y,
  };
  views.set(key, next);
  return next;
}

export function clearDiagramViews(): void {
  views.clear();
}

export function clampDiagramScale(scale: number): number {
  if (!Number.isFinite(scale)) return BAY_DIAGRAM_DEFAULT_SCALE;
  return Math.min(BAY_DIAGRAM_MAX_SCALE, Math.max(BAY_DIAGRAM_MIN_SCALE, scale));
}

/** Fill pane width (larger than letterbox contain) so wire labels stay readable. */
export function defaultDiagramScale(
  availW: number,
  availH: number,
  contentW: number,
  contentH: number,
): number {
  if (!(availW > 0) || !(contentW > 0)) return BAY_DIAGRAM_DEFAULT_SCALE;
  const fitWidth = availW / contentW;
  const fitContain =
    availH > 0 && contentH > 0 ? Math.min(availW / contentW, availH / contentH) : fitWidth;
  return clampDiagramScale(Math.max(fitWidth, fitContain * 1.35, BAY_DIAGRAM_DEFAULT_SCALE));
}
