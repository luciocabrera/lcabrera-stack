import { NumericFieldControl } from '@repo/ui/components/Form/fields/NumericFieldControl/NumericFieldControl.component';
import * as stylex from '@stylexjs/stylex';

import type { CurrencyFieldProps } from './CurrencyField.types';

import { styles } from './CurrencyField.stylex';
import { getCurrencySymbol } from './utils';

/**
 * Currency leaf field: a numeric input (see `NumericFieldControl`) with a
 * leading currency-symbol adornment. Read/view rendering is handled by
 * `FormFieldDisplay`, which formats the stored number as a currency string.
 */
export const CurrencyField = <TValues extends Record<string, unknown>>({
  field,
}: CurrencyFieldProps<TValues>) => {
  const symbol = getCurrencySymbol({ currency: field.currency });

  return (
    <NumericFieldControl<TValues>
      adornment={
        <span aria-hidden {...stylex.props(styles.symbol)}>
          {symbol}
        </span>
      }
      field={field}
      inputMode='decimal'
      step='0.01'
    />
  );
};
