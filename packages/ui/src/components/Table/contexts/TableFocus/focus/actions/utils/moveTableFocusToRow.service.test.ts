import { describe, expect, it } from 'vite-plus/test';

import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { getInitialFocusState } from '#ui/components/Table/contexts/TableFocus/focus/utils';

import { moveTableFocusToRow } from './moveTableFocusToRow.service';

const unsubscribe = () => {};

const focusStateFor = (
  overrides: Partial<TableFocusState>,
): TableFocusState => ({ ...getInitialFocusState(), ...overrides });

const createFocusStore = (initial: TableFocusState) => {
  let state = initial;

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

const targetedState = focusStateFor({
  columnKey: 'city',
  focusRequestId: 4,
  isGridFocused: true,
  rowIndex: 5,
  rowKey: 'pk:[5]',
});

describe('moveTableFocusToRow', () => {
  it('asks the DOM to follow while focus is already inside the grid', () => {
    const focusStore = createFocusStore(targetedState);

    moveTableFocusToRow({
      container: undefined,
      focusState: targetedState,
      focusStore,
      rowHeight: 40,
      rowIndex: 2,
      rowKey: 'grp:[["city","Paris"]]',
    });

    const next = focusStore.get();
    expect(next.rowKey).toBe('grp:[["city","Paris"]]');
    expect(next.rowIndex).toBe(2);
    expect(next.columnKey).toBe('city');
    expect(next.focusRequestId).toBe(5);
  });

  it('hands the tab stop back to the grid, because the focused node is going away', () => {
    const focusStore = createFocusStore(targetedState);

    moveTableFocusToRow({
      container: undefined,
      focusState: targetedState,
      focusStore,
      rowHeight: 40,
      rowIndex: 2,
      rowKey: 'grp:[["city","Paris"]]',
    });

    expect(focusStore.get().isGridFocused).toBe(false);
  });

  it('repositions the target quietly when focus is elsewhere on the page', () => {
    const focusState = focusStateFor({
      columnKey: 'city',
      focusRequestId: 4,
      isGridFocused: false,
      rowIndex: 5,
      rowKey: 'pk:[5]',
    });
    const focusStore = createFocusStore(focusState);

    moveTableFocusToRow({
      container: undefined,
      focusState,
      focusStore,
      rowHeight: 40,
      rowIndex: 2,
      rowKey: 'grp:[["city","Paris"]]',
    });

    const next = focusStore.get();
    expect(next.rowKey).toBe('grp:[["city","Paris"]]');
    expect(next.focusRequestId).toBe(4);
    expect(next.isGridFocused).toBe(false);
  });

  it('does nothing for a target row the grid never had a column for', () => {
    const focusState = getInitialFocusState();
    const focusStore = createFocusStore(focusState);

    moveTableFocusToRow({
      container: undefined,
      focusState,
      focusStore,
      rowHeight: 40,
      rowIndex: 2,
      rowKey: 'grp:[["city","Paris"]]',
    });

    expect(focusStore.get()).toStrictEqual(getInitialFocusState());
  });
});
