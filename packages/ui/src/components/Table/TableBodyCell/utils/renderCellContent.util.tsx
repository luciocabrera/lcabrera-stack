import { formatCurrency } from '@lcabrera/utils/formatters/format-currency.util';
import { formatDate } from '@lcabrera/utils/formatters/format-date.util';
import { formatNumber } from '@lcabrera/utils/formatters/format-number.util';

import type {
  TableColumnDataType,
  TableColumnFormat,
} from '#ui/components/Table/Table.types';

import { TableCheckDisplay } from '#ui/components/Table/TableCheckDisplay';
import { toCellText } from '#ui/components/Table/utils/toCellText.util';

import { parseNumberValue } from './parseNumberValue.util';

type RenderCellContentArgs = {
  readonly dataType: TableColumnDataType;
  readonly format?: TableColumnFormat;
  readonly label?: string;
  readonly locale?: string;
  readonly value: unknown;
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

      return toCellText(value);
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

      return toCellText(value);
    }
    default: {
      return typeof value === 'string' ? value : '';
    }
  }
};
