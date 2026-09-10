import { useEffect, useLayoutEffect } from 'react';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingColumnAxis } from '#ui/components/Table/contexts/TableConfig/grouping/selectors/useGetTableGroupingColumnAxis.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors/useGetTableData.hook';
import { arePaintedColumnsUnchanged } from '#ui/components/Table/utils/arePaintedColumnsUnchanged.util';
import { toColumnAxisDerivationArgs } from '#ui/components/Table/utils/toColumnAxisDerivationArgs.util';

import {
  useGetTableGroupingAggregates,
  useGetTableGroupingKeys,
} from '../selectors';
import { resolveGroupingColumnsPatch } from './utils';

const useIsomorphicLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;

export const useSyncColumnAxisColumns = () => {
  const { columnsStore } = useTableConfigContextValue();
  const aggregates = useGetTableGroupingAggregates();
  const columnAxis = useGetTableGroupingColumnAxis();
  const columns = useGetColumns();
  const data = useGetTableData();
  const groupingKeys = useGetTableGroupingKeys();

  useIsomorphicLayoutEffect(() => {
    if (columnAxis === undefined) return;

    const columnsState = columnsStore.get();
    const patch = resolveGroupingColumnsPatch({
      aggregates,
      columnsState,
      groupingKeys,
      ...toColumnAxisDerivationArgs({ columnAxis, data }),
    });
    if (
      arePaintedColumnsUnchanged({
        current: columnsState.effectiveColumns,
        next: patch.effectiveColumns,
      })
    ) {
      return;
    }

    columnsStore.set(patch);
  }, [aggregates, columnAxis, columns, columnsStore, data, groupingKeys]);
};
