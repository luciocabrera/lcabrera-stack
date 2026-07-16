import type { DataKey } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  commitResolvedVisibilityState,
  getPinningActionContext,
  resolveColumnVisibilityUpdate,
} from './utils';

type SetColumnVisibilityArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly isVisible: boolean;
};

/**
 * Hook to show/hide a single column directly on the table's live state.
 * Unlike the settings-drawer's useToggleColumnVisibility (which stages
 * changes in a draft store until Apply/Save), this writes straight to the
 * main columnsStore for quick-access affordances like the header actions
 * menu. No-op for static columns.
 */
export const useSetColumnVisibility = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, isVisible }: SetColumnVisibilityArgs<TData>) => {
    const {
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility: existingColumnVisibility,
      drawersSyncNonce,
      persistenceKey,
      staticKeys,
    } = getPinningActionContext<TData>({ columnsStore, metaStore });

    if (staticKeys?.has(columnKey)) return;

    const columnVisibility = resolveColumnVisibilityUpdate<TData>({
      columnKey,
      columnVisibility: existingColumnVisibility,
      isVisible,
    });

    commitResolvedVisibilityState<TData>({
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnsStore,
      columnVisibility,
      drawersSyncNonce,
      metaStore,
      persistenceKey,
      persistTableState,
    });
  };
};
