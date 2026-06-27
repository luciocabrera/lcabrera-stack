import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveOrderConflictUpdate } from './resolveOrderConflictUpdate.util';

const { mockGetHasPinOrderConflict } = vi.hoisted(() => ({
  mockGetHasPinOrderConflict: vi.fn(),
}));

vi.mock(
  '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils',
  () => ({
    getHasPinOrderConflict: mockGetHasPinOrderConflict,
  }),
);

describe('resolveOrderConflictUpdate', () => {
  beforeEach(() => {
    mockGetHasPinOrderConflict.mockReset();
  });

  it('returns a direct apply result when there is no pin-order conflict', () => {
    mockGetHasPinOrderConflict.mockReturnValue(false);

    const result = resolveOrderConflictUpdate({
      columnPinning: { left: ['id'], right: [] },
      conflictDescription: 'conflict description',
      newOrder: ['id', 'name', 'age'],
      staticKeys: new Set(['id']),
    });

    expect(mockGetHasPinOrderConflict).toHaveBeenCalledWith({
      columnPinning: { left: ['id'], right: [] },
      newOrder: ['id', 'name', 'age'],
      staticKeys: new Set(['id']),
    });
    expect(result).toEqual({
      kind: 'apply-order',
      newOrder: ['id', 'name', 'age'],
      pendingPinning: { left: ['id'], right: [] },
    });
  });

  it('opens the conflict modal when there is a conflict and no saved preference', () => {
    mockGetHasPinOrderConflict.mockReturnValue(true);

    const result = resolveOrderConflictUpdate({
      columnPinning: { left: ['id'], right: ['name'] },
      conflictDescription: 'conflict description',
      newOrder: ['age', 'id', 'name'],
      staticKeys: new Set(['id']),
    });

    expect(result).toEqual({
      kind: 'open-conflict',
      orderConflict: {
        description: 'conflict description',
        isOpen: true,
        pendingOrder: ['age', 'id', 'name'],
        pendingPinning: { left: ['id'], right: ['name'] },
      },
    });
  });

  it('auto-accepts with the saved resolution when a preference exists', () => {
    mockGetHasPinOrderConflict.mockReturnValue(true);

    const result = resolveOrderConflictUpdate({
      columnPinning: { left: ['id'], right: ['name'] },
      conflictDescription: 'conflict description',
      newOrder: ['age', 'id', 'name'],
      orderConflictResolutionPreference: 'pin-to-match-order',
      staticKeys: new Set(['id']),
    });

    expect(result).toEqual({
      kind: 'auto-accept-conflict',
      orderConflict: {
        description: 'conflict description',
        isOpen: false,
        pendingOrder: ['age', 'id', 'name'],
        pendingPinning: { left: ['id'], right: ['name'] },
      },
      resolution: 'pin-to-match-order',
    });
  });
});
