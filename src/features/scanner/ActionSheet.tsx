// Bottom sheet shown when you tap a detected number: pick an action, or save.

import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { executeAction } from '../../lib/actions';
import { addContact, getContacts, isSaved, removeContact } from '../../lib/storage';
import type { ActionKind, DetectedNumber } from '../../lib/types';

interface ActionMeta {
  label: string;
  icon: ComponentType<{ size?: number; fill?: string }>;
  className: string;
}

const ACTION_META: Record<ActionKind, ActionMeta> = {
  dialer: { label: 'Call', icon: Phone, className: 'act-call' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, className: 'act-wa' },
  whatsappCall: { label: 'WA Call', icon: PhoneCall, className: 'act-wacall' },
  sms: { label: 'Message', icon: MessageSquare, className: 'act-sms' },
};

interface ContentProps {
  number: DetectedNumber;
  actions: ActionKind[];
  onClose: () => void;
}

// Keyed by number id so each newly-tapped number gets fresh local state
// (saved/naming) without syncing props to state in an effect.
function SheetContent({ number, actions, onClose }: ContentProps) {
  const [saved, setSaved] = useState(() => isSaved(number.e164));
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const fire = (kind: ActionKind) => {
    void executeAction(number, kind);
    onClose();
  };

  const toggleSave = () => {
    if (saved) {
      const existing = getContacts().find((c) => c.e164 === number.e164);
      if (existing) removeContact(existing.id);
      setSaved(false);
    } else {
      setNaming(true);
    }
  };

  const confirmSave = () => {
    addContact({
      name: name.trim() || number.formatted,
      e164: number.e164,
      formatted: number.formatted,
      countryName: number.countryName,
      flag: number.flag,
    });
    setSaved(true);
    setNaming(false);
  };

  return (
    <>
      <div className="sheet-flag-bg">{number.flag}</div>
      <button className="sheet-close" onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>

      <div className="sheet-country">
        <span className="flag">{number.flag}</span>
        <span>{number.countryName}</span>
      </div>
      <div className="sheet-number">{number.formatted}</div>

      <div className="sheet-actions">
        {actions.map((kind) => {
          const meta = ACTION_META[kind];
          const Icon = meta.icon;
          return (
            <button
              key={kind}
              className={`action-btn ${meta.className}`}
              onClick={() => fire(kind)}
            >
              <span className="icon-wrapper">
                <Icon size={20} fill="currentColor" />
              </span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {naming ? (
        <div className="save-row">
          <input
            className="save-input"
            placeholder="Name this contact"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
          />
          <button className="save-confirm" onClick={confirmSave}>
            Save
          </button>
        </div>
      ) : (
        <button className={`save-toggle ${saved ? 'is-saved' : ''}`} onClick={toggleSave}>
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          <span>{saved ? 'Saved' : 'Save contact'}</span>
        </button>
      )}
    </>
  );
}

interface Props {
  number: DetectedNumber | null;
  actions: ActionKind[];
  onClose: () => void;
}

export function ActionSheet({ number, actions, onClose }: Props) {
  return (
    <div className={`sheet-scrim ${number ? 'visible' : ''}`} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {number && (
          <SheetContent
            key={number.id}
            number={number}
            actions={actions}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
