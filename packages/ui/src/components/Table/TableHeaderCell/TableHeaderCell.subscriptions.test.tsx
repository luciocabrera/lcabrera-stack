// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { Profiler } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { MockStore } from '#ui/utils/tests/createMockStore.util';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

const COLUMN_KEYS = ['col0', 'col1', 'col2', 'col3'] as const;

const createColumnsState = () => ({
  columnPinning: { left: [], right: [] },
  columnSizing: Object.fromEntries(COLUMN_KEYS.map((key) => [key, 100])),
  effectiveColumns: COLUMN_KEYS.map((key) => ({ key })),
  normalizedColumns: Object.fromEntries(
    COLUMN_KEYS.map((key) => [
      key,
      {
        isResizable: true,
        isSortable: false,
        isStatic: false,
        key,
        label: key,
      },
    ]),
  ),
  pinnedColumnOffsets: {},
});

type ColumnsState = ReturnType<typeof createColumnsState>;

const storesRef: {
  columnsStore: MockStore<ColumnsState>;
  metaStore: MockStore<Record<string, never>>;
} = {
  columnsStore: createMockStore(createColumnsState()),
  metaStore: createMockStore({}),
};

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: storesRef.columnsStore,
      metaStore: storesRef.metaStore,
    }),
  }),
);

// Isolate the store-subscription behaviour: mock the two heavy children so the
// only thing that can re-render a cell is its own selector subscription, not
// ResizeHandle's useColumnResize wiring or the actions menu.
vi.mock('./ResizeHandle', () => ({ ResizeHandle: () => <></> }));
vi.mock('./TableHeaderActionsMenu', () => ({
  TableHeaderActionsMenu: () => <></>,
}));

import { TableHeaderCell } from './TableHeaderCell.component';

afterEach(() => {
  cleanup();
  storesRef.columnsStore = createMockStore(createColumnsState());
  storesRef.metaStore = createMockStore({});
});

type WriteWidthArgs = {
  readonly columnKey: string;
  readonly width: number;
};

const writeWidth = ({ columnKey, width }: WriteWidthArgs) => {
  const state = storesRef.columnsStore.get();
  storesRef.columnsStore.set({
    columnSizing: { ...state.columnSizing, [columnKey]: width },
    pinnedColumnOffsets: {},
  });
};

const renderCells = (onCellRender: (columnKey: string) => void) =>
  render(
    <table>
      <thead>
        <tr>
          {COLUMN_KEYS.map((key) => (
            <Profiler id={key} key={key} onRender={() => onCellRender(key)}>
              <TableHeaderCell columnKey={key} />
            </Profiler>
          ))}
        </tr>
      </thead>
    </table>,
  );

describe('TableHeaderCell store subscriptions', () => {
  it('re-renders only the resized header cell when one column width changes', () => {
    const renders = new Map<string, number>();
    const bump = (key: string) => renders.set(key, (renders.get(key) ?? 0) + 1);

    renderCells(bump);

    expect(COLUMN_KEYS.map((key) => renders.get(key))).toEqual([1, 1, 1, 1]);
    renders.clear();

    act(() => {
      writeWidth({ columnKey: 'col0', width: 240 });
    });

    const rerendered = COLUMN_KEYS.filter((key) => (renders.get(key) ?? 0) > 0);

    expect(rerendered).toEqual(['col0']);
  });
});
