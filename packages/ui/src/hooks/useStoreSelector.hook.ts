import { useSyncExternalStore } from 'react';

import type { TStore } from './useStore.hook';

type UseStoreSelectorArgs<TState, TSelected> = {
  readonly selector: (state: TState) => TSelected;
  readonly store: TStore<TState>;
};

export const useStoreSelector = <
  TState extends Record<string, unknown>,
  TSelected,
>({
  selector,
  store,
}: UseStoreSelectorArgs<TState, TSelected>) =>
  useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.getServerSnapshot()),
  );
