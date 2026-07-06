import { useFormField } from '@repo/ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { NO_AUTOFILL_INPUT_PROPS } from '@repo/ui/components/Table/filters/filterInput.constants';
import { filterBaseStyles } from '@repo/ui/design-system/tokens/filters.stylex';
import * as stylex from '@stylexjs/stylex';

import type { TextFieldProps } from './TextField.types';

import { styles } from './TextField.stylex';

export const TextField = <TValues extends Record<string, unknown>>({
  field,
}: TextFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

  const stringValue = (value as string | undefined) ?? '';

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValue(event.target.value);
  };

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
          onChange={handleChange}
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
            onChange={handleChange}
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
