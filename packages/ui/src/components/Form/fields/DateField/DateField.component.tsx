import { useFormField } from '@repo/ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { filterBaseStyles } from '@repo/ui/design-system/tokens/filters.stylex';
import * as stylex from '@stylexjs/stylex';

import type { DateFieldProps } from './DateField.types';

export const DateField = <TValues extends Record<string, unknown>>({
  field,
}: DateFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      <div {...stylex.props(filterBaseStyles.inputWrapper)}>
        <input
          disabled={isDisabled}
          id={fieldId}
          name={field.accessor}
          onChange={handleChange}
          required={field.clientValidation?.required}
          type={field.type === 'datetime' ? 'datetime-local' : 'date'}
          value={(value as string | undefined) ?? ''}
          {...stylex.props(filterBaseStyles.input)}
        />
      </div>
    </FormFieldChrome>
  );
};
