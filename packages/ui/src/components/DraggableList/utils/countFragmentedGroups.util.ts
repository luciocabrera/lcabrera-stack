import type { DraggableItem } from '../DraggableList.types';

type GroupSpan = {
  count: number;
  first: number;
  last: number;
};

/**
 * How many groups are split by a member of another group — a group is fragmented when the
 * distance between its first and last member exceeds how many members it has.
 * A **count** rather than a yes/no, because the caller compares the number before a drop
 * with the number after: refusing every non-contiguous result would freeze a list that
 * arrived interleaved, and an interleaved list is reachable without crafting one (a
 * `grouping` link written before `addTableColumnAggregate` inserted beside its siblings
 * carries an interleaved `agg`). Comparing keeps the invariant for a well-formed list —
 * any drop that splits a group takes the count from zero — while leaving a list that is
 * already split repairable.
 */
export const countFragmentedGroups = (
  items: readonly DraggableItem[],
): number => {
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
    .filter(({ count, first, last }) => last - first + 1 !== count)
    .toArray().length;
};
