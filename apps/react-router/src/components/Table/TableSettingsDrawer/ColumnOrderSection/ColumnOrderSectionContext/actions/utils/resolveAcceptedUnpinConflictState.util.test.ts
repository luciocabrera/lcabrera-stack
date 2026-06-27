import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveAcceptedUnpinConflictState } from './resolveAcceptedUnpinConflictState.util';

const { mockBuildAllOrderedColumns, mockInsertAdjacentToPinnedGroup } =
  vi.hoisted(() => ({
    mockBuildAllOrderedColumns: vi.fn(),
    mockInsertAdjacentToPinnedGroup: vi.fn(),
  }));

vi.mock(
  '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils',
  () => ({
    buildAllOrderedColumns: mockBuildAllOrderedColumns,
    insertAdjacentToPinnedGroup: mockInsertAdjacentToPinnedGroup,
  }),
);

describe('resolveAcceptedUnpinConflictState', () => {
  beforeEach(() => {
    mockBuildAllOrderedColumns.mockReset();
    mockInsertAdjacentToPinnedGroup.mockReset();
  });

  it('returns pinning-only update for unpin-beyond', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ]);

    const result = resolveAcceptedUnpinConflictState({
      columnKey: 'name',
      columnPinning: { left: ['id', 'name'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      columnsOrder: ['id', 'name', 'age'],
      resolution: 'unpin-beyond',
      side: 'left',
    });

    expect(result).toEqual({
      columnPinning: { left: ['id'], right: [] },
      kind: 'update-pinning',
    });
    expect(mockInsertAdjacentToPinnedGroup).not.toHaveBeenCalled();
  });

  it('returns order+pinning update for reorder-to-fill', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ]);
    mockInsertAdjacentToPinnedGroup.mockReturnValue(['id', 'age', 'name']);

    const result = resolveAcceptedUnpinConflictState({
      columnKey: 'name',
      columnPinning: { left: ['id', 'name'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      columnsOrder: ['id', 'name', 'age'],
      resolution: 'reorder-to-fill',
      side: 'left',
    });

    expect(mockInsertAdjacentToPinnedGroup).toHaveBeenCalledWith({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      order: ['id', 'age'],
      side: 'left',
    });
    expect(result).toEqual({
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: [] },
      kind: 'update-order-and-pinning',
    });
  });
});
