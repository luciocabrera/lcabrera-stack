import type { CurrencyFormatOptions } from '../../types/format.types.ts';

import { DEFAULT_CURRENCY } from './formatters.constants.ts';
import { getDefaultLocale } from './getDefaultLocale.util.ts';

type FormatCurrencyArgs = CurrencyFormatOptions & {
  readonly value: number;
};

/**
 * Format a numeric value as currency using Intl.NumberFormat
 * @param args - The value and currency formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = ({
  currency: currencyCode,
  locale,
  value,
}: FormatCurrencyArgs): string => {
  const resolvedLocale = locale ?? getDefaultLocale();
  const currency = currencyCode ?? DEFAULT_CURRENCY;

  try {
    const formatted = new Intl.NumberFormat(resolvedLocale, {
      currency,
      style: 'currency',
    }).format(value);

    // Normalize format: move minus sign after currency symbol with space
    // -US$29,032.37 → US$ -29,032.37
    // US$29,032.37 → US$ 29,032.37
    const normalized = formatted
      .replace(/^-([^\d]+)/, '$1-') // Move minus after symbol: -US$ → US$-
      .replace(/^([^\d-]+)([-\d])/, '$1 $2'); // Add space: US$-123 → US$ -123

    return normalized;
  } catch {
    // Fallback to basic formatting if Intl fails
    return `${currency} ${String(value)}`;
  }
};
