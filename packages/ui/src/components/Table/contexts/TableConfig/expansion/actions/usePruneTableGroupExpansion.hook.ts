import { pruneCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

export const usePruneTableGroupExpansion = <
  TData extends Record<string, unknown>,
>() => {
  const { expansionStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();

  return () => {
    const { toggledGroupPaths } = expansionStore.get();
    const nextCollapsed = pruneCollapsedGroupPaths({
      data: dataStore.get().data,
      toggledGroupPaths,
    });

    if (nextCollapsed !== toggledGroupPaths) {
      expansionStore.set({ toggledGroupPaths: nextCollapsed });
    }
  };
};
