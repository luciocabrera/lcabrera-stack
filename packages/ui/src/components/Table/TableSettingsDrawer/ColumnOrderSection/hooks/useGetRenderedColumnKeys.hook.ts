import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetColumnVisibility,
  useGetGroupingAggregates,
  useGetGroupingKeys,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';

import { resolveRenderedColumnKeys } from '../utils';

/**
 * The section reads the grid's own derivation over the drawer's draft, so the tab shows
 * what accepting it would paint (ADR-095).
 */
export const useGetRenderedColumnKeys = () => {
  const aggregates = useGetGroupingAggregates();
  const columnOrder = useGetColumnOrder();
  const columnPinning = useGetColumnPinning();
  const columns = useGetColumns();
  const columnVisibility = useGetColumnVisibility();
  const groupingKeys = useGetGroupingKeys();

  return resolveRenderedColumnKeys({
    aggregates,
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
    groupingKeys,
  });
};
