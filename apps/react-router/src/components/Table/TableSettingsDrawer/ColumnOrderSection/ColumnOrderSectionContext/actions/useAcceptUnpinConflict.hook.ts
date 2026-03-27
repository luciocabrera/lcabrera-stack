import type { ColumnOrderState } from "@/components/Table/Table.types";
import type { UnpinConflictResolution } from "@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types";

import { useTableConfigContextValue } from "@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook";
import {
  buildAllOrderedColumns,
  insertAdjacentToPinnedGroup,
} from "@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils";
import { useTableDrawerContextValue } from "@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook";

import { useColumnOrderSectionContextValue } from "../useColumnOrderSectionContextValue.hook.ts";

/**
 * Hook to handle accepting an unpin conflict resolution.
 */
export const useAcceptUnpinConflict = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (resolution: UnpinConflictResolution) => {
    const unpinConflictModal = modalsStore.get()?.unpinConflictModal;
    if (!unpinConflictModal) return;

    const columns = tableColumnsStore.get()?.columns ?? [];
    const drawerState = drawerColumnsStore.get();
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    const { columnKey, side } = unpinConflictModal;
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    if (resolution === "unpin-beyond") {
      const newPinning = {
        left: [...columnPinning.left],
        right: [...columnPinning.right],
      };

      if (side === "left") {
        const keysToUnpin = new Set(
          allOrderedColumns
            .slice(index)
            .map((col) => col.key)
            .filter((key) => newPinning.left.includes(key)),
        );
        newPinning.left = newPinning.left.filter((k) => !keysToUnpin.has(k));
      } else {
        const keysToUnpin = new Set(
          allOrderedColumns
            .slice(0, index + 1)
            .map((col) => col.key)
            .filter((key) => newPinning.right.includes(key)),
        );
        newPinning.right = newPinning.right.filter((k) => !keysToUnpin.has(k));
      }

      drawerColumnsStore.set({ columnPinning: newPinning });
    } else {
      // reorder-to-fill: remove pin and move remaining pinned columns together
      const newPinning = {
        left: columnPinning.left.filter((k) => k !== columnKey),
        right: columnPinning.right.filter((k) => k !== columnKey),
      };

      const newOrder = allOrderedColumns
        .filter((col) => col.key !== columnKey)
        .map((col) => col.key);

      const reorderedOrder = insertAdjacentToPinnedGroup({
        columnKey,
        columnPinning: newPinning,
        order: newOrder,
        side,
      });

      drawerColumnsStore.set({
        columnOrder: reorderedOrder as ColumnOrderState,
        columnPinning: newPinning,
      });
    }

    modalsStore.set({
      unpinConflictModal: { ...unpinConflictModal, isOpen: false },
    });
  };
};
