import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnsState,
  TableDataState,
  TableFocusState,
  TableGroupExpansionState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import {
  getInitialColumnsState,
  getInitialExpansionState,
  getInitialMetaState,
} from '#ui/components/Table/contexts/TableConfig/utils';
import { getInitialDataState } from '#ui/components/Table/contexts/TableData/utils';
import { getInitialFocusState } from '#ui/components/Table/contexts/TableFocus/focus/utils';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
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

const groupPath = [{ columnKey: 'city', label: 'A', value: 'A' }];

const groupedRows: readonly Row[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 2,
      isSubtotal: false,
      path: groupPath,
    },
  },
  { city: 'A', id: 1 },
  { city: 'A', id: 2 },
];

const expansionState = getInitialExpansionState();

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
      expansionState,
      focusState: focusStateFor({}),
      metaState,
    });

    expect(context.columnKeys).toEqual(['id', 'city']);
    expect(context.columns).toBe(columnsState.columns);
    // Ungrouped rows come back by reference: no tree, no per-row allocation.
    expect(context.data).toBe(rows);
    expect(context.rowMeta).toBeUndefined();
    expect(context.rowHeight).toBe(44);
  });

  it('answers no focused row index while the grid holds no target', () => {
    const context = resolveGridFocusContext({
      columnsState,
      dataState,
      expansionState,
      focusState: focusStateFor({}),
      metaState,
    });

    expect(context.focusedRowIndex).toBeUndefined();
  });

  it('resolves the focused row against the rows loaded now', () => {
    const context = resolveGridFocusContext({
      columnsState,
      dataState,
      expansionState,
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

  it('navigates the rows a collapse leaves standing, not every loaded row', () => {
    // The discriminating case: a row hidden under a collapsed ancestor has no
    // cell to receive focus, so a move that still counted it would consume a
    // key press and land nowhere.
    const groupedDataState = getInitialDataState<Row>({
      data: groupedRows,
      totalRows: groupedRows.length,
    }) as TableDataState<Row>;
    const collapsed: TableGroupExpansionState = {
      collapsedGroupPaths: new Set([resolveGroupPathKey(groupPath)]),
      drilledGroups: new Map(),
    };

    const expanded = resolveGridFocusContext({
      columnsState,
      dataState: groupedDataState,
      expansionState,
      focusState: focusStateFor({}),
      metaState,
    });
    const context = resolveGridFocusContext({
      columnsState,
      dataState: groupedDataState,
      expansionState: collapsed,
      focusState: focusStateFor({}),
      metaState,
    });

    expect(expanded.data).toHaveLength(3);
    expect(context.data).toHaveLength(1);
    expect(context.rowMeta?.[0]?.isExpanded).toBe(false);
  });
});
