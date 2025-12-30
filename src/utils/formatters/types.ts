/**
 * Format option types for table cell formatting
 */

/**
 * Union type for all format options based on data type
 */
export type ColumnFormatOptions =
  | CurrencyFormatOptions
  | DateFormatOptions
  | NumberFormatOptions;

export type CurrencyFormatOptions = {
  /** Currency code (e.g., 'USD', 'EUR', 'GBP') */
  currency?: string;
  /** Locale override (e.g., 'en-US', 'de-DE') */
  locale?: string;
};

export type DateFormatOptions = {
  /** Locale override (e.g., 'en-US', 'de-DE') */
  locale?: string;
  /** Date format preset */
  preset?: DateFormatPreset;
};

export type DateFormatPreset = 'full' | 'long' | 'medium' | 'short';

export type NumberFormatOptions = {
  /** Locale override (e.g., 'en-US', 'de-DE') */
  locale?: string;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
};
