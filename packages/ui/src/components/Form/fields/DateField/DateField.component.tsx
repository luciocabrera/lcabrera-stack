import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { filterBaseStyles } from '@repo/ui/design-system/tokens/filters.stylex';
import { useSetFieldValue } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { DateFieldProps } from './DateField.types';

export const DateField = <TValues extends Record<string, unknown>>({
  field,
}: DateFieldProps<TValues>) => {
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
      <div {...stylex.props(filterBaseStyles.inputWrapper)}>
        <input
          disabled={isDisabled}
          id={fieldId}
          name={field.accessor}
          onChange={(event) =>
            setFieldValue(field.accessor, event.target.value)
          }
          required={field.clientValidation?.required}
          type={field.type === 'datetime' ? 'datetime-local' : 'date'}
          value={(value as string | undefined) ?? ''}
          {...stylex.props(filterBaseStyles.input)}
        />
      </div>
    </FormFieldChrome>
  );
};
