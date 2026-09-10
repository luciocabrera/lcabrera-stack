import { useEffect, useLayoutEffect } from 'react';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';
import { arePaintedColumnsUnchanged } from '#ui/components/Table/utils/arePaintedColumnsUnchanged.util';
import { collectColumnAxisEmitted } from '#ui/components/Table/utils/collectColumnAxisEmitted.util';

import { useGetTableGroupingColumnAxis } from '../selectors';
import { resolveGroupingColumnsPatch } from './utils';

const useIsomorphicLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;

export const useSyncColumnAxisColumns = () => {
  const { columnsStore, groupingStore } = useTableConfigContextValue();
  const columnAxis = useGetTableGroupingColumnAxis();
  const data = useGetTableData();

  useIsomorphicLayoutEffect(() => {
    if (columnAxis === undefined) return;

    const grouping = groupingStore.get();
    const columnsState = columnsStore.get();
    const emitted = collectColumnAxisEmitted(data);
    const patch = resolveGroupingColumnsPatch({
      aggregates: grouping.aggregates,
      columnAxis,
      columnAxisEmitted: emitted,
      columnsState,
      groupingKeys: grouping.keys,
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
  }, [columnAxis, columnsStore, data, groupingStore]);
};
