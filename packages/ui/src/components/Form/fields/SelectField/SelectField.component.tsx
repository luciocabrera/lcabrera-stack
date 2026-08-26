import { useFormField } from '#ui/components/Form/fields/useFormField.hook';
import { FormFieldChrome } from '#ui/components/Form/FormFieldChrome/FormFieldChrome.component';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type {
  ResolveSelectedValuesArgs,
  SelectFieldProps,
} from './SelectField.types';

const resolveSelectedValues = ({ mode, value }: ResolveSelectedValuesArgs) => {
  if (mode === 'multi') {
    return (value as string[] | undefined) ?? [];
  }

  if (value) {
    return [value as string];
  }

  return [];
};

export const SelectField = <TValues extends Record<string, unknown>>({
  field,
}: SelectFieldProps<TValues>) => {
  const { error, fieldId, isDisabled, setValue, value } =
    useFormField<TValues>(field);

  const selectMode = field.mode ?? 'single';
  const selected = resolveSelectedValues({ mode: selectMode, value });

  const handleChange = (nextSelected: string[]) => {
    setValue(selectMode === 'multi' ? nextSelected : (nextSelected[0] ?? ''));
  };

  return (
    <FormFieldChrome
      description={field.description}
      error={error}
      fieldId={fieldId}
      isRequired={field.clientValidation?.required}
      label={field.label}
    >
      <VirtualSelect
        isBusy={isDisabled}
        listboxId={fieldId}
        mode={selectMode}
        onChange={handleChange}
        options={field.options}
        placeholder={field.placeholder}
        selected={selected}
      />
      {/* VirtualSelect has no native form input — mirror the selection into
          hidden inputs so React Router's <Form>/fetcher.Form submits real FormData. */}
      {selected.map((selectedValue) => (
        <input
          key={selectedValue}
          name={field.accessor}
          type='hidden'
          value={selectedValue}
        />
      ))}
    </FormFieldChrome>
  );
};
