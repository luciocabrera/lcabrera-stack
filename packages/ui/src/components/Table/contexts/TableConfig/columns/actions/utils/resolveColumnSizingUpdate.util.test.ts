import { describe, expect, it } from 'vite-plus/test';

import type { ColumnSizingState } from '#ui/components/Table/Table.types';

import { resolveColumnSizingUpdate } from './resolveColumnSizingUpdate.util';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

describe('resolveColumnSizingUpdate', () => {
  it('updates the width map and recomputes pinned offsets', () => {
    const result = resolveColumnSizingUpdate<Row>({
      columnKey: 'name',
      columnPinning: { left: ['id', 'name'], right: [] },
      columnSizingState: { id: 100, name: 150 } as ColumnSizingState<Row>,
      effectiveColumns: [
        { key: 'id', label: 'ID', minWidth: 80 },
        { key: 'name', label: 'Name', minWidth: 120 },
        { key: 'age', label: 'Age', minWidth: 90 },
      ],
      width: 200,
    });

    expect(result.columnSizing).toEqual({ id: 100, name: 200 });
    expect(result.pinnedColumnOffsets).toEqual({
      id: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: false,
        offset: 0,
        side: 'left',
      },
      name: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 100,
        side: 'left',
      },
    });
  });

  it('removes an explicit width and falls back to minWidth for pinned offsets', () => {
    const result = resolveColumnSizingUpdate<Row>({
      columnKey: 'name',
      columnPinning: { left: ['id', 'name'], right: [] },
      columnSizingState: { id: 100, name: 150 } as ColumnSizingState<Row>,
      effectiveColumns: [
        { key: 'id', label: 'ID', minWidth: 80 },
        { key: 'name', label: 'Name', minWidth: 120 },
      ],
      width: undefined,
    });

    expect(result.columnSizing).toEqual({ id: 100 });
    expect(result.pinnedColumnOffsets.name).toEqual({
      isFirstPinnedRight: false,
      isLastPinnedLeft: true,
      offset: 100,
      side: 'left',
    });
  });
});
