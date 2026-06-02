// Phone-number parsing, validation and country detection.
// This is the proven logic from the original app, isolated and cleaned up.

import { parsePhoneNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import * as countries from 'i18n-iso-countries';
import englishCountries from 'i18n-iso-countries/langs/en.json';
import type { DetectedNumber } from './types';

countries.registerLocale(englishCountries);

/** Turn an ISO country code ("US") into its flag emoji. */
export function flagEmoji(countryCode: string): string {
  if (!countryCode) return '🌐';
  const points = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
}

/** Default dialing region inferred from the device locale, fallback US. */
function defaultRegion(): CountryCode {
  const fromLocale = navigator.language?.split('-')[1];
  return ((fromLocale || 'US').toUpperCase() as CountryCode);
}

/**
 * Try to extract one valid phone number from a blob of recognized text.
 * Returns null if nothing valid is found. Never throws.
 */
export function parseNumber(text: string): DetectedNumber | null {
  const cleaned = text.replace(/[^\d+]/g, '');
  if (cleaned.length < 7) return null;

  let parsed: ReturnType<typeof parsePhoneNumber> | undefined;

  // Attempt 1: treat it as an international number (prepend + if missing).
  try {
    const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    const candidate = parsePhoneNumber(withPlus);
    if (candidate?.isValid() && candidate.isPossible()) parsed = candidate;
  } catch {
    /* ignore */
  }

  // Attempt 2: treat it as a local number in the device's region.
  if (!parsed) {
    try {
      const candidate = parsePhoneNumber(cleaned, defaultRegion());
      if (candidate?.isValid() && candidate.isPossible()) parsed = candidate;
    } catch {
      /* ignore */
    }
  }

  if (!parsed || !parsed.country) return null;

  const countryCode = parsed.country;
  return {
    id: parsed.number,
    e164: parsed.number,
    formatted: parsed.formatInternational(),
    national: parsed.formatNational(),
    countryCode,
    countryName: countries.getName(countryCode, 'en') || 'Unknown Region',
    flag: flagEmoji(countryCode),
  };
}

/** Rebuild a dialable DetectedNumber from a stored contact/history record. */
export function makeDialable(p: {
  e164: string;
  formatted: string;
  countryName: string;
  flag: string;
}): DetectedNumber {
  return {
    id: p.e164,
    e164: p.e164,
    formatted: p.formatted,
    national: p.formatted,
    countryCode: '',
    countryName: p.countryName,
    flag: p.flag,
  };
}
