import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

type UseToggleColumnVisibilityArgs = {
  readonly columnKey: string;
  readonly isVisible: boolean;
};
export const useToggleColumnVisibility = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();

  return ({ columnKey, isVisible }: UseToggleColumnVisibilityArgs) => {
    const tableColumnsState = tableColumnsStore.get();
    const column = tableColumnsState?.normalizedColumns[columnKey];

    if (resolveColumnCapabilities(column).isStatic) return;

    const columnVisibility =
      drawerColumnsStore.get()?.columnVisibility ??
      (new Set() as ColumnVisibilityState);
    const newVisibility = new Set(columnVisibility);
    if (isVisible) {
      newVisibility.delete(columnKey);
    } else {
      newVisibility.add(columnKey);
    }
    drawerColumnsStore.set({ columnVisibility: newVisibility });
  };
};
