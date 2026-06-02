// The OCR loop: grab a frame, run on-device ML Kit text recognition, group
// text into lines, and parse out every valid phone number across the frame.
// Coordinates are returned in VIDEO pixel space.

import { useEffect, useRef, useState } from 'react';
import { CapacitorPluginMlKitTextRecognition } from '@pantrist/capacitor-plugin-ml-kit-text-recognition';
import { parseNumber } from '../../lib/phone';
import type { BoundingBox, Detection } from '../../lib/types';

const MAX_WIDTH = 1080; // downscale frames before OCR for speed
const INTERVAL_MS = 400; // throttle scans
const ROW_TOLERANCE = 40; // px gap that still counts as the same text row

interface MlLine {
  text: string;
  boundingBox: BoundingBox;
}

/** Group recognized lines into number candidates and parse them. */
function extractDetections(blocks: { lines: MlLine[] }[], scaleDown: number): Detection[] {
  // Flatten and map every line's box from canvas px back to video px.
  const lines: MlLine[] = [];
  for (const block of blocks) {
    for (const line of block.lines) {
      lines.push({
        text: line.text,
        boundingBox: {
          left: line.boundingBox.left / scaleDown,
          top: line.boundingBox.top / scaleDown,
          right: line.boundingBox.right / scaleDown,
          bottom: line.boundingBox.bottom / scaleDown,
        },
      });
    }
  }

  // Group lines that sit on roughly the same row (a number may wrap/space out).
  lines.sort((a, b) => a.boundingBox.top - b.boundingBox.top);
  const groups: MlLine[][] = [];
  let current: MlLine[] = [];
  for (const line of lines) {
    if (current.length === 0) {
      current.push(line);
      continue;
    }
    const avgTop =
      current.reduce((s, l) => s + l.boundingBox.top, 0) / current.length;
    if (Math.abs(line.boundingBox.top - avgTop) < ROW_TOLERANCE) {
      current.push(line);
    } else {
      groups.push(current);
      current = [line];
    }
  }
  if (current.length) groups.push(current);

  const detections: Detection[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    group.sort((a, b) => a.boundingBox.left - b.boundingBox.left);
    const text = group.map((l) => l.text).join(' ');
    const info = parseNumber(text);
    if (!info || seen.has(info.id)) continue;
    seen.add(info.id);

    detections.push({
      info,
      box: {
        left: Math.min(...group.map((l) => l.boundingBox.left)),
        top: Math.min(...group.map((l) => l.boundingBox.top)),
        right: Math.max(...group.map((l) => l.boundingBox.right)),
        bottom: Math.max(...group.map((l) => l.boundingBox.bottom)),
      },
    });
  }
  return detections;
}

export function useScanner(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
): Detection[] {
  const [detections, setDetections] = useState<Detection[]>([]);
  const processingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || processingRef.current) return;
      if (!video.videoWidth || !video.videoHeight) return;

      processingRef.current = true;
      try {
        const scaleDown = Math.min(1, MAX_WIDTH / video.videoWidth);
        if (!Number.isFinite(scaleDown) || scaleDown <= 0) return;

        canvas.width = Math.floor(video.videoWidth * scaleDown);
        canvas.height = Math.floor(video.videoHeight * scaleDown);
        if (canvas.width <= 0 || canvas.height <= 0) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        const result = await CapacitorPluginMlKitTextRecognition.detectText({
          base64Image,
        });

        if (cancelled) return;
        setDetections(extractDetections(result.blocks ?? [], scaleDown));
      } catch (err) {
        // On unsupported platforms (e.g. browser preview) the plugin rejects;
        // swallow it so the app keeps running with no detections.
        console.debug('OCR skipped:', err);
      } finally {
        processingRef.current = false;
      }
    };

    const id = window.setInterval(tick, INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      setDetections([]); // reset on deactivate/unmount (in cleanup, not body)
    };
  }, [active, videoRef]);

  return detections;
}
