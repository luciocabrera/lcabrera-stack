import { formInputStyles } from '@repo/ui/components/Form/fields/formInput.stylex';
import { useFormField } from '@repo/ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { NO_AUTOFILL_INPUT_PROPS } from '@repo/ui/components/Table/filters/filterInput.constants';
import * as stylex from '@stylexjs/stylex';

import type { CurrencyFieldProps } from './CurrencyField.types';

import { styles } from './CurrencyField.stylex';
import { getCurrencySymbol } from './getCurrencySymbol.util';

/**
 * Currency leaf field: edits as a plain number (like `NumberField`) with a
 * leading currency-symbol adornment. Read/view rendering is handled by
 * `FormFieldDisplay`, which formats the stored number as a currency string.
 */
export const CurrencyField = <TValues extends Record<string, unknown>>({
  field,
}: CurrencyFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

  const symbol = getCurrencySymbol({ currency: field.currency });
  const stringValue =
    value === undefined || value === '' ? '' : String(value as number);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setValue(nextValue === '' ? undefined : Number(nextValue));
  };

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      isRequired={field.clientValidation?.required}
      label={field.label}
    >
      <div {...stylex.props(formInputStyles.inputWrapper)}>
        <span aria-hidden {...stylex.props(styles.symbol)}>
          {symbol}
        </span>
        <input
          {...NO_AUTOFILL_INPUT_PROPS}
          disabled={isDisabled}
          id={fieldId}
          inputMode='decimal'
          max={field.clientValidation?.max}
          min={field.clientValidation?.min}
          name={field.accessor}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.clientValidation?.required}
          step='0.01'
          type='number'
          value={stringValue}
          {...stylex.props(formInputStyles.input, styles.input)}
        />
      </div>
    </FormFieldChrome>
  );
};
