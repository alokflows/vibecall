// Saved tab: the app's own offline contact list (separate from phone contacts).

import { MessageCircle, Phone, Trash2 } from 'lucide-react';
import { useContacts } from '../../lib/useStore';
import { executeAction } from '../../lib/actions';
import { makeDialable } from '../../lib/phone';
import type { Contact } from '../../lib/types';

export function ContactsView() {
  const { contacts, remove } = useContacts();

  const act = (contact: Contact, kind: 'dialer' | 'whatsapp') => {
    void executeAction(makeDialable(contact), kind);
  };

  if (contacts.length === 0) {
    return (
      <div className="panel-empty">
        No saved contacts yet. Tap a scanned number and choose “Save”.
      </div>
    );
  }

  return (
    <div className="panel-body">
      <div className="row-list">
        {contacts.map((c) => (
          <div key={c.id} className="data-row contact-row">
            <span className="row-flag">{c.flag}</span>
            <span className="row-main">
              <span className="row-number">{c.name}</span>
              <span className="row-sub">{c.formatted}</span>
            </span>
            <span className="row-actions">
              <button className="mini-btn call" onClick={() => act(c, 'dialer')} aria-label="Call">
                <Phone size={16} fill="currentColor" />
              </button>
              <button className="mini-btn wa" onClick={() => act(c, 'whatsapp')} aria-label="WhatsApp">
                <MessageCircle size={16} fill="currentColor" />
              </button>
              <button className="mini-btn del" onClick={() => remove(c.id)} aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
