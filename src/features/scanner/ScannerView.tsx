// The home screen: live camera, a resizable scan box, AR boxes over detected
// numbers, the tap action sheet, and "auto-blast" for the single-number path.

import { useEffect, useRef, useState } from 'react';
import { CameraOff } from 'lucide-react';
import { useCamera } from './useCamera';
import { useScanner } from './useScanner';
import { useTrackedBoxes } from './useTrackedBoxes';
import { ArNumberBox } from './ArNumberBox';
import { ActionSheet } from './ActionSheet';
import { FocusBox } from './FocusBox';
import { mapBoxToScreen, screenRectToVideo } from '../../lib/geometry';
import type { Layout } from '../../lib/geometry';
import { executeAction } from '../../lib/actions';
import { getScanBox, setScanBox } from '../../lib/storage';
import type { ScanBox } from '../../lib/storage';
import { useSettings } from '../../lib/useStore';
import type { BoundingBox, DetectedNumber } from '../../lib/types';

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
  const [box, setBox] = useState<ScanBox>(getScanBox);
  const focusRef = useRef<BoundingBox | null>(null);
  const lastFired = useRef<{ id: string; at: number }>({ id: '', at: 0 });

  const active = status === 'ready' && !selected && !paused;
  const raw = useScanner(videoRef, active, focusRef);
  const tracked = useTrackedBoxes(raw, active);

  // Keep the scan region (in video px) in sync with the box + layout.
  useEffect(() => {
    focusRef.current = screenRectToVideo(
      { left: box.fx * layout.cw, top: box.fy * layout.ch, width: box.fw * layout.cw, height: box.fh * layout.ch },
      layout,
    );
  }, [box, layout]);

  // Track the container size in state (no ref reads during render).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setLayout((l) => ({ ...l, cw: el.clientWidth, ch: el.clientHeight }));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onVideoReady = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setLayout((l) => ({ ...l, vw: v.videoWidth, vh: v.videoHeight }));
  };

  // Auto-blast: exactly one number in the box → fire the default action once.
  // Skipped in "Just Scan" mode (defaultAction === 'none').
  useEffect(() => {
    const action = settings.defaultAction;
    if (!active || !settings.autoBlast || action === 'none' || tracked.length !== 1) return;
    const target = tracked[0].info;
    const now = Date.now();
    if (lastFired.current.id === target.id && now - lastFired.current.at < REFIRE_MS) {
      return;
    }
    lastFired.current = { id: target.id, at: now };
    void executeAction(target, action);
  }, [tracked, active, settings.autoBlast, settings.defaultAction]);

  const blurred = !!selected || paused;

  // Group detected numbers by country for the live count pill.
  const byCountry = new Map<string, { flag: string; count: number }>();
  for (const d of tracked) {
    const key = d.info.countryCode || d.info.countryName;
    const entry = byCountry.get(key);
    if (entry) entry.count += 1;
    else byCountry.set(key, { flag: d.info.flag, count: 1 });
  }
  const summary = [...byCountry.values()];

  return (
    <div className="scanner" ref={containerRef}>
      <div className={`camera ${blurred ? 'is-blurred' : ''}`}>
        <video
          ref={videoRef}
          className={`video-feed ${status === 'ready' ? 'is-live' : ''}`}
          autoPlay
          playsInline
          muted
          controls={false}
          onLoadedMetadata={onVideoReady}
          onResize={onVideoReady}
        />

        {active && (
          <FocusBox
            box={box}
            cw={layout.cw}
            ch={layout.ch}
            onChange={setBox}
            onCommit={setScanBox}
          />
        )}

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
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
          <span>Starting camera…</span>
        </div>
      )}

      {status === 'denied' && (
        <div className="scanner-status">
          <CameraOff size={28} />
          <span>Camera access is needed to scan numbers.</span>
        </div>
      )}

      {status === 'ready' && active && (
        tracked.length === 0 ? (
          <div className="scanner-hint">Line a number up inside the box</div>
        ) : (
          <div className="count-pill">
            <span className="count-total">
              {tracked.length} number{tracked.length > 1 ? 's' : ''}
            </span>
            <span className="count-chips">
              {summary.map((s, i) => (
                <span key={i} className="count-chip">
                  <span className="count-flag">{s.flag}</span>
                  {s.count}
                </span>
              ))}
            </span>
          </div>
        )
      )}

      <ActionSheet
        number={selected}
        actions={settings.sheetActions}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
