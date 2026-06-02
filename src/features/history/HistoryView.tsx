// History tab: every number you acted on. Tap a row to repeat that action.

import { Trash2 } from 'lucide-react';
import { useHistory } from '../../lib/useStore';
import { executeAction } from '../../lib/actions';
import { makeDialable } from '../../lib/phone';
import { ACTION_LABELS } from '../../lib/types';
import type { HistoryEntry } from '../../lib/types';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

export function HistoryView() {
  const { history, clear } = useHistory();

  const repeat = (entry: HistoryEntry) => {
    void executeAction(makeDialable(entry), entry.action);
  };

  if (history.length === 0) {
    return <div className="panel-empty">No history yet. Scanned numbers show up here.</div>;
  }

  return (
    <div className="panel-body">
      <button className="panel-clear" onClick={clear}>
        <Trash2 size={15} />
        <span>Clear history</span>
      </button>
      <div className="row-list">
        {history.map((entry) => (
          <button key={entry.id} className="data-row" onClick={() => repeat(entry)}>
            <span className="row-flag">{entry.flag}</span>
            <span className="row-main">
              <span className="row-number">{entry.formatted}</span>
              <span className="row-sub">
                {ACTION_LABELS[entry.action]} · {timeAgo(entry.at)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
