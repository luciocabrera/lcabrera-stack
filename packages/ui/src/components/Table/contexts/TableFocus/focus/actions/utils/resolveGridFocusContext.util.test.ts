import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnsState,
  TableDataState,
  TableFocusState,
  TableGroupExpansionState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import {
  getInitialColumnsState,
  getInitialExpansionState,
  getInitialGroupingState,
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

const groupingState: TableGroupingState = getInitialGroupingState({});

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
      groupingState,
      metaState,
      onDrillGroup: undefined,
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
      groupingState,
      metaState,
      onDrillGroup: undefined,
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
      groupingState,
      metaState,
      onDrillGroup: undefined,
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
      groupingState,
      metaState,
      onDrillGroup: undefined,
    });
    const context = resolveGridFocusContext({
      columnsState,
      dataState: groupedDataState,
      expansionState: collapsed,
      focusState: focusStateFor({}),
      groupingState,
      metaState,
      onDrillGroup: undefined,
    });

    expect(expanded.data).toHaveLength(3);
    expect(context.data).toHaveLength(1);
    expect(context.rowMeta?.[0]?.isExpanded).toBe(false);
  });
});

describe('resolveGridFocusContext — a drilled group', () => {
  // One leaf group over one key, so the group row is drillable and its page can
  // be spliced under it.
  const leafRow: Row = {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 9,
      isSubtotal: false,
      path: groupPath,
    },
  };

  const drilledState = getInitialDataState<Row>({
    data: [leafRow],
    totalRows: 1,
  }) as TableDataState<Row>;

  const withDrill = (expansion: TableGroupExpansionState) =>
    resolveGridFocusContext({
      columnsState,
      dataState: drilledState,
      expansionState: expansion,
      focusState: focusStateFor({}),
      groupingState: { ...groupingState, keys: ['city'] },
      metaState: { ...metaState, isGroupDrillEnabled: true },
      // Both halves must be present for a row to be drillable — the flag alone
      // would leave the affordance offered and permanently inert.
      onDrillGroup: async () => [],
    });

  it('navigates the rows a drill added, not the rows without them', () => {
    // The focus model and the body must derive the same array. Resolved without
    // the drill inputs this returns one row, and every index past the open
    // drill addresses a different row than the one painted there (ADR-079).
    const drilled = withDrill({
      ...expansionState,
      drilledGroups: new Map([
        [
          resolveGroupPathKey(groupPath),
          { rows: [{ city: 'A', id: 7 }], status: 'loaded' as const },
        ],
      ]),
    });

    // The group row, its one fetched row, and the hand-off for the other eight.
    expect(drilled.data).toHaveLength(3);
    expect(drilled.rowMeta).toHaveLength(3);
  });

  it('leaves the array alone when nothing has been drilled', () => {
    expect(withDrill(expansionState).data).toHaveLength(1);
  });

  it('marks no row drillable when the route declared the capability but no fetcher', () => {
    // The flag says the endpoint exists; the fetcher is the call that reaches
    // it. With only the first, every leaf would carry a chevron and an
    // `aria-expanded` whose every use does nothing.
    const context = resolveGridFocusContext({
      columnsState,
      dataState: drilledState,
      expansionState,
      focusState: focusStateFor({}),
      groupingState: { ...groupingState, keys: ['city'] },
      metaState: { ...metaState, isGroupDrillEnabled: true },
      onDrillGroup: undefined,
    });

    expect(context.rowMeta?.[0]?.isDrillable).toBe(false);
  });

  it('marks the leaf drillable once both halves are present', () => {
    expect(withDrill(expansionState).rowMeta?.[0]?.isDrillable).toBe(true);
  });
});
