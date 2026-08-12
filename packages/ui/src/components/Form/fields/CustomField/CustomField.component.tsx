import { useFormField } from '#ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '#ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { CustomFieldProps } from './CustomField.types';

export const CustomField = <TValues extends Record<string, unknown>>({
  field,
}: CustomFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

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
        onChange: setValue,
        value,
      })}
    </FormFieldChrome>
  );
};
