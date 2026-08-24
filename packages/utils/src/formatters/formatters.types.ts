export type CurrencyFormatOptions = {
  readonly currency?: string;
  readonly locale?: string;
};

export type DateFormatOptions = {
  readonly locale?: string;
  readonly preset?: DateFormatPreset;
  readonly timeStyle?: DateFormatPreset;
  readonly timeZone?: string;
};

export type DateFormatPreset = 'full' | 'long' | 'medium' | 'short';

export type NumberFormatOptions = {
  readonly locale?: string;
  readonly maximumFractionDigits?: number;
  readonly minimumFractionDigits?: number;
};
