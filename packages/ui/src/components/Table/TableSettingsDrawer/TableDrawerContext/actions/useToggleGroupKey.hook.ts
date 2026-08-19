import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { toggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type ToggleGroupKeyArgs = {
  readonly columnKey: string;
  /**
   * The granularity to add the key with, from
   * `resolveGroupKeyAvailability`'s `requiredPeriod`. Absent for a column that
   * is groupable at its raw values.
   */
  readonly period?: TableGroupPeriod;
};

/**
 * Stage adding a column to the group keys, or removing it when it is already
 * staged. The drawer's add control is the only surface that calls it; the
 * column-header menu keeps its own immediate twin.
 *
 * The granularity travels with the key rather than being applied afterwards,
 * because for a column the catalogue refuses raw the two are one edit: adding
 * it without one stages a grouping the server would refuse (ADR-084).
 */
export const useToggleGroupKey = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, period }: ToggleGroupKeyArgs) => {
    setGrouping((grouping) =>
      toggleTableGroupKey({ columnKey, grouping, period }),
    );
  };
};
