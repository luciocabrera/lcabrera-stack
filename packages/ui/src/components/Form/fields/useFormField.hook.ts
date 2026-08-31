import { useId } from 'react';

import { useSetFieldValue } from '#ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '#ui/components/Form/contexts/FormContext/selectors';

type UseFormFieldArgs<TValues extends Record<string, unknown>> = {
  readonly accessor: keyof TValues & string;
  readonly disabled?: boolean;
};

export const useFormField = <TValues extends Record<string, unknown>>({
  accessor,
  disabled,
}: UseFormFieldArgs<TValues>) => {
  const fieldId = useId();
  const mode = useGetFormMode();
  const value = useGetFieldValue<TValues>(accessor);
  const error = useGetFieldError<TValues>(accessor);
  const setFieldValue = useSetFieldValue<TValues>();

  return {
    error,
    fieldId,
    isDisabled: mode === 'view' || Boolean(disabled),
    setValue: (next: unknown) => setFieldValue({ accessor, value: next }),
    value,
  };
};
