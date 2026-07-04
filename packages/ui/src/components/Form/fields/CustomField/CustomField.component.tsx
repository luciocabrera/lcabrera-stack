import { useId } from 'react';

import { useSetFieldValue } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { CustomFieldProps } from './CustomField.types';

export const CustomField = <TValues extends Record<string, unknown>>({
  field,
}: CustomFieldProps<TValues>) => {
  const fieldId = useId();
  const mode = useGetFormMode();
  const value = useGetFieldValue<TValues>(field.accessor);
  const error = useGetFieldError<TValues>(field.accessor);
  const setFieldValue = useSetFieldValue<TValues>();

  const isDisabled = mode === 'view' || Boolean(field.disabled);

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      isRequired={field.clientValidation?.required}
      label={field.label}
    >
      {field.renderField({
        error,
        isDisabled,
        onChange: (next) => setFieldValue(field.accessor, next),
        value,
      })}
    </FormFieldChrome>
  );
};
