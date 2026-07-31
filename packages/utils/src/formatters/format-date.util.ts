import type { DateFormatOptions } from './formatters.types';

import { DEFAULT_DATE_PRESET } from './formatters.constants';
import { getDateTimeFormatOptions } from './get-date-time-format-options.util';
import { getDefaultLocale } from './get-default-locale.util';
import { parseDate } from './parse-date.util';

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
  timeStyle,
  timeZone,
  value,
}: FormatDateArgs) => {
  const date = parseDate(value);

  if (!date) {
    return typeof value === 'string' ? value : '';
  }

  const resolvedLocale = locale ?? getDefaultLocale();
  const preset = presetOption ?? DEFAULT_DATE_PRESET;

  try {
    // `Intl` reads an `undefined` option as "not provided", so passing these
    // through unconditionally is identical to omitting them — no conditional
    // spread needed, and a caller supplying neither gets the previous output.
    const formatOptions = {
      ...getDateTimeFormatOptions(preset),
      timeStyle,
      timeZone,
    };

    return new Intl.DateTimeFormat(resolvedLocale, formatOptions).format(date);
  } catch {
    // `toLocaleDateString` reads the runtime's zone, so it would reintroduce the
    // very nondeterminism a caller passing `timeZone` is trying to remove — those
    // callers get the ISO instant instead. Callers that pass none keep the
    // previous fallback unchanged.
    return timeZone === undefined
      ? date.toLocaleDateString()
      : date.toISOString();
  }
};
