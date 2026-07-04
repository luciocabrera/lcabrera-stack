import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { NO_AUTOFILL_INPUT_PROPS } from '@repo/ui/components/Table/filters/filterInput.constants';
import { filterBaseStyles } from '@repo/ui/design-system/tokens/filters.stylex';
import { useSetFieldValue } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { NumberFieldProps } from './NumberField.types';

export const NumberField = <TValues extends Record<string, unknown>>({
  field,
}: NumberFieldProps<TValues>) => {
  const fieldId = useId();
  const mode = useGetFormMode();
  const value = useGetFieldValue<TValues>(field.accessor);
  const error = useGetFieldError<TValues>(field.accessor);
  const setFieldValue = useSetFieldValue<TValues>();

  const isDisabled = mode === 'view' || Boolean(field.disabled);
  const stringValue =
    value === undefined || value === '' ? '' : String(value as number);

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      isRequired={field.clientValidation?.required}
      label={field.label}
    >
      <div {...stylex.props(filterBaseStyles.inputWrapper)}>
        <input
          {...NO_AUTOFILL_INPUT_PROPS}
          disabled={isDisabled}
          id={fieldId}
          max={field.clientValidation?.max}
          min={field.clientValidation?.min}
          name={field.accessor}
          onChange={(event) => {
            const nextValue = event.target.value;
            setFieldValue(
              field.accessor,
              nextValue === '' ? undefined : Number(nextValue),
            );
          }}
          placeholder={field.placeholder}
          required={field.clientValidation?.required}
          type='number'
          value={stringValue}
          {...stylex.props(filterBaseStyles.input)}
        />
      </div>
    </FormFieldChrome>
  );
};
