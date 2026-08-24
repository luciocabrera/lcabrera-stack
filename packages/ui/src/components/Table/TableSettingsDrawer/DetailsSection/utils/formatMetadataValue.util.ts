import { formatNumber } from '@lcabrera/utils/formatters/format-number.util';

import type { TableMetadataValue } from '#ui/components/Table/Table.types';

export const formatMetadataValue = (value: TableMetadataValue) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return formatNumber({ maximumFractionDigits: 0, value });
  }

  return String(value);
};
