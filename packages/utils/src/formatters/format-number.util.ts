import type { NumberFormatOptions } from './formatters.types';

import { getDefaultLocale } from './get-default-locale.util';

type FormatNumberArgs = NumberFormatOptions & {
  readonly value: number;
};

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
