import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { formatCurrency } from '@repo/utils/formatters/format-currency.util';
import { formatDate } from '@repo/utils/formatters/format-date.util';
import { formatNumber } from '@repo/utils/formatters/format-number.util';

import { resolveOptionLabels } from './resolveOptionLabels.util';
import { stringifyLeafValue } from './stringifyLeafValue.util';

type FormatFieldDisplayValueArgs<TValues extends Record<string, unknown>> = {
  readonly field: LeafFieldDef<TValues>;
  readonly value: unknown;
};

/**
 * Formats a leaf field's stored value into the read-only text shown in `view`
 * mode (label + value, not a disabled widget): boolean → Yes/No, currency →
 * formatted currency, number → locale number, date/datetime → formatted date,
 * select/radio → the option label(s), everything else → the raw string.
 * Empty (`undefined`/`''`) non-boolean values render as an empty string so the
 * display component can show its own placeholder.
 */
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
