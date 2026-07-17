import { useSyncExternalStore } from 'react';

import type { TStore } from './useStore.hook';

type UseStoreSelectorArgs<TState, TSelected> = {
  /** Narrows store state to the slice the caller subscribes to */
  readonly selector: (state: TState) => TSelected;
  /** The store to read from, created by `useStore` */
  readonly store: TStore<TState>;
};

/**
 * Subscribes to a slice of a `useStore` external store, re-rendering only when
 * the selected slice changes.
 *
 * This is the subscription half of the store pattern: `useStore` creates the
 * store, this hook reads from it. Per-context `use*Store` infrastructure hooks
 * resolve their own store from their own context and delegate the
 * `useSyncExternalStore` wiring (client snapshot, server snapshot, subscribe)
 * here, so the mechanics live in exactly one place.
 *
 * `useStore` requires an initial state, so `get()` always returns one — the
 * selector needs no empty-store fallback and no cast.
 *
 * Selector hooks (`useGet*`) are the intended consumers — view components read
 * through those, never through this hook directly.
 *
 * @example
 * ```ts
 * export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
 *   selector: (state: TableColumnsState<TData>) => TSelected,
 * ) => {
 *   const { columnsStore } = useTableConfigContextValue<TData>();
 *
 *   return useStoreSelector({ selector, store: columnsStore });
 * };
 * ```
 */
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
