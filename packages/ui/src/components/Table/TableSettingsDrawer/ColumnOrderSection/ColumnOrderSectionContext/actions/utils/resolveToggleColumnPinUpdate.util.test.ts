import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveToggleColumnPinUpdate } from './resolveToggleColumnPinUpdate.util';

const { mockBuildAllOrderedColumns, mockResolveToggleColumnPinIntent } =
  vi.hoisted(() => ({
    mockBuildAllOrderedColumns: vi.fn(),
    mockResolveToggleColumnPinIntent: vi.fn(),
  }));

vi.mock(
  '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils',
  () => ({
    buildAllOrderedColumns: mockBuildAllOrderedColumns,
    resolveToggleColumnPinIntent: mockResolveToggleColumnPinIntent,
  }),
);

describe('resolveToggleColumnPinUpdate', () => {
  beforeEach(() => {
    mockBuildAllOrderedColumns.mockReset();
    mockResolveToggleColumnPinIntent.mockReset();
  });

  it('returns ignored-static when column is static', () => {
    const result = resolveToggleColumnPinUpdate({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      columns: [{ key: 'id', label: 'ID' }],
      columnsOrder: ['id'],
      isColumnStatic: true,
      isPinning: true,
      staticKeys: new Set(['id']),
    });

    expect(mockBuildAllOrderedColumns).not.toHaveBeenCalled();
    expect(mockResolveToggleColumnPinIntent).not.toHaveBeenCalled();
    expect(result).toEqual({ kind: 'ignored-static' });
  });

  it('builds ordered columns and delegates to resolveToggleColumnPinIntent', () => {
    mockBuildAllOrderedColumns.mockReturnValue([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ]);
    mockResolveToggleColumnPinIntent.mockReturnValue({
      kind: 'open-pin-side-modal',
      modal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: true,
      },
    });

    const result = resolveToggleColumnPinUpdate({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnsOrder: ['id', 'name'],
      globalPinSidePreference: undefined,
      globalUnpinConflictResolutionPreference: undefined,
      isColumnStatic: false,
      isPinning: true,
      staticKeys: new Set(['id']),
    });

    expect(mockBuildAllOrderedColumns).toHaveBeenCalledWith({
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnsOrder: ['id', 'name'],
    });
    expect(mockResolveToggleColumnPinIntent).toHaveBeenCalledWith({
      allOrderedColumns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      globalPinSidePreference: undefined,
      globalUnpinConflictResolutionPreference: undefined,
      isPinning: true,
      staticKeys: new Set(['id']),
    });
    expect(result).toEqual({
      kind: 'open-pin-side-modal',
      modal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: true,
      },
    });
  });
});
