import { pruneCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

export const usePruneTableGroupExpansion = <
  TData extends Record<string, unknown>,
>() => {
  const { expansionStore } = useTableConfigContextValue<TData>();

  return (data: readonly TData[]) => {
    const { toggledGroupPaths } = expansionStore.get();
    const nextCollapsed = pruneCollapsedGroupPaths({ data, toggledGroupPaths });

    if (nextCollapsed !== toggledGroupPaths) {
      expansionStore.set({ toggledGroupPaths: nextCollapsed });
    }
  };
};
