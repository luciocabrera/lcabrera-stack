export type MockStore<TState> = {
  readonly get: () => TState;
  readonly getServerSnapshot: () => TState;
  readonly reset: (nextState: TState) => void;
  readonly set: (partial: Partial<TState>) => void;
  readonly subscribe: (listener: () => void) => () => void;
};

export const createMockStore = <TState>(
  initialState: TState,
): MockStore<TState> => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    getServerSnapshot: () => state,
    reset: (nextState) => {
      state = nextState;
      for (const listener of listeners) {
        listener();
      }
    },
    set: (partial) => {
      state = { ...state, ...partial };
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
