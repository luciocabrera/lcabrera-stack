import type { TableGroupingMode } from '#ui/components/Table/Table.types';

import { setTableGroupingMode } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

export const useSetGroupingMode = () => {
  const setGrouping = useSetGrouping();

  return (mode: TableGroupingMode) => {
    setGrouping((grouping) => setTableGroupingMode({ grouping, mode }));
  };
};
