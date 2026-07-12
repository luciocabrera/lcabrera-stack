import type {
  TableColumnDataType,
  TableColumnFormat,
} from '@repo/ui/components/Table/Table.types';

import { TableCheckDisplay } from '@repo/ui/components/Table/TableCheckDisplay';
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from '@repo/ui/utils/formatters';

type RenderCellContentArgs = {
  readonly dataType: TableColumnDataType;
  readonly format?: TableColumnFormat;
  readonly label?: string;
  readonly locale?: string;
  readonly value: unknown;
};

const parseNumberValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const stringifyCellValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return '';
};

export const renderCellContent = ({
  dataType,
  format,
  label,
  locale,
  value,
}: RenderCellContentArgs) => {
  switch (dataType) {
    case 'boolean': {
      return <TableCheckDisplay label={label} value={value} />;
    }
    case 'currency': {
      const numValue = parseNumberValue(value);

      if (numValue !== undefined) {
        return formatCurrency({
          currency: format?.currency?.currency,
          locale: format?.currency?.locale ?? locale,
          value: numValue,
        });
      }

      return stringifyCellValue(value);
    }
    case 'date': {
      return formatDate({
        locale: format?.date?.locale ?? locale,
        preset: format?.date?.preset,
        value,
      });
    }
    case 'number': {
      const numValue = parseNumberValue(value);

      if (numValue !== undefined) {
        return formatNumber({
          locale: format?.number?.locale ?? locale,
          maximumFractionDigits: format?.number?.maximumFractionDigits,
          minimumFractionDigits: format?.number?.minimumFractionDigits,
          value: numValue,
        });
      }

      return stringifyCellValue(value);
    }
    default: {
      return typeof value === 'string' ? value : '';
    }
  }
};
