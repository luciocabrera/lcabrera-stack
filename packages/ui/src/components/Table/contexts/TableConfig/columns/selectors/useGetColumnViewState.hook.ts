import type { TableColumnsState } from '#ui/components/Table/Table.types';

import { useGetTableGroupingAggregates } from '#ui/components/Table/contexts/TableConfig/grouping/selectors/useGetTableGroupingAggregates.hook';
import { useGetTableGroupingColumnAxis } from '#ui/components/Table/contexts/TableConfig/grouping/selectors/useGetTableGroupingColumnAxis.hook';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors/useGetTableGroupingKeys.hook';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors/useGetTableData.hook';
import {
  deriveColumnViewState,
  toColumnAxisDerivationArgs,
} from '#ui/components/Table/utils';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnViewState = <TData>() => {
  const columnsState = useColumnsStore<TableColumnsState<TData>, TData>(
    (state) => state,
  );
  const aggregates = useGetTableGroupingAggregates();
  const columnAxis = useGetTableGroupingColumnAxis();
  const data = useGetTableData<TData>();
  const groupingKeys = useGetTableGroupingKeys();

  return deriveColumnViewState<TData>({
    aggregates,
    columnOrder: columnsState.columnOrder,
    columnPinning: columnsState.columnPinning,
    columns: columnsState.columns,
    columnSizing: columnsState.columnSizing,
    columnVisibility: columnsState.columnVisibility,
    groupingKeys,
    sorting: columnsState.sorting,
    ...toColumnAxisDerivationArgs({ columnAxis, data }),
  });
};
