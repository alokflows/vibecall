// The resizable scan box. Only what's inside it gets scanned. Drag the box to
// move it; pull the bottom-right handle to resize. Stored as screen fractions
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

type Mode = 'move' | 'resize';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function FocusBox({ box, cw, ch, onChange, onCommit }: Props) {
  const drag = useRef<{ mode: Mode; px: number; py: number; start: ScanBox } | null>(null);

  const start = (mode: Mode, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, px: e.clientX, py: e.clientY, start: box };
  };
  const onDownMove = (e: React.PointerEvent) => start('move', e);
  const onDownResize = (e: React.PointerEvent) => start('resize', e);

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !cw || !ch) return;
    const dxFrac = (e.clientX - d.px) / cw;
    const dyFrac = (e.clientY - d.py) / ch;

    if (d.mode === 'move') {
      onChange({
        ...d.start,
        fx: clamp(d.start.fx + dxFrac, 0, 1 - d.start.fw),
        fy: clamp(d.start.fy + dyFrac, 0, 1 - d.start.fh),
      });
    } else {
      onChange({
        ...d.start,
        fw: clamp(d.start.fw + dxFrac, MIN_W, 1 - d.start.fx),
        fh: clamp(d.start.fh + dyFrac, MIN_H, 1 - d.start.fy),
      });
    }
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
      onPointerDown={onDownMove}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span className="focus-corner tl" />
      <span className="focus-corner tr" />
      <span className="focus-corner bl" />
      <span className="focus-scan-line" />
      <span
        className="focus-handle"
        onPointerDown={onDownResize}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerCancel={end}
      />
    </div>
  );
}
