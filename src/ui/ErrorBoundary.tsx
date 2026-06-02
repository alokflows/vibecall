// Catches any render/runtime crash and shows a friendly recovery card
// instead of a blank white screen (the original app's worst failure mode).

import { Component } from 'react';
import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Keep a breadcrumb in the console; no network logging (fully offline).
    console.error('Vibe Call crashed:', error);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="crash-screen">
          <div className="crash-card">
            <div className="crash-emoji">😵‍💫</div>
            <h2>Something hiccupped</h2>
            <p>The scanner ran into a snag. Tap below to restart it.</p>
            <button className="crash-btn" onClick={this.reset}>
              <RotateCcw size={18} />
              <span>Restart scanner</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
