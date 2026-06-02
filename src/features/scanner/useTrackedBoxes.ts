// Smooths the raw per-frame detections into gently-moving AR boxes:
//  - matches boxes across frames by number id
//  - eases each box toward its latest position (no jitter)
//  - lets a box linger briefly after it vanishes (no flicker)
// Result feels stable and "Apple smooth" instead of twitchy.

import { useEffect, useRef, useState } from 'react';
import type { BoundingBox, DetectedNumber, Detection } from '../../lib/types';

const LINGER_MS = 600; // keep a box this long after it stops being seen
const EASE = 0.35; // 0..1, higher = snappier
const SNAP_EPSILON = 0.5; // px; below this we consider the box settled

interface Track {
  info: DetectedNumber;
  box: BoundingBox;
  target: BoundingBox;
  lastSeen: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function ease(box: BoundingBox, target: BoundingBox): BoundingBox {
  const next = {
    left: lerp(box.left, target.left, EASE),
    top: lerp(box.top, target.top, EASE),
    right: lerp(box.right, target.right, EASE),
    bottom: lerp(box.bottom, target.bottom, EASE),
  };
  // Snap when close enough so the loop can go idle.
  if (
    Math.abs(next.left - target.left) < SNAP_EPSILON &&
    Math.abs(next.top - target.top) < SNAP_EPSILON &&
    Math.abs(next.right - target.right) < SNAP_EPSILON &&
    Math.abs(next.bottom - target.bottom) < SNAP_EPSILON
  ) {
    return target;
  }
  return next;
}

export function useTrackedBoxes(detections: Detection[], active: boolean): Detection[] {
  const tracks = useRef<Map<string, Track>>(new Map());
  const [output, setOutput] = useState<Detection[]>([]);

  // Feed the latest detections in as new targets.
  useEffect(() => {
    const now = performance.now();
    for (const d of detections) {
      const existing = tracks.current.get(d.info.id);
      if (existing) {
        existing.target = d.box;
        existing.lastSeen = now;
        existing.info = d.info;
      } else {
        tracks.current.set(d.info.id, {
          info: d.info,
          box: d.box,
          target: d.box,
          lastSeen: now,
        });
      }
    }
  }, [detections]);

  // Animate. Only push new React state when something actually changed.
  useEffect(() => {
    if (!active) return;
    const map = tracks.current;
    let raf = 0;
    let prevSignature = '';

    const loop = () => {
      const now = performance.now();
      for (const [id, t] of map) {
        if (now - t.lastSeen > LINGER_MS) {
          map.delete(id);
          continue;
        }
        t.box = ease(t.box, t.target);
      }

      const list = [...map.values()];
      const signature = list
        .map((t) => `${t.info.id}:${t.box.left | 0},${t.box.top | 0},${t.box.right | 0},${t.box.bottom | 0}`)
        .join('|');
      if (signature !== prevSignature) {
        prevSignature = signature;
        setOutput(list.map((t) => ({ info: t.info, box: { ...t.box } })));
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      map.clear();
      setOutput([]); // clear on deactivate so stale boxes don't flash on resume
    };
  }, [active]);

  return output;
}
