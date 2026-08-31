// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

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
    const { rerender, result } = renderHook(
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

const grouped: DraggableItem[] = [
  { content: 'Minimum', groupId: 'total', id: 'total:min' },
  { content: 'Maximum', groupId: 'total', id: 'total:max' },
  { content: 'Sum', groupId: 'total', id: 'total:sum' },
  { content: 'Count', groupId: 'order', id: 'order:count' },
];

type DropArgs = {
  readonly from: string;
  readonly to: string;
};

const drop = ({ from, to }: DropArgs) => {
  const onOrderChange = vi.fn();
  const { result } = renderHook(() =>
    useDraggableList({ initialItems: grouped, onOrderChange }),
  );

  act(() => {
    result.current.handleDragStart(from);
    result.current.handleDragEnter(to);
    result.current.handleDragEnd();
  });

  return {
    ids: result.current.items.map((item) => item.id),
    onOrderChange,
  };
};

describe('a drop that would split a group', () => {
  it('is refused, leaving the list and its listeners untouched', () => {
    const { ids, onOrderChange } = drop({
      from: 'order:count',
      to: 'total:max',
    });

    expect(ids).toStrictEqual([
      'total:min',
      'total:max',
      'total:sum',
      'order:count',
    ]);
    expect(onOrderChange).not.toHaveBeenCalled();
  });

  it('allows the whole group to move past the other one', () => {
    const { ids, onOrderChange } = drop({
      from: 'order:count',
      to: 'total:min',
    });

    expect(ids).toStrictEqual([
      'order:count',
      'total:min',
      'total:max',
      'total:sum',
    ]);
    expect(onOrderChange).toHaveBeenCalledTimes(1);
  });

  it('allows a reorder inside one group', () => {
    const { ids, onOrderChange } = drop({ from: 'total:sum', to: 'total:min' });

    expect(ids).toStrictEqual([
      'total:sum',
      'total:min',
      'total:max',
      'order:count',
    ]);
    expect(onOrderChange).toHaveBeenCalledTimes(1);
  });
});
