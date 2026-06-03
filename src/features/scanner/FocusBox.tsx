// The resizable scan box. Only what's inside it gets scanned. Drag the box to
// move it; pull any corner to zoom it bigger or smaller — it grows symmetrically
// from its centre, so every edge spreads out equally. Stored as screen fractions
// so it remembers across sessions and adapts to any screen size.

import { useRef } from 'react';
import type { ScanBox } from '../../lib/storage';

const MIN_W = 0.2;
const MIN_H = 0.06;

interface Props {
  box: ScanBox;
  cw: number;
  ch: number;
  onChange: (box: ScanBox) => void;
  onCommit: (box: ScanBox) => void;
}

type Corner = 'tl' | 'tr' | 'bl' | 'br';
const CORNERS: Corner[] = ['tl', 'tr', 'bl', 'br'];

type Drag =
  | { mode: 'move'; px: number; py: number; start: ScanBox }
  | { mode: 'resize'; corner: Corner; px: number; py: number; start: ScanBox };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function FocusBox({ box, cw, ch, onChange, onCommit }: Props) {
  const drag = useRef<Drag | null>(null);

  const startMove = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode: 'move', px: e.clientX, py: e.clientY, start: box };
  };

  const startResize = (corner: Corner) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode: 'resize', corner, px: e.clientX, py: e.clientY, start: box };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !cw || !ch) return;
    const dx = (e.clientX - d.px) / cw;
    const dy = (e.clientY - d.py) / ch;

    if (d.mode === 'move') {
      onChange({
        ...d.start,
        fx: clamp(d.start.fx + dx, 0, 1 - d.start.fw),
        fy: clamp(d.start.fy + dy, 0, 1 - d.start.fh),
      });
      return;
    }

    // Zoom symmetrically around the box centre: pulling a corner out grows the
    // opposite edge by the same amount, so the box spreads equally on all sides.
    const cx = d.start.fx + d.start.fw / 2;
    const cy = d.start.fy + d.start.fh / 2;
    const sx = d.corner === 'tr' || d.corner === 'br' ? 1 : -1;
    const sy = d.corner === 'bl' || d.corner === 'br' ? 1 : -1;
    const halfW = clamp(d.start.fw / 2 + sx * dx, MIN_W / 2, Math.min(cx, 1 - cx));
    const halfH = clamp(d.start.fh / 2 + sy * dy, MIN_H / 2, Math.min(cy, 1 - cy));
    onChange({ fx: cx - halfW, fy: cy - halfH, fw: halfW * 2, fh: halfH * 2 });
  };

  const end = (e: React.PointerEvent) => {
    if (!drag.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    drag.current = null;
    onCommit(box);
  };

  const style = {
    left: box.fx * cw,
    top: box.fy * ch,
    width: box.fw * cw,
    height: box.fh * ch,
  };

  return (
    <div
      className="focus-box"
      style={style}
      onPointerDown={startMove}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {CORNERS.map((c) => (
        <span
          key={c}
          className={`focus-corner ${c}`}
          onPointerDown={startResize(c)}
          onPointerMove={onMove}
          onPointerUp={end}
          onPointerCancel={end}
        />
      ))}
    </div>
  );
}
