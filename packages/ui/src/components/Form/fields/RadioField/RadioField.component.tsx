import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { useSetFieldValue } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { RadioFieldProps } from './RadioField.types';

import { styles } from './RadioField.stylex';

export const RadioField = <TValues extends Record<string, unknown>>({
  field,
}: RadioFieldProps<TValues>) => {
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
      <fieldset disabled={isDisabled} {...stylex.props(styles.fieldset)}>
        <RadioOptionGroup
          name={field.accessor}
          onChange={(next) => setFieldValue(field.accessor, next)}
          options={field.options}
          value={(value as string | undefined) ?? ''}
        />
      </fieldset>
    </FormFieldChrome>
  );
};
