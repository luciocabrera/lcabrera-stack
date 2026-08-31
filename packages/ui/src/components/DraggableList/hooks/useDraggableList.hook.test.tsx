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

/**
 * A `grouping` link written before `addTableColumnAggregate` inserted beside a
 * column's existing measures carries an interleaved `agg`, and
 * `deserializeGroupingFromURL` passes it straight through. So this list arrives
 * without anyone crafting it.
 */
const interleaved: DraggableItem[] = [
  { content: 'Sum', groupId: 'total', id: 'total:sum' },
  { content: 'Count', groupId: 'order', id: 'order:count' },
  { content: 'Minimum', groupId: 'total', id: 'total:min' },
  { content: 'Average', groupId: 'unit', id: 'unit:avg' },
];

const dropOn = ({
  from,
  initialItems,
  to,
}: DropArgs & {
  readonly initialItems: DraggableItem[];
}) => {
  const onOrderChange = vi.fn();
  const { result } = renderHook(() =>
    useDraggableList({ initialItems, onOrderChange }),
  );

  act(() => {
    result.current.handleDragStart(from);
    result.current.handleDragEnter(to);
    result.current.handleDragEnd();
  });

  return { ids: result.current.items.map((item) => item.id), onOrderChange };
};

describe('a list that arrived already interleaved', () => {
  it('accepts the drop that repairs it', () => {
    const { ids, onOrderChange } = dropOn({
      from: 'total:min',
      initialItems: interleaved,
      to: 'order:count',
    });

    expect(ids).toStrictEqual([
      'total:sum',
      'total:min',
      'order:count',
      'unit:avg',
    ]);
    expect(onOrderChange).toHaveBeenCalledTimes(1);
  });

  it('accepts a drop that leaves it no worse, rather than freezing the list', () => {
    // One group is already split, and this drop does not split a second. A
    // predicate that asked "is the result contiguous" refused this, silently,
    // and a sufficiently fragmented list had no single drop it would accept at
    // all — the only way out was deleting entries.
    const { ids, onOrderChange } = dropOn({
      from: 'unit:avg',
      initialItems: interleaved,
      to: 'total:sum',
    });

    expect(ids).toStrictEqual([
      'unit:avg',
      'total:sum',
      'order:count',
      'total:min',
    ]);
    expect(onOrderChange).toHaveBeenCalledTimes(1);
  });

  it('still refuses a drop that splits a second group', () => {
    const { ids, onOrderChange } = dropOn({
      // `total` is already split; dropping its stray member between the two
      // `order` rows splits `order` too, taking the count from one to two.
      from: 'total:avg',
      initialItems: [
        { content: 'Sum', groupId: 'total', id: 'total:sum' },
        { content: 'Minimum', groupId: 'total', id: 'total:min' },
        { content: 'Count', groupId: 'order', id: 'order:count' },
        { content: 'Distinct', groupId: 'order', id: 'order:countDistinct' },
        { content: 'Average', groupId: 'total', id: 'total:avg' },
      ],
      to: 'order:countDistinct',
    });

    expect(ids).toStrictEqual([
      'total:sum',
      'total:min',
      'order:count',
      'order:countDistinct',
      'total:avg',
    ]);
    expect(onOrderChange).not.toHaveBeenCalled();
  });
});
