import { reorderTableColumnAggregates } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage the aggregates in a new order, named by the row ids the drawer's
 * draggable list hands back.
 *
 * Ids rather than whole entries — and a permutation rather than a whole-list
 * write, which is where this departs from `useSetGroupKeys` beside it. A key
 * row always names its key, so the key list can be rebuilt from the rows; an
 * aggregate whose column the route does not declare is staged but **not
 * rendered**, so rebuilding from the rows would un-stage it in silence.
 *
 * The order is a real edit, like the key order: it is what the `grouping`
 * param's `agg` array carries, so it survives a shared link and a reload. It
 * stages like every other drawer edit and applies on Accept, so a drag costs no
 * loader run of its own.
 */
export const useReorderColumnAggregates = () => {
  const setGrouping = useSetGrouping();

  return (orderedIds: readonly string[]) => {
    setGrouping((grouping) =>
      reorderTableColumnAggregates({ grouping, orderedIds }),
    );
  };
};
