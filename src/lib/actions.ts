// Launching native apps (dialer, WhatsApp, SMS) reliably from the webview.
// Uses Capacitor's AppLauncher, with a window.open fallback for the browser.

import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { ActionKind, DetectedNumber } from './types';
import { addHistory } from './storage';

// Native plugin (android/app/src/main/java/.../DirectCallPlugin.java) that
// places a call immediately via ACTION_CALL, requesting CALL_PHONE if needed.
interface DirectCallPlugin {
  call(options: { number: string }): Promise<void>;
}
const DirectCall = registerPlugin<DirectCallPlugin>('DirectCall');

/** Digits only, no '+', for schemes like wa.me that want a bare number. */
function digits(e164: string): string {
  return e164.replace(/[^\d]/g, '');
}

function urlFor(kind: ActionKind, e164: string): string {
  const d = digits(e164);
  switch (kind) {
    case 'directCall': // handled natively before this; tel: is the web fallback
    case 'dialer':
      return `tel:${e164}`;
    case 'sms':
      return `sms:${e164}`;
    case 'whatsapp':
      return `https://wa.me/${d}`;
    case 'whatsappCall':
      // Best effort: WhatsApp has no documented direct-call deep link.
      // We try the call scheme and fall back to the chat below.
      return `whatsapp://call?phone=${d}`;
  }
}

async function open(url: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { completed } = await AppLauncher.openUrl({ url });
      return completed;
    } catch {
      return false;
    }
  }
  // Browser fallback (mainly for dev/verification).
  try {
    window.open(url, '_system');
    return true;
  } catch {
    return false;
  }
}

/**
 * Fire an action against a number and record it in history.
 * Returns true if a native app was launched.
 */
export async function executeAction(
  number: DetectedNumber,
  kind: ActionKind,
): Promise<boolean> {
  // Direct call: place the call straight away through the native plugin.
  if (kind === 'directCall') {
    let launched = false;
    if (Capacitor.isNativePlatform()) {
      try {
        await DirectCall.call({ number: number.e164 });
        launched = true;
      } catch {
        launched = false;
      }
    }
    // Fall back to the dialer (web, or if permission was denied).
    if (!launched) launched = await open(`tel:${number.e164}`);
    recordHistory(number, kind);
    return launched;
  }

  let launched = await open(urlFor(kind, number.e164));

  // WhatsApp call has no stable scheme — fall back to opening the chat.
  if (!launched && kind === 'whatsappCall') {
    launched = await open(`https://wa.me/${digits(number.e164)}`);
  }

  recordHistory(number, kind);
  return launched;
}

function recordHistory(number: DetectedNumber, kind: ActionKind): void {
  addHistory({
    e164: number.e164,
    formatted: number.formatted,
    countryName: number.countryName,
    flag: number.flag,
    action: kind,
  });
}
