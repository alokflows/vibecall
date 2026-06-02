// Maps a box in VIDEO pixel space to on-screen CSS pixels, accounting for
// `object-fit: cover` scaling and centering. Pure: takes plain dimensions so
// it can be called safely during render without reading refs.

import type { BoundingBox } from './types';

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Layout {
  /** intrinsic video dimensions */
  vw: number;
  vh: number;
  /** rendered container dimensions */
  cw: number;
  ch: number;
}

export function mapBoxToScreen(box: BoundingBox, { vw, vh, cw, ch }: Layout): ScreenRect | null {
  if (!vw || !vh || !cw || !ch) return null;

  const scale = Math.max(cw / vw, ch / vh);
  if (!Number.isFinite(scale) || scale <= 0) return null;

  const renderedW = vw * scale;
  const renderedH = vh * scale;
  const offsetX = (cw - renderedW) / 2;
  const offsetY = (ch - renderedH) / 2;

  return {
    left: box.left * scale + offsetX,
    top: box.top * scale + offsetY,
    width: (box.right - box.left) * scale,
    height: (box.bottom - box.top) * scale,
  };
}
