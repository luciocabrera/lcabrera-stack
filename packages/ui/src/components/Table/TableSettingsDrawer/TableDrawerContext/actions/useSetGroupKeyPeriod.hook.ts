import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { setTableGroupKeyPeriod } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type SetGroupKeyPeriodArgs = {
  readonly columnKey: string;
  /** `undefined` groups the column at its raw values again. */
  readonly period: TableGroupPeriod | undefined;
};

/**
 * Stage the granularity one temporal group key is truncated to (#786),
 * resolving through the same reducer the live path would, so a staged
 * granularity is exactly what Accept commits.
 */
export const useSetGroupKeyPeriod = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, period }: SetGroupKeyPeriodArgs) => {
    setGrouping((grouping) =>
      setTableGroupKeyPeriod({ columnKey, grouping, period }),
    );
  };
};
