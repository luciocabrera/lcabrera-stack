import { formatDate } from '@lcabrera/utils/formatters/format-date.util';

export const toAxisHeaderLabel = (value: unknown) => {
  if (typeof value === 'string') return value;

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value instanceof Date) {
    return formatDate({ value });
  }

  return '';
};
