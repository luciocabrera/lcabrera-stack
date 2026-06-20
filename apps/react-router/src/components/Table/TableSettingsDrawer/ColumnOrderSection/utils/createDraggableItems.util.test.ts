import { describe, expect, it, vi } from 'vitest';

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
      renderItemContent,
    });

    expect(renderItemContent).toHaveBeenNthCalledWith(1, {
      columnKey: 'name',
      isPinned: false,
      isStatic: true,
      isVisible: false,
      label: 'Name',
    });
    expect(renderItemContent).toHaveBeenNthCalledWith(2, {
      columnKey: 'id',
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
});
