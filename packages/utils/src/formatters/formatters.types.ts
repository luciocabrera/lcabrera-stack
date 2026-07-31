export type CurrencyFormatOptions = {
  /** Currency code (e.g., 'USD', 'EUR', 'GBP') */
  readonly currency?: string;
  /** Locale override (e.g., 'en-US', 'de-DE') */
  readonly locale?: string;
};

export type DateFormatOptions = {
  /** Locale override (e.g., 'en-US', 'de-DE') */
  readonly locale?: string;
  /** Date format preset */
  readonly preset?: DateFormatPreset;
  /** Time-of-day style. Omit for a date-only result. */
  readonly timeStyle?: DateFormatPreset;
  /**
   * IANA time zone, e.g. `'UTC'`. Omitted means the runtime's own zone — which
   * differs between an SSR server and the browser, so the same instant renders
   * as two different strings and React reports a hydration mismatch. Pass this
   * whenever the output is rendered on both sides.
   */
  readonly timeZone?: string;
};

export type DateFormatPreset = 'full' | 'long' | 'medium' | 'short';

export type NumberFormatOptions = {
  /** Locale override (e.g., 'en-US', 'de-DE') */
  readonly locale?: string;
  /** Maximum fraction digits */
  readonly maximumFractionDigits?: number;
  /** Minimum fraction digits */
  readonly minimumFractionDigits?: number;
};
