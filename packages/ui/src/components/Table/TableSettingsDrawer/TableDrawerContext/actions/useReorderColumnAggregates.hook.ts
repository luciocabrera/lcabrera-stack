import { reorderTableColumnAggregates } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

/**
 * The order is a real edit, like the key order: it is what the `grouping` param's `agg`
 * array carries, so it survives a shared link and a reload.
 */
export const useReorderColumnAggregates = () => {
  const setGrouping = useSetGrouping();

  return (orderedIds: readonly string[]) => {
    setGrouping((grouping) =>
      reorderTableColumnAggregates({ grouping, orderedIds }),
    );
  };
};
