import type { DateFormatOptions } from './formatters.types';

import { DEFAULT_DATE_PRESET } from './formatters.constants';
import { getDateTimeFormatOptions } from './get-date-time-format-options.util';
import { getDefaultLocale } from './get-default-locale.util';
import { parseDate } from './parse-date.util';

type FormatDateArgs = DateFormatOptions & {
  readonly value: unknown;
};

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
    const formatOptions = {
      ...getDateTimeFormatOptions(preset),
      timeStyle,
      timeZone,
    };

    return new Intl.DateTimeFormat(resolvedLocale, formatOptions).format(date);
  } catch {
    return timeZone === undefined
      ? date.toLocaleDateString()
      : date.toISOString();
  }
};
