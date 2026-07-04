import { useSyncExternalStore } from 'react';

import type { FormMetaState } from './FormContext.types';

import { useFormContextValue } from './useFormContextValue.hook';

export const useMetaStore = <TSelected>(
  selector: (state: FormMetaState) => TSelected,
) => {
  const { metaStore } = useFormContextValue();

  return useSyncExternalStore(
    metaStore.subscribe,
    () => selector(metaStore.get() as FormMetaState),
    () => selector(metaStore.getServerSnapshot() as FormMetaState),
  );
};
