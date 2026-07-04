import { useSyncExternalStore } from 'react';

import type { FormMode } from '@repo/ui/components/Form/Form.types';

import { useFormContextValue } from '@repo/ui/components/Form/contexts/FormContext/useFormContextValue.hook';

export const useGetFormMode = (): FormMode => {
  const { formStore } = useFormContextValue();

  return useSyncExternalStore(
    formStore.subscribe,
    () => formStore.get()?.mode ?? 'create',
    () => formStore.getServerSnapshot()?.mode ?? 'create',
  );
};
