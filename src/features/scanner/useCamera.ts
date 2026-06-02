// Owns the camera stream: start/stop, lifecycle (pause on background), and
// an explicit status so the UI never shows a blank screen while loading.

import { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

export type CameraStatus = 'loading' | 'ready' | 'denied';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (streamRef.current) return; // already running
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Force playback so the webview never shows its native play overlay.
          videoRef.current.play().catch(() => {});
        }

        // Continuous autofocus where supported (best-effort, never fatal).
        try {
          const track = stream.getVideoTracks()[0];
          const caps = track.getCapabilities() as MediaTrackCapabilities & {
            focusMode?: string[];
          };
          if (caps.focusMode?.includes('continuous')) {
            await track.applyConstraints({
              advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
            });
          }
        } catch {
          /* focus is optional */
        }

        setStatus('ready');
      } catch (err) {
        console.error('Camera unavailable:', err);
        if (!cancelled) setStatus('denied');
      }
    };

    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    start();

    // Release the camera when the app is backgrounded; resume on return.
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        setStatus('loading');
        start();
      } else {
        stop();
      }
    });

    return () => {
      cancelled = true;
      stop();
      listener.then((l) => l.remove());
    };
  }, []);

  return { videoRef, status };
}
