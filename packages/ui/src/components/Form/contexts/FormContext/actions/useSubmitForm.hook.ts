import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { isFormDirty } from '@repo/ui/components/Form/utils/isFormDirty.util';
import { validateFields } from '@repo/ui/components/Form/utils/validateFields.util';
import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

type SubmitFormArgs<TValues extends Record<string, unknown>> = {
  readonly leafFields: readonly LeafFieldDef<TValues>[];
};

/**
 * Client-side pre-submit gate — progressive enhancement only, the action's
 * Zod parse on the server remains authoritative (ADR-005). Returns whether
 * the in-flight native form submission should proceed.
 */
export const useSubmitForm = <TValues extends Record<string, unknown>>() => {
  const { formStore } = useFormContextValue<TValues>();

  return ({ leafFields }: SubmitFormArgs<TValues>): boolean => {
    const state = formStore.get();
    if (!state) return true;

    const { initialValues, mode, values } = state;

    if (mode === 'edit') {
      const accessors = leafFields.map((field) => field.accessor);
      const dirty = isFormDirty({
        accessors,
        currentValues: values,
        initialValues,
      });
      if (!dirty) return false;
    }

    const errors = validateFields({ leafFields, values });
    formStore.set({ errors });

    return Object.keys(errors).length === 0;
  };
};
