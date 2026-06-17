import type { DraggableItem } from '@/components/DraggableList';
import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  recalculatePinSides,
  restoreStaticColumnOrder,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { useGetGlobalOrderConflictResolutionPreference } from '@/contexts/GlobalSettingsContext/selectors';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { useAcceptOrderConflict } from './useAcceptOrderConflict.hook';
import { resolveOrderConflictUpdate } from './utils/resolveOrderConflictUpdate.util';

/**
 * Hook to handle column reordering via drag and drop.
 * Recalculates pin sides and detects conflicts.
 * Static columns are preserved in their original positions.
 */
export const useReorderColumns = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const orderConflictResolutionPreference =
    useGetGlobalOrderConflictResolutionPreference();
  const acceptOrderConflict = useAcceptOrderConflict();

  return (reorderedItems: DraggableItem[]) => {
    const drawerColumnsState = drawerColumnsStore.get();
    const currentOrder =
      drawerColumnsState?.columnOrder ?? ([] as ColumnOrderState);
    const staticKeys = tableColumnsStore.get()?.staticKeys ?? new Set<string>();

    const finalOrder = restoreStaticColumnOrder({
      currentOrder,
      newOrder: reorderedItems.map((item) => item.id) as ColumnOrderState,
      staticKeys,
    });

    const columnPinning = drawerColumnsState?.columnPinning ?? {
      left: [],
      right: [],
    };

    const recalculatedPinning = recalculatePinSides({
      columnPinning,
      newOrder: finalOrder,
      staticKeys,
    });

    const resolvedUpdate = resolveOrderConflictUpdate({
      columnPinning: recalculatedPinning,
      conflictDescription:
        'Dragging this column broke the pinning layout. Pinned columns must stay at the edges. Choose how to proceed:',
      newOrder: finalOrder,
      orderConflictResolutionPreference,
      staticKeys,
    });

    if (resolvedUpdate.kind === 'apply-order') {
      drawerColumnsStore.set({
        columnOrder: resolvedUpdate.newOrder,
        columnPinning: resolvedUpdate.pendingPinning,
      });
      return;
    }

    modalsStore.set({
      orderConflict: resolvedUpdate.orderConflict,
    });

    if (resolvedUpdate.kind === 'auto-accept-conflict') {
      acceptOrderConflict(resolvedUpdate.resolution);
    }
  };
};
