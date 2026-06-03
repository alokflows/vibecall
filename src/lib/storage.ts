// Offline, typed persistence on top of localStorage.
// Everything lives on-device; there is no network anywhere in this app.

import { ACTION_LABELS } from './types';
import type { ActionKind, AppSettings, Contact, HistoryEntry } from './types';

const PREFIX = 'vibecall:';
const KEYS = {
  settings: `${PREFIX}settings`,
  contacts: `${PREFIX}contacts`,
  history: `${PREFIX}history`,
  scanbox: `${PREFIX}scanbox`,
} as const;

const HISTORY_LIMIT = 100;

export const DEFAULT_SETTINGS: AppSettings = {
  defaultAction: 'whatsapp',
  autoBlast: true,
  sheetActions: ['directCall', 'dialer', 'whatsapp', 'sms'],
};

/** The resizable scan box, stored as fractions of the screen (0..1). */
export interface ScanBox {
  fx: number;
  fy: number;
  fw: number;
  fh: number;
}

export const DEFAULT_SCANBOX: ScanBox = { fx: 0.07, fy: 0.4, fw: 0.86, fh: 0.18 };

export function getScanBox(): ScanBox {
  return read<ScanBox>(KEYS.scanbox, DEFAULT_SCANBOX);
}

export function setScanBox(box: ScanBox): void {
  write(KEYS.scanbox, box);
}

// --- low level -------------------------------------------------------------

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — fail silently, app keeps working */
  }
  // Notify in-process subscribers (the native 'storage' event only fires
  // across tabs, which we don't have, so we roll our own).
  window.dispatchEvent(new CustomEvent('vibecall:store', { detail: key }));
}

/** Subscribe to any store change. Returns an unsubscribe fn. */
export function subscribe(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener('vibecall:store', handler);
  return () => window.removeEventListener('vibecall:store', handler);
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- settings --------------------------------------------------------------

export function getSettings(): AppSettings {
  const s = read<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
  // Drop actions removed in newer versions so settings saved by an older
  // build can't point at a button that no longer exists.
  const known = (a: ActionKind) => a in ACTION_LABELS;
  const sheetActions = s.sheetActions.filter(known);
  return {
    ...s,
    sheetActions: sheetActions.length ? sheetActions : DEFAULT_SETTINGS.sheetActions,
    defaultAction:
      s.defaultAction === 'none' || known(s.defaultAction)
        ? s.defaultAction
        : DEFAULT_SETTINGS.defaultAction,
  };
}

export function setSettings(next: AppSettings): void {
  write(KEYS.settings, next);
}

// --- history ---------------------------------------------------------------

export function getHistory(): HistoryEntry[] {
  return readArray<HistoryEntry>(KEYS.history);
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'at'>): void {
  const list = getHistory();
  // Collapse consecutive duplicates of the same number+action.
  const deduped = list.filter(
    (h, i) => !(i === 0 && h.e164 === entry.e164 && h.action === entry.action),
  );
  const next: HistoryEntry[] = [
    { ...entry, id: uid(), at: Date.now() },
    ...deduped,
  ].slice(0, HISTORY_LIMIT);
  write(KEYS.history, next);
}

export function clearHistory(): void {
  write(KEYS.history, []);
}

// --- contacts --------------------------------------------------------------

export function getContacts(): Contact[] {
  return readArray<Contact>(KEYS.contacts).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function addContact(contact: Omit<Contact, 'id' | 'savedAt'>): void {
  const list = getContacts().filter((c) => c.e164 !== contact.e164);
  write(KEYS.contacts, [...list, { ...contact, id: uid(), savedAt: Date.now() }]);
}

export function removeContact(id: string): void {
  write(
    KEYS.contacts,
    getContacts().filter((c) => c.id !== id),
  );
}

export function isSaved(e164: string): boolean {
  return getContacts().some((c) => c.e164 === e164);
}
