import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveAcceptedOrderConflictState } from './resolveAcceptedOrderConflictState.util';

const {
  mockResolvePinOrderConflict,
  mockRestoreStaticColumnOrder,
  mockRestoreStaticPinnedColumns,
} = vi.hoisted(() => ({
  mockResolvePinOrderConflict: vi.fn(),
  mockRestoreStaticColumnOrder: vi.fn(),
  mockRestoreStaticPinnedColumns: vi.fn(),
}));

vi.mock(
  '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils',
  () => ({
    resolvePinOrderConflict: mockResolvePinOrderConflict,
    restoreStaticColumnOrder: mockRestoreStaticColumnOrder,
    restoreStaticPinnedColumns: mockRestoreStaticPinnedColumns,
  }),
);

describe('resolveAcceptedOrderConflictState', () => {
  beforeEach(() => {
    mockResolvePinOrderConflict.mockReset();
    mockRestoreStaticColumnOrder.mockReset();
    mockRestoreStaticPinnedColumns.mockReset();
  });

  it('resolves conflict and restores static order/pinning in sequence', () => {
    mockResolvePinOrderConflict.mockReturnValue({
      columnOrder: ['age', 'id', 'name'],
      columnPinning: { left: ['age'], right: ['name'] },
    });
    mockRestoreStaticColumnOrder.mockReturnValue(['id', 'age', 'name']);
    mockRestoreStaticPinnedColumns.mockReturnValue({
      left: ['id', 'age'],
      right: ['name'],
    });

    const result = resolveAcceptedOrderConflictState({
      currentOrder: ['id', 'name', 'age'],
      defaultPinning: { left: ['id'], right: [] },
      pendingOrder: ['age', 'id', 'name'],
      pendingPinning: { left: ['age'], right: ['name'] },
      resolution: 'pin-to-match-order',
      staticKeys: new Set(['id']),
    });

    expect(mockResolvePinOrderConflict).toHaveBeenCalledWith({
      columnPinning: { left: ['age'], right: ['name'] },
      newOrder: ['age', 'id', 'name'],
      resolution: 'pin-to-match-order',
    });
    expect(mockRestoreStaticColumnOrder).toHaveBeenCalledWith({
      currentOrder: ['id', 'name', 'age'],
      newOrder: ['age', 'id', 'name'],
      staticKeys: new Set(['id']),
    });
    expect(mockRestoreStaticPinnedColumns).toHaveBeenCalledWith({
      defaultPinning: { left: ['id'], right: [] },
      finalPinning: { left: ['age'], right: ['name'] },
      staticKeys: new Set(['id']),
    });
    expect(result).toEqual({
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id', 'age'], right: ['name'] },
    });
  });
});
