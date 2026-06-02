// The home screen: live camera, AR boxes over every detected number, the tap
// action sheet, and "auto-blast" for the single-number fast path.

import { useEffect, useRef, useState } from 'react';
import { CameraOff, ScanLine } from 'lucide-react';
import { useCamera } from './useCamera';
import { useScanner } from './useScanner';
import { useTrackedBoxes } from './useTrackedBoxes';
import { ArNumberBox } from './ArNumberBox';
import { ActionSheet } from './ActionSheet';
import { mapBoxToScreen } from '../../lib/geometry';
import type { Layout } from '../../lib/geometry';
import { executeAction } from '../../lib/actions';
import { useSettings } from '../../lib/useStore';
import type { DetectedNumber } from '../../lib/types';

const REFIRE_MS = 8000; // don't auto-blast the same number again this soon

interface Props {
  paused: boolean;
}

export function ScannerView({ paused }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { videoRef, status } = useCamera();
  const [settings] = useSettings();
  const [selected, setSelected] = useState<DetectedNumber | null>(null);
  const [layout, setLayout] = useState<Layout>({ vw: 0, vh: 0, cw: 0, ch: 0 });
  const lastFired = useRef<{ id: string; at: number }>({ id: '', at: 0 });

  const active = status === 'ready' && !selected && !paused;
  const raw = useScanner(videoRef, active);
  const tracked = useTrackedBoxes(raw, active);

  // Track the container size in state (no ref reads during render).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setLayout((l) => ({ ...l, cw: el.clientWidth, ch: el.clientHeight }));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onVideoReady = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setLayout((l) => ({ ...l, vw: v.videoWidth, vh: v.videoHeight }));
  };

  // Auto-blast: exactly one number in view → fire the default action once.
  useEffect(() => {
    if (!active || !settings.autoBlast || tracked.length !== 1) return;
    const target = tracked[0].info;
    const now = Date.now();
    if (lastFired.current.id === target.id && now - lastFired.current.at < REFIRE_MS) {
      return;
    }
    lastFired.current = { id: target.id, at: now };
    void executeAction(target, settings.defaultAction);
  }, [tracked, active, settings.autoBlast, settings.defaultAction]);

  const blurred = !!selected || paused;

  return (
    <div className="scanner" ref={containerRef}>
      <div className={`camera ${blurred ? 'is-blurred' : ''}`}>
        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          playsInline
          muted
          controls={false}
          onLoadedMetadata={onVideoReady}
          onResize={onVideoReady}
        />

        {active &&
          tracked.map((d) => {
            const rect = mapBoxToScreen(d.box, layout);
            if (!rect) return null;
            return (
              <ArNumberBox
                key={d.info.id}
                info={d.info}
                rect={rect}
                onTap={() => setSelected(d.info)}
              />
            );
          })}
      </div>

      {status === 'loading' && (
        <div className="scanner-status">
          <ScanLine className="spin-soft" size={28} />
          <span>Starting camera…</span>
        </div>
      )}

      {status === 'denied' && (
        <div className="scanner-status">
          <CameraOff size={28} />
          <span>Camera access is needed to scan numbers.</span>
        </div>
      )}

      {status === 'ready' && active && tracked.length === 0 && (
        <div className="scanner-hint">Point at a phone number</div>
      )}

      <ActionSheet
        number={selected}
        actions={settings.sheetActions}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
