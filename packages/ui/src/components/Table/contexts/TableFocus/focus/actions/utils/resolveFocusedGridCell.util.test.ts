import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupTreeRowMeta } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveTableGroupTree.util';
import type { TableFocusState } from '#ui/components/Table/Table.types';

import { getInitialFocusState } from '#ui/components/Table/contexts/TableFocus/focus/utils';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { resolveFocusedGridCell } from './resolveFocusedGridCell.util';

type Row = Record<string, unknown>;

const COLUMN_KEYS = ['id', 'city'];

const GROUP_PATH = [{ columnKey: 'city', label: 'Paris', value: 'Paris' }];

const DATA: readonly Row[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 2,
      isSubtotal: false,
      path: GROUP_PATH,
    },
  },
  { city: 'Paris', id: 1 },
];

const META: readonly TableGroupTreeRowMeta[] = [
  {
    hasChildren: true,
    isExpanded: true,
    level: 1,
    levelDisclosures: [],
    pathKey: 'city:Paris',
    posInSet: 1,
    setSize: 1,
  },
];

type ResolveArgs = {
  readonly columnKey?: string;
  readonly focusedRowIndex?: number;
};

const resolve = ({
  columnKey = 'city',
  focusedRowIndex = 0,
}: ResolveArgs = {}) =>
  resolveFocusedGridCell<Row>({
    columnKeys: COLUMN_KEYS,
    data: DATA,
    focusedRowIndex,
    focusState: { ...getInitialFocusState(), columnKey } as TableFocusState,
    rowMeta: META,
  });

describe('resolveFocusedGridCell', () => {
  it('resolves the focused column to its index', () => {
    expect(resolve().columnIndex).toBe(1);
  });

  it('carries the focused row’s tree metadata', () => {
    expect(resolve().meta?.hasChildren).toBe(true);
  });

  it('carries a group row’s path, which is what expansion is keyed by', () => {
    expect(resolve().groupPath).toEqual(GROUP_PATH);
  });

  it('reports no group path for a detail row', () => {
    expect(resolve({ focusedRowIndex: 1 }).groupPath).toBeUndefined();
  });

  it('reports no focused cell before the grid has been entered', () => {
    // Focus legitimately points at nothing, and at a row outside the window —
    // the caller's job is to move it rather than to object (ADR-062).
    // Called directly: a default parameter would substitute an index back in.
    const cell = resolveFocusedGridCell<Row>({
      columnKeys: COLUMN_KEYS,
      data: DATA,
      focusedRowIndex: undefined,
      focusState: {
        ...getInitialFocusState(),
        columnKey: 'city',
      } as TableFocusState,
      rowMeta: META,
    });

    expect(cell.hasFocusedCell).toBe(false);
    expect(cell.meta).toBeUndefined();
    expect(cell.groupPath).toBeUndefined();
  });

  it('reports no focused cell when the column is not focusable', () => {
    const cell = resolve({ columnKey: 'gone' });

    expect(cell.columnIndex).toBe(-1);
    expect(cell.hasFocusedCell).toBe(false);
  });

  it('reports no group path for a row index past the visible rows', () => {
    expect(resolve({ focusedRowIndex: 99 }).groupPath).toBeUndefined();
  });
});
