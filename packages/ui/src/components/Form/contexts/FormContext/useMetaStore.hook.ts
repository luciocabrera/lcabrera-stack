import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import type { FormMetaState } from './FormContext.types';

import { useFormContextValue } from './useFormContextValue.hook';

export const useMetaStore = <
  TSelected,
  TValues extends Record<string, unknown> = Record<string, unknown>,
>(
  selector: (state: FormMetaState<TValues>) => TSelected,
) => {
  const { metaStore } = useFormContextValue<TValues>();

  return useStoreSelector({ selector, store: metaStore });
};
