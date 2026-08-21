import type { DataKey } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  commitResolvedVisibilityState,
  getPinningActionContext,
  resolveColumnVisibilityUpdate,
  toDeclaredColumnKey,
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
 * menu. No-op for a static column **or for a measure of one**, which is the
 * same column once the key is resolved.
 */
export const useSetColumnVisibility = <TData>() => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
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

    // The declared column, symmetric with `useSetColumnPinning`. Hiding a
    // measure through the header menu used to write its derived key into the
    // visibility set, and that set is persisted — but the settings drawer
    // lists the **declared** columns, so nothing in the UI could take the key
    // back out again except the blanket "Clear Visibility & Pinning", which
    // discards every other preference with it. Hiding `Average` hides
    // `Total Amount`, which `withAggregateColumns` expands back into both of
    // its measures.
    const declaredColumnKey = toDeclaredColumnKey<TData>({
      columnKey,
      columns,
    });

    // Guarded **after** the mapping, on the key actually being written.
    // `staticKeys` comes from the declared columns, so it can never hold
    // `total_amount:avg` — testing the raw key let a measure walk past a lock
    // and hide the column carrying it. `useSetColumnPinning` has always been
    // safe here for the same reason in reverse: its guard sits downstream of
    // the mapping, inside `resolveColumnPinningUpdate`.
    if (staticKeys?.has(declaredColumnKey)) return;

    const grouping = groupingStore.get();

    const columnVisibility = resolveColumnVisibilityUpdate<TData>({
      columnKey: declaredColumnKey,
      columnVisibility: existingColumnVisibility,
      isVisible,
    });

    commitResolvedVisibilityState<TData>({
      aggregates: grouping.aggregates,
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnsStore,
      columnVisibility,
      drawersSyncNonce,
      groupingKeys: grouping.keys,
      metaStore,
      persistenceKey,
      persistTableState,
    });
  };
};
