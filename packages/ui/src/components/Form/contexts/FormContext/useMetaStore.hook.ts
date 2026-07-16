import { useSyncExternalStore } from 'react';

import type { FormMetaState } from './FormContext.types';

import { useFormContextValue } from './useFormContextValue.hook';

export const useMetaStore = <
  TSelected,
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(
  selector: (state: FormMetaState<TValues>) => TSelected,
) => {
  const { metaStore } = useFormContextValue<TValues>();

  return useSyncExternalStore(
    metaStore.subscribe,
    () => selector(metaStore.get() as FormMetaState<TValues>),
    () => selector(metaStore.getServerSnapshot() as FormMetaState<TValues>),
  );
};
