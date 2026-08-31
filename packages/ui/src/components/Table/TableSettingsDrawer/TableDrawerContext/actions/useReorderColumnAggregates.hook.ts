import { reorderTableColumnAggregates } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

export const useReorderColumnAggregates = () => {
  const setGrouping = useSetGrouping();

  return (orderedIds: readonly string[]) => {
    setGrouping((grouping) =>
      reorderTableColumnAggregates({ grouping, orderedIds }),
    );
  };
};
