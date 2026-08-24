import { formatCurrency } from '@lcabrera/utils/formatters/format-currency.util';
import { formatDate } from '@lcabrera/utils/formatters/format-date.util';
import { formatNumber } from '@lcabrera/utils/formatters/format-number.util';

import type { LeafFieldDef } from '#ui/components/Form/Form.types';

import { resolveOptionLabels } from './resolveOptionLabels.util';
import { stringifyLeafValue } from './stringifyLeafValue.util';

type FormatFieldDisplayValueArgs<TValues extends Record<string, unknown>> = {
  readonly field: LeafFieldDef<TValues>;
  readonly value: unknown;
};

export const formatFieldDisplayValue = <
  TValues extends Record<string, unknown>,
>({
  field,
  value,
}: FormatFieldDisplayValueArgs<TValues>) => {
  if (field.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === undefined || value === '') {
    return '';
  }

  switch (field.type) {
    case 'currency': {
      const numeric = typeof value === 'number' ? value : Number(value);

      return Number.isFinite(numeric)
        ? formatCurrency({ currency: field.currency, value: numeric })
        : stringifyLeafValue(value);
    }
    case 'date':
    case 'datetime': {
      return formatDate({ value });
    }
    case 'number': {
      const numeric = typeof value === 'number' ? value : Number(value);

      return Number.isFinite(numeric)
        ? formatNumber({ value: numeric })
        : stringifyLeafValue(value);
    }
    case 'radio':
    case 'select': {
      return resolveOptionLabels({ options: field.options, value });
    }
    default: {
      return stringifyLeafValue(value);
    }
  }
};
