// Settings tab: fully customizable behavior, persisted offline.

import { useSettings } from '../../lib/useStore';
import { ACTION_LABELS } from '../../lib/types';
import type { ActionKind, DefaultAction } from '../../lib/types';

const ALL_ACTIONS: ActionKind[] = ['directCall', 'dialer', 'whatsapp', 'sms'];

// Choices for the default behaviour, including "Just Scan".
const DEFAULT_OPTIONS: { kind: DefaultAction; label: string; hint?: string }[] = [
  { kind: 'none', label: 'Just Scan', hint: 'Only detect & count numbers — never auto-open anything.' },
  { kind: 'directCall', label: 'Call', hint: 'Places the call immediately (asks for call permission once).' },
  { kind: 'dialer', label: 'Dialer', hint: 'Opens the dialer with the number filled in.' },
  { kind: 'whatsapp', label: 'WhatsApp' },
  { kind: 'sms', label: 'Message' },
];

export function SettingsPanel() {
  const [settings, update] = useSettings();

  const toggleSheetAction = (kind: ActionKind) => {
    const has = settings.sheetActions.includes(kind);
    const next = has
      ? settings.sheetActions.filter((a) => a !== kind)
      : [...settings.sheetActions, kind];
    // Keep a stable, sensible order and never allow an empty sheet.
    const ordered = ALL_ACTIONS.filter((a) => next.includes(a));
    update({ sheetActions: ordered.length ? ordered : settings.sheetActions });
  };

  return (
    <div className="panel-body">
      <section className="settings-group">
        <h3>When a number is in the box</h3>
        <p className="settings-hint">
          What happens automatically when a single number is lined up.
        </p>
        <div className="seg-list">
          {DEFAULT_OPTIONS.map(({ kind, label, hint }) => (
            <button
              key={kind}
              className={`seg-row ${settings.defaultAction === kind ? 'active' : ''}`}
              onClick={() => update({ defaultAction: kind })}
            >
              <span className="seg-label">
                <span>{label}</span>
                {hint && <span className="seg-sub">{hint}</span>}
              </span>
              <span className="seg-radio" />
            </button>
          ))}
        </div>
      </section>

      {settings.defaultAction !== 'none' && (
        <section className="settings-group">
          <div className="toggle-row" onClick={() => update({ autoBlast: !settings.autoBlast })}>
            <div>
              <h3>Auto-open single numbers</h3>
              <p className="settings-hint">
                When only one number is in the box, open it instantly. Turn off
                to always tap first.
              </p>
            </div>
            <span className={`switch ${settings.autoBlast ? 'on' : ''}`}>
              <span className="knob" />
            </span>
          </div>
        </section>
      )}

      <section className="settings-group">
        <h3>Buttons in the tap menu</h3>
        <div className="seg-list">
          {ALL_ACTIONS.map((kind) => {
            const on = settings.sheetActions.includes(kind);
            return (
              <button
                key={kind}
                className={`seg-row ${on ? 'active' : ''}`}
                onClick={() => toggleSheetAction(kind)}
              >
                <span>{ACTION_LABELS[kind]}</span>
                <span className={`check ${on ? 'on' : ''}`} />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
