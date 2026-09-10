import { setTableColumnAxis } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

export const useSetGroupingColumnAxis = () => {
  const setGrouping = useSetGrouping();

  return (columnAxis: string | undefined) => {
    setGrouping((grouping) => setTableColumnAxis({ columnAxis, grouping }));
  };
};
