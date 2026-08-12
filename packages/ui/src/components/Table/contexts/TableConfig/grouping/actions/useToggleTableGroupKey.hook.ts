import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { toggleTableGroupKey } from './utils';

/**
 * Add a column to the group keys, or remove it when it is already one.
 *
 * The header menu's affordance, and the only one that appends: grouping is a
 * whole-table state expressed per column, so "group by this too" is the
 * interaction a column header can offer. What it cannot offer is a position —
 * the new key lands innermost, and reordering is the drawer's job.
 */
export const useToggleTableGroupKey = () => {
  const setGrouping = useSetTableGrouping();

  return (columnKey: string) => {
    setGrouping((grouping) => toggleTableGroupKey({ columnKey, grouping }));
  };
};
