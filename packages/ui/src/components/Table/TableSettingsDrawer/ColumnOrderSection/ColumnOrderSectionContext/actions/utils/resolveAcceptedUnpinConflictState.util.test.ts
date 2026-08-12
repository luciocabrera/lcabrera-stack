import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { resolveAcceptedUnpinConflictState } from './resolveAcceptedUnpinConflictState.util';

const { mockBuildAllOrderedColumns, mockInsertAdjacentToPinnedGroup } =
  vi.hoisted(() => ({
    mockBuildAllOrderedColumns: vi.fn(),
    mockInsertAdjacentToPinnedGroup: vi.fn(),
  }));

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils',
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

  it('unpins the keys at and before the index for unpin-beyond on the right', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ]);

    const result = resolveAcceptedUnpinConflictState({
      columnKey: 'name',
      columnPinning: { left: [], right: ['name', 'age'] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      columnsOrder: ['id', 'name', 'age'],
      resolution: 'unpin-beyond',
      side: 'right',
    });

    expect(result).toEqual({
      columnPinning: { left: [], right: ['age'] },
      kind: 'update-pinning',
    });
    expect(mockInsertAdjacentToPinnedGroup).not.toHaveBeenCalled();
  });

  // Pins pre-existing behaviour rather than endorsing it: an absent `columnKey`
  // leaves `index` at -1, and `slice(-1)` is the last element rather than the
  // whole array — so the left branch unpins only the final column while the
  // right branch (`slice(0, 0)`) is a no-op. Asymmetric and almost certainly not
  // intended; see the follow-up issue before relying on either shape.
  it('unpins only the last column when the columnKey is absent', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ]);

    const result = resolveAcceptedUnpinConflictState({
      columnKey: 'missing',
      columnPinning: { left: ['id', 'age'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
        { key: 'missing', label: 'Missing' },
      ],
      columnsOrder: ['id', 'name', 'age'],
      resolution: 'unpin-beyond',
      side: 'left',
    });

    expect(result).toEqual({
      columnPinning: { left: ['id'], right: [] },
      kind: 'update-pinning',
    });
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
