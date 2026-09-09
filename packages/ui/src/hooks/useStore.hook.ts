import { isShallowEqual } from '@lcabrera/utils/comparison/is-shallow-equal.util';
import { useState } from 'react';

export type TStore<TData> = {
  get: () => TData;
  getServerSnapshot: () => TData;
  reset: () => void;
  set: (value: Partial<TData>) => void;
  subscribe: (callback: () => void) => () => void;
};

export const useStore = <TData extends Record<string, unknown>>(
  initialState: TData,
) => {
  const [api] = useState(() => {
    let current = initialState;
    const initial = initialState;
    const listeners = new Set<() => void>();

    const get = () => current;

    const getServerSnapshot = () => initial;

    const set = (value: Partial<TData>) => {
      const next = { ...current, ...value } as TData;

      if (!isShallowEqual({ objA: current, objB: next })) {
        current = next;
        for (const callback of listeners) callback();
      }
    };

    const reset = () => {
      current = initial;
      for (const callback of listeners) callback();
    };

    const subscribe = (callback: () => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    };

    return {
      get,
      getServerSnapshot,
      reset,
      set,
      subscribe,
    };
  });

  return api;
};
