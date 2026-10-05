import { formatNumber } from '@lcabrera/utils/formatters/format-number.util';

import type { TableMetadataValue } from '#ui/components/Table/Table.types';

export const formatMetadataValue = (value: TableMetadataValue) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return typeof value === 'number'
    ? formatNumber({ maximumFractionDigits: 0, value })
    : String(value);
};
