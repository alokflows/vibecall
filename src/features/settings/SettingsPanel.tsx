// Settings tab: fully customizable behavior, persisted offline.

import { useSettings } from '../../lib/useStore';
import { ACTION_LABELS } from '../../lib/types';
import type { ActionKind } from '../../lib/types';

const ALL_ACTIONS: ActionKind[] = ['dialer', 'whatsapp', 'whatsappCall', 'sms'];

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
        <h3>Default action</h3>
        <p className="settings-hint">
          Used when a number auto-opens, and highlighted in the tap menu.
        </p>
        <div className="seg-list">
          {ALL_ACTIONS.map((kind) => (
            <button
              key={kind}
              className={`seg-row ${settings.defaultAction === kind ? 'active' : ''}`}
              onClick={() => update({ defaultAction: kind })}
            >
              <span>{ACTION_LABELS[kind]}</span>
              <span className="seg-radio" />
            </button>
          ))}
        </div>
        {settings.defaultAction === 'whatsappCall' && (
          <p className="settings-note">
            WhatsApp has no direct-call link, so this opens the chat (one tap to
            call) on some phones.
          </p>
        )}
      </section>

      <section className="settings-group">
        <div className="toggle-row" onClick={() => update({ autoBlast: !settings.autoBlast })}>
          <div>
            <h3>Auto-open single numbers</h3>
            <p className="settings-hint">
              When only one number is in view, open it instantly.
            </p>
          </div>
          <span className={`switch ${settings.autoBlast ? 'on' : ''}`}>
            <span className="knob" />
          </span>
        </div>
      </section>

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
