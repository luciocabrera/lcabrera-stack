import { Checkbox } from '#ui/components/Checkbox';
import { useFormField } from '#ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '#ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { ToggleSwitch } from '#ui/components/ToggleSwitch';

import type { BooleanFieldProps } from './BooleanField.types';

export const BooleanField = <TValues extends Record<string, unknown>>({
  field,
}: BooleanFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

  const isChecked = Boolean(value);
  const variant = field.variant ?? 'checkbox';

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.checked);
  };

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
          onChange={setValue}
        />
      ) : (
        <Checkbox
          id={fieldId}
          isChecked={isChecked}
          isDisabled={isDisabled}
          name={field.accessor}
          onChange={handleCheckboxChange}
        />
      )}
    </FormFieldChrome>
  );
};
