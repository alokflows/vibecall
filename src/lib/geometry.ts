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

/** Inverse of mapBoxToScreen: a rect in container/screen px -> video px. */
export function screenRectToVideo(rect: ScreenRect, { vw, vh, cw, ch }: Layout): BoundingBox | null {
  if (!vw || !vh || !cw || !ch) return null;
  const scale = Math.max(cw / vw, ch / vh);
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const offsetX = (cw - vw * scale) / 2;
  const offsetY = (ch - vh * scale) / 2;
  return {
    left: (rect.left - offsetX) / scale,
    top: (rect.top - offsetY) / scale,
    right: (rect.left + rect.width - offsetX) / scale,
    bottom: (rect.top + rect.height - offsetY) / scale,
  };
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
