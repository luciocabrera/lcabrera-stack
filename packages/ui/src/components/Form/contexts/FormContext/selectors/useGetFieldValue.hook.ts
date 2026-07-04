import { useSyncExternalStore } from 'react';

import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

export const useGetFieldValue = <TValues extends Record<string, unknown>>(
  accessor: keyof TValues & string,
): unknown => {
  const { formStore } = useFormContextValue<TValues>();

  return useSyncExternalStore(
    formStore.subscribe,
    () => formStore.get()?.values[accessor],
    () => formStore.getServerSnapshot()?.values[accessor],
  );
};
