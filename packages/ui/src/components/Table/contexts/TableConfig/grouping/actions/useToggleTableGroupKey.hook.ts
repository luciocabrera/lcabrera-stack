import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { useGetTablePreferredGroupingMode } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { toggleTableGroupKey } from './utils';

type ToggleTableGroupKeyArgs = {
  readonly columnKey: string;
  /**
   * The granularity to add the key with, from `resolveGroupKeyAvailability`'s
   * `requiredPeriod`.
   */
  readonly period?: TableGroupPeriod;
};

/**
 * The header menu's affordance, and the only one that appends: grouping is a whole-table
 * state expressed per column, so "group by this too" is the interaction a column header
 * can offer.
 * What it cannot offer is a position — the new key lands innermost, and reordering is the
 * drawer's job.
 */
export const useToggleTableGroupKey = () => {
  const setGrouping = useSetTableGrouping();
  const preferredMode = useGetTablePreferredGroupingMode();

  return ({ columnKey, period }: ToggleTableGroupKeyArgs) => {
    setGrouping((grouping) =>
      toggleTableGroupKey({ columnKey, grouping, period, preferredMode }),
    );
  };
};
