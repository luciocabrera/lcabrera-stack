import type { TStore } from '#ui/hooks/useStore.hook';

type SyncStoreFromPropsArgs<TData extends Record<string, unknown>> = {
  readonly next: Partial<TData>;
  readonly store: Pick<TStore<TData>, 'set'>;
};

export const syncStoreFromProps = <TData extends Record<string, unknown>>({
  next,
  store,
}: SyncStoreFromPropsArgs<TData>) => {
  store.set(next);
};
