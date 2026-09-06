import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BAY_TAP_MIN_PX } from "@/lib/bay-chrome";
import {
  BAY_DIAGRAM_DEFAULT_SCALE,
  clampDiagramScale,
  defaultDiagramScale,
  readDiagramView,
  writeDiagramView,
} from "@/lib/diagram-view";

export function ZoomPan({
  children,
  className = "",
  label = "Picture",
  viewKey,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  viewKey?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cached = viewKey ? readDiagramView(viewKey) : null;
  const [scale, setScale] = useState(cached?.scale ?? BAY_DIAGRAM_DEFAULT_SCALE);
  const [pos, setPos] = useState(cached ? { x: cached.x, y: cached.y } : { x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const inited = useRef(Boolean(cached));

  const measureDefault = useCallback(() => {
    const wrap = wrapRef.current;
    const content = contentRef.current;
    if (!wrap || !content) return BAY_DIAGRAM_DEFAULT_SCALE;
    return defaultDiagramScale(
      wrap.clientWidth,
      wrap.clientHeight,
      content.scrollWidth || content.getBoundingClientRect().width,
      content.scrollHeight || content.getBoundingClientRect().height,
    );
  }, []);

  useLayoutEffect(() => {
    if (inited.current) return;
    const next = measureDefault();
    setScale(next);
    inited.current = true;
  }, [measureDefault]);

  useEffect(() => {
    if (!viewKey) return;
    writeDiagramView(viewKey, { scale, x: pos.x, y: pos.y });
  }, [viewKey, scale, pos]);

  const zoomAt = useCallback((next: number) => {
    setScale(clampDiagramScale(next));
  }, []);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAt(scale * factor);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY };
      pinch.current = null;
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      pinch.current = { dist: dist || 1, scale };
      drag.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      zoomAt(pinch.current.scale * (dist / pinch.current.dist));
      return;
    }
    if (drag.current) {
      setPos({
        x: drag.current.x + (e.clientX - drag.current.px),
        y: drag.current.y + (e.clientY - drag.current.py),
      });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }

  function fit() {
    setPos({ x: 0, y: 0 });
    setScale(measureDefault());
  }

  return (
    <div className={"flex h-full min-h-0 flex-col " + className} data-diagram-scale={scale.toFixed(2)}>
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <Button
          size="sm"
          variant="secondary"
          className="min-h-11 min-w-11"
          style={{ minHeight: BAY_TAP_MIN_PX, minWidth: BAY_TAP_MIN_PX }}
          onClick={() => zoomAt(scale / 1.25)}
          aria-label="Zoom out"
        >
          <Minus className="size-5" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="min-h-11 min-w-11"
          style={{ minHeight: BAY_TAP_MIN_PX, minWidth: BAY_TAP_MIN_PX }}
          onClick={() => zoomAt(scale * 1.25)}
          aria-label="Zoom in"
        >
          <Plus className="size-5" />
        </Button>
        <Button size="sm" variant="ghost" className="min-h-11" onClick={fit}>
          <Maximize2 className="size-4" />
          Fit
        </Button>
        <p className="ml-auto font-mono text-xs tabular-nums text-ink-subtle" data-testid="diagram-zoom">
          {label} · {Math.round(scale * 100)}%
        </p>
      </div>
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 cursor-grab overflow-auto bg-paper-sunken active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flex min-h-full min-w-full items-center justify-center"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <div ref={contentRef} className="flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
