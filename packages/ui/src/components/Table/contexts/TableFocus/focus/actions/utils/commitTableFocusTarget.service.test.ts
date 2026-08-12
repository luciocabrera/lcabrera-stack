// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vite-plus/test';

import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { getInitialFocusState } from '#ui/components/Table/contexts/TableFocus/focus/utils';

import { commitTableFocusTarget } from './commitTableFocusTarget.service';

const ROW_HEIGHT = 40;

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

const createContainer = () => {
  const container = document.createElement('div');

  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: 400 },
    scrollTop: { configurable: true, value: 0, writable: true },
  });

  return container;
};

describe('commitTableFocusTarget', () => {
  it('stores the target, marks the grid focused and raises a request', () => {
    const focusStore = createFocusStore({ focusRequestId: 4 });

    commitTableFocusTarget({
      columnKey: 'city',
      container: createContainer(),
      focusStore,
      rowHeight: ROW_HEIGHT,
      rowIndex: 3,
      rowKey: 'pk:[3]',
    });

    expect(focusStore.get()).toEqual({
      columnKey: 'city',
      focusRequestId: 5,
      isGridFocused: true,
      rowIndex: 3,
      rowKey: 'pk:[3]',
    });
  });

  it('scrolls the row in before the request that will focus it', () => {
    // The order is the contract: a request raised before the row is on its way
    // in would be applied against a window that has not moved yet.
    const container = createContainer();
    const order: string[] = [];

    Object.defineProperty(container, 'scrollTop', {
      configurable: true,
      get: () => 0,
      set: () => {
        order.push('scroll');
      },
    });

    const focusStore = createFocusStore();
    const set = vi.fn(focusStore.set);

    commitTableFocusTarget({
      columnKey: 'city',
      container,
      focusStore: {
        ...focusStore,
        set: (value) => {
          order.push('set');
          set(value);
        },
      },
      rowHeight: ROW_HEIGHT,
      rowIndex: 300,
      rowKey: 'pk:[300]',
    });

    expect(order).toEqual(['scroll', 'set']);
  });

  it('still records the target when there is no container to scroll', () => {
    const focusStore = createFocusStore();

    commitTableFocusTarget({
      columnKey: 'city',
      container: undefined,
      focusStore,
      rowHeight: ROW_HEIGHT,
      rowIndex: 2,
      rowKey: 'pk:[2]',
    });

    expect(focusStore.get().rowKey).toBe('pk:[2]');
    expect(focusStore.get().focusRequestId).toBe(1);
  });
});
