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

import type { TextFieldProps } from './TextField.types';

import { styles } from './TextField.stylex';

export const TextField = <TValues extends Record<string, unknown>>({
  field,
}: TextFieldProps<TValues>) => {
  const fieldId = useId();
  const mode = useGetFormMode();
  const value = useGetFieldValue<TValues>(field.accessor);
  const error = useGetFieldError<TValues>(field.accessor);
  const setFieldValue = useSetFieldValue<TValues>();

  const isDisabled = mode === 'view' || Boolean(field.disabled);
  const stringValue = (value as string | undefined) ?? '';

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      isRequired={field.clientValidation?.required}
      label={field.label}
    >
      {field.type === 'textarea' ? (
        <textarea
          disabled={isDisabled}
          id={fieldId}
          maxLength={field.clientValidation?.maxLength}
          minLength={field.clientValidation?.minLength}
          name={field.accessor}
          onChange={(event) =>
            setFieldValue(field.accessor, event.target.value)
          }
          placeholder={field.placeholder}
          required={field.clientValidation?.required}
          value={stringValue}
          {...stylex.props(filterBaseStyles.input, styles.textareaOverride)}
        />
      ) : (
        <div {...stylex.props(filterBaseStyles.inputWrapper)}>
          <input
            {...NO_AUTOFILL_INPUT_PROPS}
            disabled={isDisabled}
            id={fieldId}
            maxLength={field.clientValidation?.maxLength}
            minLength={field.clientValidation?.minLength}
            name={field.accessor}
            onChange={(event) =>
              setFieldValue(field.accessor, event.target.value)
            }
            pattern={field.clientValidation?.pattern}
            placeholder={field.placeholder}
            required={field.clientValidation?.required}
            type={field.type}
            value={stringValue}
            {...stylex.props(filterBaseStyles.input)}
          />
        </div>
      )}
    </FormFieldChrome>
  );
};
