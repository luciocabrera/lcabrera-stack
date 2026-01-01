import type {
  TableColumnDataType,
  TableColumnFormat,
} from '@/components/Table/Table.types';

import { TableCheckDisplay } from '@/components/Table/TableCheckDisplay';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

type RenderCellContentArgs = {
  dataType: TableColumnDataType;
  format?: TableColumnFormat;
  label?: string;
  locale?: string;
  value: unknown;
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
      // Handle both number and numeric string values
      const numValue =
        typeof value === 'number' ? value : Number.parseFloat(String(value));
      if (!Number.isNaN(numValue)) {
        return formatCurrency({
          currency: format?.currency?.currency,
          locale: format?.currency?.locale ?? locale,
          value: numValue,
        });
      }
      // If it's already a string with currency symbol or non-numeric, return as-is
      return String(value);
    }
    case 'date': {
      return formatDate({
        locale: format?.date?.locale ?? locale,
        preset: format?.date?.preset,
        value,
      });
    }
    case 'number': {
      // Handle both number and numeric string values
      const numValue =
        typeof value === 'number' ? value : Number.parseFloat(String(value));
      if (!Number.isNaN(numValue)) {
        return formatNumber({
          locale: format?.number?.locale ?? locale,
          maximumFractionDigits: format?.number?.maximumFractionDigits,
          minimumFractionDigits: format?.number?.minimumFractionDigits,
          value: numValue,
        });
      }
      return String(value);
    }
    default: {
      return typeof value === 'string' ? value : '';
    }
  }
};
