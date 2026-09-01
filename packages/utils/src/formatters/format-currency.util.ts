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

    const normalized = formatted
      .replace(/^-([^\d]+)/, '$1-')
      .replace(/^([^\d-]+)([-\d])/, '$1 $2');

    return normalized;
  } catch {
    return `${currency} ${String(value)}`;
  }
};
