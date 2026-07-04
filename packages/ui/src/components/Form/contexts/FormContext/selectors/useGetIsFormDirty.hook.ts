import { useSyncExternalStore } from 'react';

import { isFormDirty } from '@repo/ui/components/Form/utils/isFormDirty.util';
import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

export const useGetIsFormDirty = <TValues extends Record<string, unknown>>(
  accessors: readonly (keyof TValues & string)[],
): boolean => {
  const { formStore } = useFormContextValue<TValues>();

  return useSyncExternalStore(
    formStore.subscribe,
    () => {
      const state = formStore.get();
      if (!state) return false;
      return isFormDirty({
        accessors,
        currentValues: state.values,
        initialValues: state.initialValues,
      });
    },
    () => false,
  );
};
