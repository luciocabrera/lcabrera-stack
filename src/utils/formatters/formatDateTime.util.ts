import type { DateFormatOptions } from '../../types/format.types';

import { DEFAULT_DATE_PRESET } from './formatters.constants';
import { getDefaultLocale } from './getDefaultLocale.util';
import { parseDate } from './parseDate.util';

type FormatDateTimeArgs = DateFormatOptions & {
  value: unknown;
};

/**
 * Format a datetime value using Intl.DateTimeFormat with locale support
 * Includes both date and time
 * @param args - The value and formatting options
 * @returns Formatted datetime string
 */
export const formatDateTime = ({
  locale,
  preset: presetOption,
  value,
}: FormatDateTimeArgs): string => {
  const date = parseDate(value);

  if (!date) {
    return typeof value === 'string' ? value : '';
  }

  const resolvedLocale = locale ?? getDefaultLocale();
  const preset = presetOption ?? DEFAULT_DATE_PRESET;

  try {
    return new Intl.DateTimeFormat(resolvedLocale, {
      dateStyle: preset,
      timeStyle: preset,
    }).format(date);
  } catch {
    // Fallback to locale string if Intl fails
    return date.toLocaleString();
  }
};
