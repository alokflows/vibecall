// Launching native apps (dialer, WhatsApp, SMS) reliably from the webview.
// Uses Capacitor's AppLauncher, with a window.open fallback for the browser.

import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import type { ActionKind, DetectedNumber } from './types';
import { addHistory } from './storage';

/** Digits only, no '+', for schemes like wa.me that want a bare number. */
function digits(e164: string): string {
  return e164.replace(/[^\d]/g, '');
}

function urlFor(kind: ActionKind, e164: string): string {
  const d = digits(e164);
  switch (kind) {
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
  let launched = await open(urlFor(kind, number.e164));

  // WhatsApp call has no stable scheme — fall back to opening the chat.
  if (!launched && kind === 'whatsappCall') {
    launched = await open(`https://wa.me/${digits(number.e164)}`);
  }

  addHistory({
    e164: number.e164,
    formatted: number.formatted,
    countryName: number.countryName,
    flag: number.flag,
    action: kind,
  });

  return launched;
}
