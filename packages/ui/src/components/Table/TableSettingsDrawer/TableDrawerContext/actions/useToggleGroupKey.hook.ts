import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { toggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import { useGetTablePreferredGroupingMode } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetGrouping } from './useSetGrouping.hook';

type ToggleGroupKeyArgs = {
  readonly columnKey: string;
  /**
   * The granularity to add the key with, from `resolveGroupKeyAvailability`'s
   * `requiredPeriod`.
   */
  readonly period?: TableGroupPeriod;
};

/**
 * The granularity travels with the key rather than being applied afterwards, because for a
 * column the catalogue refuses raw the two are one edit: adding it without one stages a
 * grouping the server would refuse (ADR-084).
 */
export const useToggleGroupKey = () => {
  const setGrouping = useSetGrouping();
  const preferredMode = useGetTablePreferredGroupingMode();

  return ({ columnKey, period }: ToggleGroupKeyArgs) => {
    setGrouping((grouping) =>
      toggleTableGroupKey({ columnKey, grouping, period, preferredMode }),
    );
  };
};
