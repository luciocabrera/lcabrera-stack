import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { toggleTableGroupKey } from './utils';

type ToggleTableGroupKeyArgs = {
  readonly columnKey: string;
  /**
   * The granularity to add the key with, from
   * `resolveGroupKeyAvailability`'s `requiredPeriod`. Absent for a column that
   * is groupable at its raw values.
   */
  readonly period?: TableGroupPeriod;
};

/**
 * Add a column to the group keys, or remove it when it is already one.
 *
 * The header menu's affordance, and the only one that appends: grouping is a
 * whole-table state expressed per column, so "group by this too" is the
 * interaction a column header can offer. What it cannot offer is a position —
 * the new key lands innermost, and reordering is the drawer's job.
 *
 * The granularity travels with the key rather than being applied afterwards,
 * because for a column the catalogue refuses raw the two are one edit: adding
 * it without one applies a grouping the server would refuse (ADR-084).
 */
export const useToggleTableGroupKey = () => {
  const setGrouping = useSetTableGrouping();

  return ({ columnKey, period }: ToggleTableGroupKeyArgs) => {
    setGrouping((grouping) =>
      toggleTableGroupKey({ columnKey, grouping, period }),
    );
  };
};
