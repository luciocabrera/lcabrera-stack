import { useEffect, useLayoutEffect } from 'react';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { arePaintedColumnsUnchanged } from '#ui/components/Table/utils/arePaintedColumnsUnchanged.util';

import {
  useGetTableGroupingAggregates,
  useGetTableGroupingColumnAxis,
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
  const groupingKeys = useGetTableGroupingKeys();

  useIsomorphicLayoutEffect(() => {
    if (columnAxis === undefined) return;

    const columnsState = columnsStore.get();
    const patch = resolveGroupingColumnsPatch({
      aggregates,
      columnAxis,
      columnsState,
      groupingKeys,
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
  }, [aggregates, columnAxis, columns, columnsStore, groupingKeys]);
};
