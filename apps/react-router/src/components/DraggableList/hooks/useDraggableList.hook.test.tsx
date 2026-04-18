// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DraggableItem } from '../DraggableList.types';

import { useDraggableList } from './useDraggableList.hook';

const items: DraggableItem[] = [
  { content: 'First', id: 'first', isDraggable: true },
  { content: 'Second', id: 'second', isDraggable: true },
  { content: 'Third', id: 'third', isDraggable: true },
];

describe('useDraggableList', () => {
  it('returns the initial list order', () => {
    const { result } = renderHook(() =>
      useDraggableList({
        initialItems: items,
      }),
    );

    expect(result.current.items).toEqual(items);
  });

  it('reorders items on drag end and notifies listeners', () => {
    const onOrderChange = vi.fn();
    const { result } = renderHook(() =>
      useDraggableList({
        initialItems: items,
        onOrderChange,
      }),
    );

    act(() => {
      result.current.handleDragStart('first');
      result.current.handleDragEnter('third');
      result.current.handleDragEnd();
    });

    expect(result.current.items.map((item) => item.id)).toEqual([
      'second',
      'third',
      'first',
    ]);
    expect(onOrderChange).toHaveBeenCalledWith(result.current.items);
  });

  it('does nothing when the drag starts and ends on the same item', () => {
    const onOrderChange = vi.fn();
    const { result } = renderHook(() =>
      useDraggableList({
        initialItems: items,
        onOrderChange,
      }),
    );

    act(() => {
      result.current.handleDragStart('second');
      result.current.handleDragEnter('second');
      result.current.handleDragEnd();
    });

    expect(result.current.items).toEqual(items);
    expect(onOrderChange).not.toHaveBeenCalled();
    expect(result.current.dragItemId.current).toBeUndefined();
  });

  it('syncs local state when the initial items prop changes', () => {
    const { result, rerender } = renderHook(
      ({ initialItems }: { readonly initialItems: DraggableItem[] }) =>
        useDraggableList({
          initialItems,
        }),
      {
        initialProps: { initialItems: items },
      },
    );

    const nextItems: DraggableItem[] = [
      { content: 'Updated', id: 'updated', isDraggable: true },
    ];

    rerender({ initialItems: nextItems });

    expect(result.current.items).toEqual(nextItems);
  });

  it('does nothing when the drag ids do not match list items', () => {
    const onOrderChange = vi.fn();
    const { result } = renderHook(() =>
      useDraggableList({
        initialItems: items,
        onOrderChange,
      }),
    );

    act(() => {
      result.current.handleDragStart('missing-source');
      result.current.handleDragEnter('missing-target');
      result.current.handleDragEnd();
    });

    expect(result.current.items).toEqual(items);
    expect(onOrderChange).not.toHaveBeenCalled();
    expect(result.current.dragItemId.current).toBeUndefined();
  });
});
