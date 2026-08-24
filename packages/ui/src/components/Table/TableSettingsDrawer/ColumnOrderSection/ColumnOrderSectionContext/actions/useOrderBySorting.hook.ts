import type { SortingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { buildOrderBySorting } from './utils/buildOrderBySorting.util';
import { readPinActionState } from './utils/readPinActionState.util';
import { resolveOrderConflictUpdate } from './utils/resolveOrderConflictUpdate.util';

export const useOrderBySorting = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    const drawerState = drawerColumnsStore.get();
    const {
      columnPinning,
      columnsOrder,
      staticKeys: rawStaticKeys,
    } = readPinActionState({
      drawerState,
      tableState: tableColumnsStore.get(),
    });
    const sorting = drawerState?.sorting ?? ([] as SortingState);
    const staticKeys = rawStaticKeys ?? new Set<string>();

    const newOrder = buildOrderBySorting({
      columnOrder: columnsOrder,
      sorting,
      staticKeys,
    });

    const resolvedUpdate = resolveOrderConflictUpdate({
      columnPinning,
      conflictDescription:
        'Reordering columns by sorting will move pinned columns out of their pinned positions. Choose how to proceed:',
      newOrder,
      staticKeys,
    });

    if (resolvedUpdate.kind === 'apply-order') {
      drawerColumnsStore.set({ columnOrder: newOrder });
      return;
    }

    modalsStore.set({
      orderConflict: resolvedUpdate.orderConflict,
    });
  };
};
