import type { DraggableItem } from '../DraggableList.types';

type GroupSpan = {
  count: number;
  first: number;
  last: number;
};

export const isGroupedOrderContiguous = (
  items: readonly DraggableItem[],
): boolean => {
  const spans = new Map<string, GroupSpan>();

  for (const [index, { groupId }] of items.entries()) {
    if (groupId === undefined) continue;

    const span = spans.get(groupId);

    if (span === undefined) {
      spans.set(groupId, { count: 1, first: index, last: index });
      continue;
    }

    span.count += 1;
    span.last = index;
  }

  return spans
    .values()
    .every(({ count, first, last }) => last - first + 1 === count);
};
