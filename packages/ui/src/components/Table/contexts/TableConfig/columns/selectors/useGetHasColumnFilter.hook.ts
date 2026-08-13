import { useColumnsStore } from '../useColumnsStore.hook';

/**
 * Whether a filter is currently applied to one column.
 *
 * A boolean rather than the filter itself, so the subscription is to the
 * question actually being asked: a cell that re-rendered every time an
 * unrelated part of a filter changed would re-render on every keystroke in the
 * filter drawer.
 */
export const useGetHasColumnFilter = (columnKey: string) =>
  useColumnsStore((state) => Object.hasOwn(state.columnFilters, columnKey));
