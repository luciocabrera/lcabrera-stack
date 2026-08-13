import type { TableGroupingMode } from '#ui/components/Table/Table.types';

import { setTableGroupingMode } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage which grouping sets the read will emit. The drawer's twin of
 * `useSetTableGroupingMode`, resolving through the same reducer so a staged
 * mode is exactly what Accept commits.
 */
export const useSetGroupingMode = () => {
  const setGrouping = useSetGrouping();

  return (mode: TableGroupingMode) => {
    setGrouping((grouping) => setTableGroupingMode({ grouping, mode }));
  };
};
