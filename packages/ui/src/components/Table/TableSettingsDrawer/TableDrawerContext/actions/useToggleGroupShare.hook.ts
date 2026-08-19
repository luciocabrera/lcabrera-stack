import { toggleGroupShare } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage a column's share of the grand total on or off. The drawer's twin of the
 * grouping reducers beside it, resolving through the same shared util so what
 * is staged is exactly what Accept commits.
 */
export const useToggleGroupShare = () => {
  const setGrouping = useSetGrouping();

  return (columnKey: string) => {
    setGrouping((grouping) => toggleGroupShare({ columnKey, grouping }));
  };
};
