import type { DateFormatOptions } from '../../types/format.types.ts';

import { DEFAULT_DATE_PRESET } from './formatters.constants.ts';
import { getDateTimeFormatOptions } from './getDateTimeFormatOptions.util.ts';
import { getDefaultLocale } from './getDefaultLocale.util.ts';
import { parseDate } from './parseDate.util.ts';

type FormatDateArgs = DateFormatOptions & {
  readonly value: unknown;
};

/**
 * Format a date value using Intl.DateTimeFormat with locale support
 * @param args - The value and formatting options
 * @returns Formatted date string
 */
export const formatDate = ({
  locale,
  preset: presetOption,
  value,
}: FormatDateArgs): string => {
  const date = parseDate(value);

  if (!date) {
    return typeof value === 'string' ? value : '';
  }

  const resolvedLocale = locale ?? getDefaultLocale();
  const preset = presetOption ?? DEFAULT_DATE_PRESET;

  try {
    const formatOptions = getDateTimeFormatOptions(preset);
    return new Intl.DateTimeFormat(resolvedLocale, formatOptions).format(date);
  } catch {
    // Fallback to ISO string if Intl fails
    return date.toLocaleDateString();
  }
};
