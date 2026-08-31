import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { useGetTablePreferredGroupingMode } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { toggleTableGroupKey } from './utils';

type ToggleTableGroupKeyArgs = {
  readonly columnKey: string;
  readonly period?: TableGroupPeriod;
};

export const useToggleTableGroupKey = () => {
  const setGrouping = useSetTableGrouping();
  const preferredMode = useGetTablePreferredGroupingMode();

  return ({ columnKey, period }: ToggleTableGroupKeyArgs) => {
    setGrouping((grouping) =>
      toggleTableGroupKey({ columnKey, grouping, period, preferredMode }),
    );
  };
};
