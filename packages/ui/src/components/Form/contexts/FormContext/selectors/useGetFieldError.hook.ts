import { useSyncExternalStore } from 'react';

import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

export const useGetFieldError = <TValues extends Record<string, unknown>>(
  accessor: keyof TValues & string,
): string | undefined => {
  const { formStore } = useFormContextValue<TValues>();

  return useSyncExternalStore(
    formStore.subscribe,
    () => formStore.get()?.errors[accessor],
    () => formStore.getServerSnapshot()?.errors[accessor],
  );
};
