import { useFieldsStore } from '@repo/ui/components/Form/contexts/FormContext/useFieldsStore.hook';
import { isFormDirty } from '@repo/ui/components/Form/utils/isFormDirty.util';

export const useGetIsFormDirty = <TValues extends Record<string, unknown>>(
  accessors: readonly (keyof TValues & string)[],
) =>
  useFieldsStore<boolean, TValues>((state) =>
    isFormDirty({
      accessors,
      currentValues: state.values,
      initialValues: state.initialValues,
    }),
  );
