import { toggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage adding a column to the group keys, or removing it when it is already
 * staged. The drawer's add control is the only surface that calls it; the
 * column-header menu keeps its own immediate twin.
 */
export const useToggleGroupKey = () => {
  const setGrouping = useSetGrouping();

  return (columnKey: string) => {
    setGrouping((grouping) => toggleTableGroupKey({ columnKey, grouping }));
  };
};
