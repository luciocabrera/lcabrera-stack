import { formInputStyles } from '@lcabrera/ui/components/Form/fields/formInput.stylex';
import { useFormField } from '@lcabrera/ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '@lcabrera/ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { NO_AUTOFILL_INPUT_PROPS } from '@lcabrera/ui/components/Table/filters/filters.constants';
import * as stylex from '@stylexjs/stylex';

import type { NumericFieldControlProps } from './NumericFieldControl.types';

import { styles } from './NumericFieldControl.stylex';

/**
 * Shared numeric leaf-field control: `FormFieldChrome` wrapping a `type="number"`
 * input wired through `useFormField` so it stores a real `number`/`undefined`
 * (never the raw input string). `NumberField` and `CurrencyField` render this
 * with their own adornment / input attributes instead of repeating the wiring.
 */
export const NumericFieldControl = <TValues extends Record<string, unknown>>({
  adornment,
  field,
  inputMode,
  step,
}: NumericFieldControlProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

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
        {adornment}
        <input
          {...NO_AUTOFILL_INPUT_PROPS}
          disabled={isDisabled}
          id={fieldId}
          inputMode={inputMode}
          max={field.clientValidation?.max}
          min={field.clientValidation?.min}
          name={field.accessor}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.clientValidation?.required}
          step={step}
          type='number'
          value={stringValue}
          {...stylex.props(
            formInputStyles.input,
            adornment !== undefined && styles.inputWithAdornment,
          )}
        />
      </div>
    </FormFieldChrome>
  );
};
