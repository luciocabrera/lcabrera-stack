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
      declaredGroupingKeys: [],
      renderedColumnKeys: new Set(['id']),
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
        { key: 'first', label: 'First' },
        { key: 'second', label: 'Second' },
      ],
      columnPinning: { left: [], right: [] },
      declaredGroupingKeys: ['first'],
      renderedColumnKeys: new Set(['first']),
      renderItemContent,
    });

    expect(result[0]).toMatchObject({ id: 'first', isDraggable: false });
    expect(result[0]?.content).toBe('true:false');
  });

  it('locks every row while grouping is applied, not only the keys', () => {
    const result = createDraggableItems({
      allOrderedColumns: [
        { key: 'first', label: 'First' },
        { key: 'second', label: 'Second' },
      ],
      columnPinning: { left: [], right: [] },
      declaredGroupingKeys: ['first'],
      renderedColumnKeys: new Set(['first']),
      renderItemContent: () => 'content',
    });

    expect(result.map((item) => item.isDraggable)).toStrictEqual([
      false,
      false,
    ]);
  });

  it('reads `Show` from the rendered set rather than from the hidden keys', () => {
    const result = createDraggableItems({
      allOrderedColumns: [
        { key: 'first', label: 'First' },
        { key: 'second', label: 'Second' },
      ],
      columnPinning: { left: [], right: [] },
      declaredGroupingKeys: ['first'],
      renderedColumnKeys: new Set(['first']),
      renderItemContent: ({ isVisible }) => String(isVisible),
    });

    expect(result.map((item) => item.content)).toStrictEqual(['true', 'false']);
  });
});
