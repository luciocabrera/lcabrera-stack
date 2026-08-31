import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { toggleGroupShare } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type ToggleGroupShareArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

export const useToggleGroupShare = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, fn }: ToggleGroupShareArgs) => {
    setGrouping((grouping) => toggleGroupShare({ columnKey, fn, grouping }));
  };
};
