import { isShallowEqual } from '@lcabrera/utils/comparison/is-shallow-equal.util';
import { useRef } from 'react';

export type TStore<TData> = {
  get: () => TData;
  getServerSnapshot: () => TData;
  reset: () => void;
  set: (value: Partial<TData>) => void;
  subscribe: (callback: () => void) => () => void;
};

/** Read through `useStoreSelector` — it owns the `useSyncExternalStore` wiring. */
export const useStore = <TData extends Record<string, unknown>>(
  initialState: TData,
) => {
  const store = useRef(initialState);
  const initialRef = useRef(initialState);
  const listeners = useRef(new Set<() => void>());

  const get = () => store.current;

  const getServerSnapshot = () => initialRef.current;

  const set = (value: Partial<TData>) => {
    const prev = store.current;
    const next = { ...prev, ...value } as TData;

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
