import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveAcceptedPinSideUpdate } from './resolveAcceptedPinSideUpdate.util';

const { mockBuildAllOrderedColumns, mockDerivePinSideResolutionState } =
  vi.hoisted(() => ({
    mockBuildAllOrderedColumns: vi.fn(),
    mockDerivePinSideResolutionState: vi.fn(),
  }));

vi.mock(
  '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils',
  () => ({
    buildAllOrderedColumns: mockBuildAllOrderedColumns,
    derivePinSideResolutionState: mockDerivePinSideResolutionState,
  }),
);

describe('resolveAcceptedPinSideUpdate', () => {
  beforeEach(() => {
    mockBuildAllOrderedColumns.mockReset();
    mockDerivePinSideResolutionState.mockReset();
  });

  it('returns resolved update when pin side resolution succeeds', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ]);
    mockDerivePinSideResolutionState.mockReturnValue({
      columnOrder: ['id', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      kind: 'resolved',
      side: 'right',
    });

    const result = resolveAcceptedPinSideUpdate({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnsOrder: ['id', 'name'],
      pinSide: 'right',
      staticKeys: new Set(['id']),
    });

    expect(result).toEqual({
      columnOrder: ['id', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      kind: 'apply-resolved',
    });
  });

  it('opens conflict modal when unresolved and no preference', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ]);
    mockDerivePinSideResolutionState.mockReturnValue({
      kind: 'conflict',
      side: 'left',
    });

    const result = resolveAcceptedPinSideUpdate({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnsOrder: ['id', 'name'],
      pinSide: 'left',
    });

    expect(result).toEqual({
      conflictModal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: true,
        side: 'left',
      },
      kind: 'open-conflict-modal',
    });
  });

  it('auto-accepts conflict when preference is set', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ]);
    mockDerivePinSideResolutionState.mockReturnValue({
      kind: 'conflict',
      side: 'right',
    });

    const result = resolveAcceptedPinSideUpdate({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnsOrder: ['id', 'name'],
      pinConflictResolutionPreference: 'move-column',
      pinSide: 'right',
    });

    expect(result).toEqual({
      conflictModal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: false,
        side: 'right',
      },
      kind: 'auto-accept-conflict',
      resolution: 'move-column',
    });
  });
});
