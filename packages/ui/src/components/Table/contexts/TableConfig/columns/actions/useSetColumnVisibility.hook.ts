import type { DataKey } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@repo/ui/components/Table/hooks';

import {
  commitResolvedVisibilityState,
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
    const columnsState = columnsStore.get();

    if (columnsState?.staticKeys?.has(columnKey)) return;
    const metaState = metaStore.get();
    const columnVisibility = resolveColumnVisibilityUpdate<TData>({
      columnKey,
      columnVisibility: columnsState?.columnVisibility,
      isVisible,
    });

    commitResolvedVisibilityState<TData>({
      columnOrder: columnsState?.columnOrder ?? [],
      columnPinning: columnsState?.columnPinning ?? {
        left: [],
        right: [],
      },
      columns: columnsState?.columns ?? [],
      columnSizing: columnsState?.columnSizing,
      columnsStore,
      columnVisibility,
      drawersSyncNonce: metaState?.drawersSyncNonce ?? 0,
      metaStore,
      persistenceKey: metaState?.persistenceKey ?? '',
      persistTableState,
    });
  };
};
