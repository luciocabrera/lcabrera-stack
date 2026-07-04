import { useId } from 'react';

import { Checkbox } from '@repo/ui/components/Checkbox';
import { ToggleSwitch } from '@repo/ui/components/ToggleSwitch';
import { useSetFieldValue } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { BooleanFieldProps } from './BooleanField.types';

export const BooleanField = <TValues extends Record<string, unknown>>({
  field,
}: BooleanFieldProps<TValues>) => {
  const fieldId = useId();
  const mode = useGetFormMode();
  const value = useGetFieldValue<TValues>(field.accessor);
  const error = useGetFieldError<TValues>(field.accessor);
  const setFieldValue = useSetFieldValue<TValues>();

  const isDisabled = mode === 'view' || Boolean(field.disabled);
  const isChecked = Boolean(value);
  const variant = field.variant ?? 'checkbox';

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      hideLabel={variant === 'toggle'}
      label={field.label}
    >
      {variant === 'toggle' ? (
        <ToggleSwitch
          id={fieldId}
          isChecked={isChecked}
          isDisabled={isDisabled}
          label={field.label}
          name={field.accessor}
          onChange={(next) => setFieldValue(field.accessor, next)}
        />
      ) : (
        <Checkbox
          id={fieldId}
          isChecked={isChecked}
          isDisabled={isDisabled}
          name={field.accessor}
          onChange={(event) =>
            setFieldValue(field.accessor, event.target.checked)
          }
        />
      )}
    </FormFieldChrome>
  );
};
