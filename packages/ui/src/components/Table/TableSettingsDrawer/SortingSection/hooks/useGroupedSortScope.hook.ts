import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { resolveGroupedSortScope } from '#ui/components/Table/utils/resolveGroupedSortScope.util';

import {
  useGetGroupingAggregates,
  useGetGroupingKeys,
} from '../../TableDrawerContext/selectors';

export const useGroupedSortScope = () => {
  const columns = useGetColumns();
  const aggregates = useGetGroupingAggregates();
  const groupingKeys = useGetGroupingKeys();

  const scope = resolveGroupedSortScope({ aggregates, columns, groupingKeys });

  return (columnKey: string) => scope === undefined || scope.has(columnKey);
};
