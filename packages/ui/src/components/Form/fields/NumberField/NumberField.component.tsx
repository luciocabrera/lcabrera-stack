import { formInputStyles } from '@repo/ui/components/Form/fields/formInput.stylex';
import { useFormField } from '@repo/ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { NO_AUTOFILL_INPUT_PROPS } from '@repo/ui/components/Table/filters/filterInput.constants';
import * as stylex from '@stylexjs/stylex';

import type { NumberFieldProps } from './NumberField.types';

export const NumberField = <TValues extends Record<string, unknown>>({
  field,
}: NumberFieldProps<TValues>) => {
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
        <input
          {...NO_AUTOFILL_INPUT_PROPS}
          disabled={isDisabled}
          id={fieldId}
          max={field.clientValidation?.max}
          min={field.clientValidation?.min}
          name={field.accessor}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.clientValidation?.required}
          type='number'
          value={stringValue}
          {...stylex.props(formInputStyles.input)}
        />
      </div>
    </FormFieldChrome>
  );
};
