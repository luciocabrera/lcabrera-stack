import { describe, expect, it } from 'vite-plus/test';

import type { ColumnSizingState } from '#ui/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

import { resolveSharedCellFields } from './resolveSharedCellFields.util';

type Row = Record<string, unknown>;

const BASE = {
  isLoadingState: false,
  pinnedOffsets: {},
  rowIndex: 2,
  rowKey: 'pk:[2]',
};

describe('resolveSharedCellFields', () => {
  it('starts an unsized column at its numeric width over the default minimum', () => {
    const fields = resolveSharedCellFields({
      ...BASE,
      col: { key: 'name', label: 'Name', width: 140 },
      columnSizing: {},
    });

    expect(fields.width).toBe(140);
    expect(fields.minWidth).toBe(DEFAULT_MIN_COLUMN_WIDTH);
    expect(fields.columnKey).toBe('name');
    expect(fields.kind).toBe('custom');
  });

  it('lets a stored size win over the declared width', () => {
    expect(
      resolveSharedCellFields({
        ...BASE,
        col: { key: 'name', label: 'Name', width: 140 },
        columnSizing: { name: 200 } as ColumnSizingState<Row>,
      }).width,
    ).toBe(200);
  });

  it('grows a fill column only while unsized, and carries static widths in the static layout', () => {
    const fill = { key: 'name', label: 'Name', width: 'fill' } as const;

    expect(
      resolveSharedCellFields({ ...BASE, col: fill, columnSizing: {} }).isFill,
    ).toBe(true);
    expect(
      resolveSharedCellFields({
        ...BASE,
        col: fill,
        columnSizing: { name: 90 } as ColumnSizingState<Row>,
      }).isFill,
    ).toBeUndefined();
    expect(
      resolveSharedCellFields({
        ...BASE,
        col: fill,
        columnSizing: {},
        layout: 'static',
      }).staticWidths?.width,
    ).toBe('100%');
  });
});
