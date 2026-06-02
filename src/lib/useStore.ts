// React hooks over the offline store. Each hook reads on mount and re-reads
// whenever any store value changes (via the in-process 'vibecall:store' event).

import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, Contact, HistoryEntry } from './types';
import {
  addContact,
  clearHistory,
  getContacts,
  getHistory,
  getSettings,
  removeContact,
  setSettings,
  subscribe,
} from './storage';

function useStoreValue<T>(read: () => T): T {
  const [value, setValue] = useState<T>(read);
  useEffect(() => subscribe(() => setValue(read())), [read]);
  return value;
}

export function useSettings() {
  const settings = useStoreValue(getSettings);
  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings({ ...getSettings(), ...patch });
  }, []);
  return [settings, update] as const;
}

export function useHistory() {
  const history = useStoreValue<HistoryEntry[]>(getHistory);
  return { history, clear: clearHistory };
}

export function useContacts() {
  const contacts = useStoreValue<Contact[]>(getContacts);
  return { contacts, add: addContact, remove: removeContact };
}
