// A single AR overlay box drawn over a detected number. Purely presentational —
// it's positioned with an absolute screen rect computed by the parent.

import type { ScreenRect } from '../../lib/geometry';
import type { DetectedNumber } from '../../lib/types';

interface Props {
  info: DetectedNumber;
  rect: ScreenRect;
  onTap: () => void;
}

export function ArNumberBox({ info, rect, onTap }: Props) {
  return (
    <button
      type="button"
      className="ar-box"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
      onClick={onTap}
    >
      <span className="ar-label">
        <span className="ar-flag">{info.flag}</span>
        <span className="ar-details">
          <span className="ar-country">{info.countryName}</span>
          <span className="ar-number">{info.formatted}</span>
        </span>
      </span>
    </button>
  );
}
