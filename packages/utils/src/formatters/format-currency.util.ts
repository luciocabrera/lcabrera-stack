import type { CurrencyFormatOptions } from './formatters.types';

import { DEFAULT_CURRENCY } from './formatters.constants';
import { getDefaultLocale } from './get-default-locale.util';

type FormatCurrencyArgs = CurrencyFormatOptions & {
  readonly value: number;
};

export const formatCurrency = ({
  currency: currencyCode,
  locale,
  value,
}: FormatCurrencyArgs) => {
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
