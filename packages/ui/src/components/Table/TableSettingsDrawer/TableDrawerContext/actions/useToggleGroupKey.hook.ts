import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { toggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type ToggleGroupKeyArgs = {
  readonly columnKey: string;
  readonly period?: TableGroupPeriod;
};

export const useToggleGroupKey = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, period }: ToggleGroupKeyArgs) => {
    setGrouping((grouping) =>
      toggleTableGroupKey({ columnKey, grouping, period }),
    );
  };
};
