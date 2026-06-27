import { useRef } from 'react';

import { isShallowEqual } from '@/utils';

/**
 * Store type with get, set, subscribe, reset, and getServerSnapshot methods
 */
export type TStore<TData> = {
  /** Get current state */
  get: () => TData | undefined;
  /** Get server snapshot for SSR hydration */
  getServerSnapshot: () => TData | undefined;
  /** Reset state to initial value */
  reset: () => void;
  /** Merge partial state update (only notifies if changed) */
  set: (value: Partial<TData>) => void;
  /** Subscribe to state changes */
  subscribe: (callback: () => void) => () => void;
};

/**
 * External store hook for granular state management with useSyncExternalStore
 *
 * Features:
 * - Shallow equality check before notifying listeners
 * - SSR support via getServerSnapshot
 * - Reset to initial state
 * - Efficient listener management with Set
 *
 * @example
 * ```tsx
 * const store = useStore<{ count: number }>({ count: 0 });
 *
 * // In component with useSyncExternalStore
 * const count = useSyncExternalStore(
 *   store.subscribe,
 *   () => store.get()?.count ?? 0
 * );
 * ```
 */
export const useStore = <TData extends Record<string, unknown>>(
  initialState?: TData,
): TStore<TData> => {
  const store = useRef(initialState);
  const initialRef = useRef(initialState);
  const listeners = useRef(new Set<() => void>());

  const get = () => store.current;

  const getServerSnapshot = () => initialRef.current;

  const set = (value: Partial<TData>) => {
    const prev = store.current;
    const next = { ...prev, ...value } as TData;

    // Only notify if state actually changed
    if (!isShallowEqual({ objA: prev, objB: next })) {
      store.current = next;
      for (const callback of listeners.current) callback();
    }
  };

  const reset = () => {
    store.current = initialRef.current;
    for (const callback of listeners.current) callback();
  };

  const subscribe = (callback: () => void) => {
    listeners.current.add(callback);
    return () => listeners.current.delete(callback);
  };

  return {
    get,
    getServerSnapshot,
    reset,
    set,
    subscribe,
  };
};
