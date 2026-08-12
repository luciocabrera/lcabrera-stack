import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnsState,
  TableDataState,
  TableFocusState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import {
  getInitialColumnsState,
  getInitialMetaState,
} from '#ui/components/Table/contexts/TableConfig/utils';
import { getInitialDataState } from '#ui/components/Table/contexts/TableData/utils';
import { getInitialFocusState } from '#ui/components/Table/contexts/TableFocus/focus/utils';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveGridFocusContext } from './resolveGridFocusContext.util';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'city', label: 'City' },
];

const rows: readonly Row[] = [
  { city: 'A', id: 1 },
  { city: 'B', id: 2 },
  { city: 'C', id: 3 },
];

const columnsState = getInitialColumnsState<Row>({
  columns,
}) as TableColumnsState<Row>;

const dataState = getInitialDataState<Row>({
  data: rows,
  totalRows: rows.length,
}) as TableDataState<Row>;

const metaState = getInitialMetaState({ rowHeight: 44 }) as TableMetaState;

const focusStateFor = (
  overrides: Partial<TableFocusState>,
): TableFocusState => ({
  ...getInitialFocusState(),
  ...overrides,
});

const rowKeyAt = (index: number) =>
  resolveRowKey({ columns, index, row: rows[index] ?? {} });

describe('resolveGridFocusContext', () => {
  it('derives the navigable columns, the data and the row height in one read', () => {
    const context = resolveGridFocusContext({
      columnsState,
      dataState,
      focusState: focusStateFor({}),
      metaState,
    });

    expect(context.columnKeys).toEqual(['id', 'city']);
    expect(context.columns).toBe(columnsState.columns);
    expect(context.data).toBe(rows);
    expect(context.rowHeight).toBe(44);
  });

  it('answers no focused row index while the grid holds no target', () => {
    const context = resolveGridFocusContext({
      columnsState,
      dataState,
      focusState: focusStateFor({}),
      metaState,
    });

    expect(context.focusedRowIndex).toBeUndefined();
  });

  it('resolves the focused row against the rows loaded now', () => {
    const context = resolveGridFocusContext({
      columnsState,
      dataState,
      focusState: focusStateFor({
        columnKey: 'city',
        rowIndex: 0,
        rowKey: rowKeyAt(2),
      }),
      metaState,
    });

    // The stored index is stale — identity is what decides, not position.
    expect(context.focusedRowIndex).toBe(2);
  });
});
