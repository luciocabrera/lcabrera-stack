import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
} from "@/components/Table/Table.types";
import type { PinConflictResolution } from "@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types";

import { useTableConfigContextValue } from "@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook";
import { usePersistTableStateAction } from "@/components/Table/hooks";
import {
  applyPin,
  buildAllOrderedColumns,
  insertAdjacentToPinnedGroup,
} from "@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils";
import {
  getEffectiveColumns,
  getPinnedColumnOffsets,
  splitColumnsByPinning,
} from "@/components/Table/utils";

type AcceptHeaderPinConflictArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly resolution: PinConflictResolution;
  readonly side: "left" | "right";
};

export const useAcceptHeaderPinConflict = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, resolution, side }: AcceptHeaderPinConflictArgs<TData>) => {
    const columnsState = columnsStore.get();
    const columns = columnsState?.columns ?? [];
    const columnsOrder = columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const currentPinning =
      columnsState?.columnPinning ?? ({ left: [], right: [] } as ColumnPinningState<TData>);
    const persistenceKey = metaStore.get()?.persistenceKey ?? "";

    const staticKeys = columnsState?.staticKeys;

    const allOrderedColumns = buildAllOrderedColumns({ columns, columnsOrder });
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    let newPinning: ColumnPinningState<TData>;
    let newOrder: ColumnOrderState<TData> | undefined;

    switch (resolution) {
      case "move-column": {
        newOrder = allOrderedColumns
          .filter((col) => col.key !== columnKey)
          .map((col) => col.key) as ColumnOrderState<TData>;

        const column = allOrderedColumns[index];
        if (column?.key) {
          newOrder = insertAdjacentToPinnedGroup({
            columnKey: column.key,
            columnPinning: currentPinning as ColumnPinningState,
            order: newOrder,
            side,
          }) as ColumnOrderState<TData>;
        }

        newPinning = applyPin({
          columnKey,
          columnPinning: currentPinning as ColumnPinningState,
          side,
          staticKeys,
        }) as ColumnPinningState<TData>;
        break;
      }

      case "pin-all-between": {
        let nextLeft = [...currentPinning.left] as DataKey<TData>[];
        let nextRight = [...currentPinning.right] as DataKey<TData>[];

        if (side === "left") {
          for (let i = 0; i <= index; i++) {
            const colKey = allOrderedColumns[i]?.key ?? "";
            if (!nextLeft.includes(colKey as DataKey<TData>)) {
              nextRight = nextRight.filter((k) => k !== colKey);
              nextLeft = [...nextLeft, colKey as DataKey<TData>];
            }
          }
        } else {
          for (let i = index; i < allOrderedColumns.length; i++) {
            const colKey = allOrderedColumns[i]?.key ?? "";
            if (!nextRight.includes(colKey as DataKey<TData>)) {
              nextLeft = nextLeft.filter((k) => k !== colKey);
              nextRight = [...nextRight, colKey as DataKey<TData>];
            }
          }
        }

        newPinning = {
          left: nextLeft,
          right: nextRight,
        };
        break;
      }

      case "pin-only": {
        newPinning = applyPin({
          columnKey,
          columnPinning: currentPinning as ColumnPinningState,
          side,
          staticKeys,
        }) as ColumnPinningState<TData>;
        break;
      }
    }

    const effectiveColumns = getEffectiveColumns({
      columnOrder: newOrder ?? columnsState?.columnOrder,
      columnPinning: newPinning,
      columns,
      columnVisibility: columnsState?.columnVisibility,
    });

    const columnGroups = splitColumnsByPinning({
      columnPinning: newPinning,
      effectiveColumns,
    });

    const columnSizing = columnsState?.columnSizing ?? ({} as ColumnSizingState<TData>);
    const pinnedColumnOffsets = getPinnedColumnOffsets({
      columnPinning: newPinning,
      columnSizing,
      effectiveColumns,
    });

    const updates: Record<string, unknown> = {
      columnGroups,
      columnPinning: newPinning,
      effectiveColumns,
      pinnedColumnOffsets,
    };

    if (newOrder) {
      updates.columnOrder = newOrder;
      persistTableState([
        {
          persistenceKey,
          slice: "columnPinning" as const,
          valueSlice: newPinning,
        },
        { persistenceKey, slice: "columnOrder" as const, valueSlice: newOrder },
      ]);
    } else {
      persistTableState({
        persistenceKey,
        slice: "columnPinning" as const,
        valueSlice: newPinning,
      });
    }

    columnsStore.set(updates);
  };
};
