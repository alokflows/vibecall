// Shared types for Vibe Call. Kept tiny and dependency-free on purpose.

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A validated phone number detected in the camera frame. */
export interface DetectedNumber {
  /** Stable key for tracking/dedupe (the E.164 string). */
  id: string;
  /** Raw E.164 number used for dialing, e.g. "+14155552671". */
  e164: string;
  /** Pretty international form, e.g. "+1 415 555 2671". */
  formatted: string;
  /** National form, e.g. "(415) 555-2671". */
  national: string;
  /** ISO country code, e.g. "US". */
  countryCode: string;
  /** Human country name, e.g. "United States". */
  countryName: string;
  /** Flag emoji for the country. */
  flag: string;
}

/** A detection plus where it sits, in VIDEO pixel coordinates. */
export interface Detection {
  info: DetectedNumber;
  box: BoundingBox;
}

export type ActionKind = 'directCall' | 'dialer' | 'whatsapp' | 'sms';

/** The default behaviour; 'none' = Just Scan (detect & count, never auto-open). */
export type DefaultAction = ActionKind | 'none';

export interface AppSettings {
  /** What auto-blast fires for a single number; 'none' = Just Scan. */
  defaultAction: DefaultAction;
  /** When exactly one number is in view, fire defaultAction automatically. */
  autoBlast: boolean;
  /** Which actions appear in the tap sheet. */
  sheetActions: ActionKind[];
}

export interface Contact {
  id: string;
  name: string;
  e164: string;
  formatted: string;
  countryName: string;
  flag: string;
  savedAt: number;
}

export interface HistoryEntry {
  id: string;
  e164: string;
  formatted: string;
  countryName: string;
  flag: string;
  action: ActionKind;
  at: number;
}

export const ACTION_LABELS: Record<ActionKind, string> = {
  directCall: 'Call',
  dialer: 'Dialer',
  whatsapp: 'WhatsApp',
  sms: 'Message',
};
