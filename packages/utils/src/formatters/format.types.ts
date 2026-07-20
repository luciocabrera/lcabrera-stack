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
