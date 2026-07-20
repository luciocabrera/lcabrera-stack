import type { NumberFormatOptions } from './format.types';

import { getDefaultLocale } from './get-default-locale.util';

type FormatNumberArgs = NumberFormatOptions & {
  readonly value: number;
};

/**
 * Format a number value using Intl.NumberFormat with locale support
 * @param args - The value and formatting options
 * @returns Formatted number string
 */
export const formatNumber = ({
  locale,
  maximumFractionDigits,
  minimumFractionDigits,
  value,
}: FormatNumberArgs) => {
  const resolvedLocale = locale ?? getDefaultLocale();

  const formatOptions: Intl.NumberFormatOptions = {};

  if (minimumFractionDigits !== undefined) {
    formatOptions.minimumFractionDigits = minimumFractionDigits;
  }

  if (maximumFractionDigits !== undefined) {
    formatOptions.maximumFractionDigits = maximumFractionDigits;
  }

  try {
    return new Intl.NumberFormat(resolvedLocale, formatOptions).format(value);
  } catch {
    // Fallback to basic string conversion if Intl fails
    return String(value);
  }
};
