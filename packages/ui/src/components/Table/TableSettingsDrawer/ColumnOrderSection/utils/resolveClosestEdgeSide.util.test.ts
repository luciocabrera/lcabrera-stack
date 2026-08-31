import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveClosestEdgeSide } from './resolveClosestEdgeSide.util';

type Row = { actions: string; age: number; id: string; name: string };

const cols: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
  { dataType: 'string', key: 'actions', label: 'Actions' },
];

describe('resolveClosestEdgeSide', () => {
  it('returns explicit left side directly', () => {
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: 'age',
        pinSide: 'left',
      }),
    ).toBe('left');
  });

  it('returns explicit right side directly', () => {
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: 'age',
        pinSide: 'right',
      }),
    ).toBe('right');
  });

  it('resolves closest-edge to left for column in first half', () => {
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: 'id',
        pinSide: 'closest-edge',
      }),
    ).toBe('left');
  });

  it('resolves closest-edge to right for column in second half', () => {
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: 'actions',
        pinSide: 'closest-edge',
      }),
    ).toBe('right');
  });

  it('resolves closest-edge to right for column at midpoint', () => {
    expect(
      resolveClosestEdgeSide({
        allOrderedColumns: cols,
        columnKey: 'age',
        pinSide: 'closest-edge',
      }),
    ).toBe('right');
  });
});
