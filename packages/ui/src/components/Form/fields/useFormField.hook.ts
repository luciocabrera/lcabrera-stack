import { useSetFieldValue } from '@lcabrera/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFieldError,
  useGetFieldValue,
  useGetFormMode,
} from '@lcabrera/ui/components/Form/contexts/FormContext/selectors';
import { useId } from 'react';

type UseFormFieldArgs<TValues extends Record<string, unknown>> = {
  readonly accessor: keyof TValues & string;
  readonly disabled?: boolean;
};

/**
 * Shared per-leaf-field wiring (ADR-005): generates the field id, reads the
 * three FormContext selectors (value/error/mode), derives the view-mode /
 * `disabled` flag, and returns an accessor-bound setter — the identical
 * boilerplate every leaf field component would otherwise repeat verbatim.
 * Each field component keeps only its own field-type-specific markup.
 */
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
