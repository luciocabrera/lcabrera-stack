import { useFormField } from '@lcabrera/ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '@lcabrera/ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { RadioOptionGroup } from '@lcabrera/ui/components/RadioOptionGroup';
import * as stylex from '@stylexjs/stylex';

import type { RadioFieldProps } from './RadioField.types';

import { styles } from './RadioField.stylex';

export const RadioField = <TValues extends Record<string, unknown>>({
  field,
}: RadioFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

  const handleChange = (next: string) => {
    setValue(next);
  };

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
          onChange={handleChange}
          options={field.options}
          value={(value as string | undefined) ?? ''}
        />
      </fieldset>
    </FormFieldChrome>
  );
};
