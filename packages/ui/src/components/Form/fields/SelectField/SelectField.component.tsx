import { useId } from 'react';

import { VirtualSelect } from '@repo/ui/components/VirtualSelect';
import { useSetFieldValue } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldChrome } from '@repo/ui/components/Form/FormFieldChrome/FormFieldChrome.component';

import type { SelectFieldProps } from './SelectField.types';

const resolveSelectedValues = (
  mode: 'multi' | 'single',
  value: unknown,
): string[] => {
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
  const fieldId = useId();
  const mode = useGetFormMode();
  const value = useGetFieldValue<TValues>(field.accessor);
  const error = useGetFieldError<TValues>(field.accessor);
  const setFieldValue = useSetFieldValue<TValues>();

  const isDisabled = mode === 'view' || Boolean(field.disabled);
  const selectMode = field.mode ?? 'single';
  const selected = resolveSelectedValues(selectMode, value);

  const handleChange = (nextSelected: string[]) => {
    setFieldValue(
      field.accessor,
      selectMode === 'multi' ? nextSelected : (nextSelected[0] ?? ''),
    );
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
          hidden inputs so RR7's <Form>/fetcher.Form submits real FormData. */}
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
