import { describe, expect, it } from 'vite-plus/test';

import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { getInitialFocusState } from '#ui/components/Table/contexts/TableFocus/focus/utils';

import { setTableFocusTarget } from './setTableFocusTarget.service';

const unsubscribe = () => {};

const createFocusStore = (initial: Partial<TableFocusState> = {}) => {
  let state: TableFocusState = { ...getInitialFocusState(), ...initial };

  const store: TStore<TableFocusState> = {
    get: () => state,
    getServerSnapshot: () => state,
    reset: () => {},
    set: (value) => {
      state = { ...state, ...value };
    },
    subscribe: () => unsubscribe,
  };

  return store;
};

describe('setTableFocusTarget', () => {
  it('records the target and raises a request for it', () => {
    const focusStore = createFocusStore();

    setTableFocusTarget({
      columnKey: 'id',
      focusStore,
      rowIndex: 7,
      rowKey: 'pk:[7]',
    });

    expect(focusStore.get()).toEqual({
      columnKey: 'id',
      focusRequestId: 1,
      isGridFocused: true,
      rowIndex: 7,
      rowKey: 'pk:[7]',
    });
  });

  it('raises a new request even for the cell that already holds focus', () => {
    // Re-entering the grid asks for the same cell again, and the cell watches
    // the id: a boolean would already be set and the re-entry would be lost.
    const focusStore = createFocusStore({
      columnKey: 'id',
      focusRequestId: 3,
      isGridFocused: true,
      rowIndex: 7,
      rowKey: 'pk:[7]',
    });

    setTableFocusTarget({
      columnKey: 'id',
      focusStore,
      rowIndex: 7,
      rowKey: 'pk:[7]',
    });

    expect(focusStore.get().focusRequestId).toBe(4);
  });
});
