import { useFormContextValue } from '#ui/components/Form/contexts/FormContext/useFormContextValue.hook';
import { isFormDirty } from '#ui/components/Form/utils/isFormDirty.util';
import { validateFields } from '#ui/components/Form/utils/validateFields.util';

/**
 * Client-side pre-submit gate — progressive enhancement only, the action's Zod parse on
 * the server remains authoritative (ADR-005).
 */
export const useSubmitForm = <TValues extends Record<string, unknown>>() => {
  const { fieldsStore, metaStore } = useFormContextValue<TValues>();

  return () => {
    const metaState = metaStore.get();
    const fieldsState = fieldsStore.get();
    if (!fieldsState || !metaState) return true;

    const { initialValues, values } = fieldsState;
    const { leafFields, mode } = metaState;

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
    fieldsStore.set({ errors });

    return Object.keys(errors).length === 0;
  };
};
