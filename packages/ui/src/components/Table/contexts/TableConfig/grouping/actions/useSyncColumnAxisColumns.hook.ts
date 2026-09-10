import { useLayoutEffect } from 'react';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';
import { collectColumnAxisEmitted } from '#ui/components/Table/utils/collectColumnAxisEmitted.util';

import { useGetTableGroupingColumnAxis } from '../selectors';
import { resolveGroupingColumnsPatch } from './utils';

export const useSyncColumnAxisColumns = () => {
  const { columnsStore, groupingStore } = useTableConfigContextValue();
  const columnAxis = useGetTableGroupingColumnAxis();
  const data = useGetTableData();

  useLayoutEffect(() => {
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
    const currentKeys = columnsState.effectiveColumns.map((column) =>
      String(column.key),
    );
    const nextKeys = patch.effectiveColumns.map((column) => String(column.key));
    const isSame =
      currentKeys.length === nextKeys.length &&
      currentKeys.every((key, index) => key === nextKeys[index]);

    if (isSame) return;

    columnsStore.set(patch);
  }, [columnAxis, columnsStore, data, groupingStore]);
};
