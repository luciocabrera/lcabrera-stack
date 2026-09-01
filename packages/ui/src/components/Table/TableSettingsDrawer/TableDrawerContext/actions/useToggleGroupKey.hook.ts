import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { toggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import { useGetTablePreferredGroupingMode } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetGrouping } from './useSetGrouping.hook';

type ToggleGroupKeyArgs = {
  readonly columnKey: string;
  readonly period?: TableGroupPeriod;
};

export const useToggleGroupKey = () => {
  const setGrouping = useSetGrouping();
  const preferredMode = useGetTablePreferredGroupingMode();

  return ({ columnKey, period }: ToggleGroupKeyArgs) => {
    setGrouping((grouping) =>
      toggleTableGroupKey({ columnKey, grouping, period, preferredMode }),
    );
  };
};
