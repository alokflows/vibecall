import { useState } from 'react';
import { Bookmark, Clock, Settings as Gear, SlidersHorizontal, X } from 'lucide-react';
import { ScannerView } from './features/scanner/ScannerView';
import { SettingsPanel } from './features/settings/SettingsPanel';
import { HistoryView } from './features/history/HistoryView';
import { ContactsView } from './features/contacts/ContactsView';

type Tab = 'settings' | 'history' | 'contacts';

const TABS: { id: Tab; label: string; icon: typeof Gear }[] = [
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'contacts', label: 'Saved', icon: Bookmark },
];

export default function App() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('settings');

  return (
    <div className="app">
      <ScannerView paused={panelOpen} />

      <header className="top-bar">
        <span className="brand">Vibe Call</span>
        <button className="glass-btn" onClick={() => setPanelOpen(true)} aria-label="Open menu">
          <Gear size={20} />
        </button>
      </header>

      <div className={`panel-scrim ${panelOpen ? 'visible' : ''}`} onClick={() => setPanelOpen(false)}>
        <div className="panel" onClick={(e) => e.stopPropagation()}>
          <div className="panel-grabber" />
          <div className="panel-head">
            <div className="panel-tabs">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`panel-tab ${tab === id ? 'active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button className="panel-close" onClick={() => setPanelOpen(false)} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {tab === 'settings' && <SettingsPanel />}
          {tab === 'history' && <HistoryView />}
          {tab === 'contacts' && <ContactsView />}
        </div>
      </div>
    </div>
  );
}
