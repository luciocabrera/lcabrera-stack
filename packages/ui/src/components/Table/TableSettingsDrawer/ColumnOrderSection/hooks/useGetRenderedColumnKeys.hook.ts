import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetColumnVisibility,
  useGetGroupingAggregates,
  useGetGroupingColumnAxis,
  useGetGroupingKeys,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';
import { collectColumnAxisEmitted } from '#ui/components/Table/utils/collectColumnAxisEmitted.util';

import { resolveRenderedColumnKeys } from '../utils';

export const useGetRenderedColumnKeys = () => {
  const aggregates = useGetGroupingAggregates();
  const columnAxis = useGetGroupingColumnAxis();
  const columnOrder = useGetColumnOrder();
  const columnPinning = useGetColumnPinning();
  const columns = useGetColumns();
  const columnVisibility = useGetColumnVisibility();
  const groupingKeys = useGetGroupingKeys();
  const data = useGetTableData();

  return resolveRenderedColumnKeys({
    aggregates,
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
    groupingKeys,
    ...(columnAxis !== undefined && {
      columnAxis,
      columnAxisEmitted: collectColumnAxisEmitted(data),
    }),
  });
};
