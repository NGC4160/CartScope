import { useCallback, useRef, useState } from "react";
import { Minus, Plus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WiringCanvas({ src, alt }: { src: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const sized = useRef(false);

  const clampScale = (s: number) => Math.min(8, Math.max(0.15, s));

  const computeFit = useCallback((w: number, h: number) => {
    const wrap = wrapRef.current;
    if (!wrap || !w || !h) return 0.4;
    const pad = 16;
    const availW = Math.max(160, wrap.clientWidth - pad);
    const availH = Math.max(160, wrap.clientHeight - pad);
    const ar = w / h;
    if (ar > 2.15) return clampScale((availH / h) * 0.96);
    return clampScale(Math.min(availW / w, availH / h));
  }, []);

  const applySize = useCallback(
    (w: number, h: number) => {
      if (!w || !h || sized.current) return;
      sized.current = true;
      setNat({ w, h });
      setPos({ x: 0, y: 0 });
      requestAnimationFrame(() => setScale(computeFit(w, h)));
    },
    [computeFit],
  );

  const zoomAt = useCallback((next: number) => {
    setScale(clampScale(next));
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
    setScale(computeFit(nat.w, nat.h));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <Button size="sm" variant="secondary" onClick={() => zoomAt(scale / 1.25)} aria-label="Zoom out">
          <Minus className="size-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => zoomAt(scale * 1.25)} aria-label="Zoom in">
          <Plus className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={fit}>
          <Maximize2 className="size-4" />
          Fit screen
        </Button>
        <p className="ml-auto font-mono text-xs tabular-nums text-ink-subtle">{Math.round(scale * 100)}%</p>
      </div>
      <div
        ref={wrapRef}
        className="relative min-h-72 flex-1 cursor-grab overflow-hidden bg-paper-sunken active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              applySize(img.naturalWidth, img.naturalHeight);
            }}
            ref={(el) => {
              if (el && el.complete && el.naturalWidth) applySize(el.naturalWidth, el.naturalHeight);
            }}
            className="max-w-none select-none outline outline-1 -outline-offset-1 outline-line-strong"
            style={nat.w ? { width: nat.w, height: nat.h } : { maxHeight: "100%", maxWidth: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
