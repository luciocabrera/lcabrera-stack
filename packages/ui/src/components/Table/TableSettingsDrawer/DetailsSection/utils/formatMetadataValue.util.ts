import { formatNumber } from '@lcabrera/utils/formatters/format-number.util';

import type { TableMetadataValue } from '#ui/components/Table/Table.types';

/**
 * Convert a metadata value into a display string.
 * Booleans become Yes/No, numbers are formatted with no fraction digits.
 * @param value - The metadata value.
 * @returns The formatted display string.
 */
export const formatMetadataValue = (value: TableMetadataValue) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return formatNumber({ maximumFractionDigits: 0, value });
  }

  return String(value);
};
