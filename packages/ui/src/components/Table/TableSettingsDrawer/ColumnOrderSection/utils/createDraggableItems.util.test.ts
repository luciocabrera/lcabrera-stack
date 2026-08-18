import { describe, expect, it, vi } from 'vite-plus/test';

import { createDraggableItems } from './createDraggableItems.util';

describe('createDraggableItems', () => {
  it('maps ordered columns into draggable item metadata and delegates content rendering', () => {
    const renderItemContent = vi.fn(({ label }: { readonly label: string }) => {
      return `content:${label}`;
    });

    const result = createDraggableItems({
      allOrderedColumns: [
        { isStatic: true, key: 'name', label: 'Name' },
        { key: 'id', label: 'ID' },
      ],
      columnPinning: { left: ['id'], right: [] },
      columnVisibility: new Set(['name']),
      groupingKeys: [],
      renderItemContent,
    });

    expect(renderItemContent).toHaveBeenNthCalledWith(1, {
      columnKey: 'name',
      isGroupKey: false,
      isPinned: false,
      isStatic: true,
      isVisible: false,
      label: 'Name',
    });
    expect(renderItemContent).toHaveBeenNthCalledWith(2, {
      columnKey: 'id',
      isGroupKey: false,
      isPinned: true,
      isStatic: false,
      isVisible: true,
      label: 'ID',
    });
    expect(result).toEqual([
      {
        content: 'content:Name',
        id: 'name',
        isDraggable: false,
      },
      {
        content: 'content:ID',
        id: 'id',
        isDraggable: true,
      },
    ]);
  });

  it('locks a group key against dragging without marking it static', () => {
    const renderItemContent = vi.fn(
      ({ isGroupKey, isStatic }: Record<string, unknown>) =>
        `${String(isGroupKey)}:${String(isStatic)}`,
    );

    const result = createDraggableItems({
      allOrderedColumns: [
        { key: 'status', label: 'Status' },
        { key: 'amount', label: 'Amount' },
      ],
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set<string>(),
      groupingKeys: ['status'],
      renderItemContent,
    });

    // Undraggable for its own reason: the hoist would silently undo the drag.
    // `isStatic` stays false, so the key keeps its width and its header menu —
    // borrowing that flag is exactly what ADR-080 refuses.
    expect(result[0]).toMatchObject({ id: 'status', isDraggable: false });
    expect(result[0]?.content).toBe('true:false');
    expect(result[1]).toMatchObject({ id: 'amount', isDraggable: true });
    expect(result[1]?.content).toBe('false:false');
  });
});
