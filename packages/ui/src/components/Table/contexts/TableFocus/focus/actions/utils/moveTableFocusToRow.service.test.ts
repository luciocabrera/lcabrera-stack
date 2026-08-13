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
    // The request id is what a mounted cell watches to take DOM focus.
    expect(next.focusRequestId).toBe(5);
  });

  it('hands the tab stop back to the grid, because the focused node is going away', () => {
    // The discriminating case: the cell that held DOM focus is removed by the
    // same interaction, so its own release cannot fire — the store no longer
    // names it. Without this the grid is left with no `tabIndex={0}` anywhere
    // and stops being reachable by Tab at all.
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
    // A collapse is not the user asking for focus. Raising a request here would
    // yank focus back into the grid from whatever they had moved on to.
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
