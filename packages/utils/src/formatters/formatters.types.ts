export type CurrencyFormatOptions = {
  readonly currency?: string;
  readonly locale?: string;
};

export type DateFormatOptions = {
  readonly locale?: string;
  readonly preset?: DateFormatPreset;
  readonly timeStyle?: DateFormatPreset;
  /**
   * IANA time zone, e.g. `'UTC'`. Omitted means the runtime's own zone, which
   * differs between an SSR server and the browser — the same instant then
   * hydrates as two strings. Pass this whenever both sides render the output.
   */
  readonly timeZone?: string;
};

export type DateFormatPreset = 'full' | 'long' | 'medium' | 'short';

export type NumberFormatOptions = {
  readonly locale?: string;
  readonly maximumFractionDigits?: number;
  readonly minimumFractionDigits?: number;
};
