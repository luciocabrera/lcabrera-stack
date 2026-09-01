import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { setTableGroupKeyPeriod } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type SetGroupKeyPeriodArgs = {
  readonly columnKey: string;
  readonly period: TableGroupPeriod | undefined;
};

export const useSetGroupKeyPeriod = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, period }: SetGroupKeyPeriodArgs) => {
    setGrouping((grouping) =>
      setTableGroupKeyPeriod({ columnKey, grouping, period }),
    );
  };
};
