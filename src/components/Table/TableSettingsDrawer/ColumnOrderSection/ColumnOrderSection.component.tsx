import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { DraggableItem } from '@/components/DraggableList';
import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@/components/Table/Table.types';

import { DraggableList } from '@/components/DraggableList';
import { SidePanelSectionHeader } from '@/components/SidePanel';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ToggleSwitch } from '@/components/ToggleSwitch';

import type {
  ColumnOrderSectionProps,
  HandleToggleVisibilityArgs,
  OrderConflictResolution,
  PinConflictResolution,
  PinSide,
  UnpinConflictResolution,
} from './ColumnOrderSection.types';

import {
  useSetColumnPinning,
  useSetColumnsOrder,
  useSetColumnsVisibility,
} from '../TableDrawerContext/actions';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetColumnsSorting,
  useGetColumnVisibility,
} from '../TableDrawerContext/selectors';
import { styles } from './ColumnOrderSection.stylex';
import { ColumnOrderSectionFooter } from './ColumnOrderSectionFooter';
import { OrderConflictModal } from './OrderConflictModal';
import { PinConflictModal } from './PinConflictModal';
import { PinSideModal } from './PinSideModal';
import { UnpinConflictModal } from './UnpinConflictModal';
import {
  detectPinOrderConflict,
  recalculatePinSides,
  resolvePinOrderConflict,
} from './utils';

export const ColumnOrderSection = ({ ...props }: ColumnOrderSectionProps) => {
  const columns = useGetColumns();
  const columnsOrder = useGetColumnOrder();
  const columnPinning = useGetColumnPinning();
  const columnVisibility = useGetColumnVisibility();
  const sorting = useGetColumnsSorting();

  const setColumnPinning = useSetColumnPinning();
  const setColumnsOrder = useSetColumnsOrder();
  const setColumnsVisibility = useSetColumnsVisibility();

  const [pinSideModal, setPinSideModal] = useState<{
    columnKey: string;
    columnLabel: string;
    isOpen: boolean;
  }>({ columnKey: '', columnLabel: '', isOpen: false });

  const [conflictModal, setConflictModal] = useState<{
    columnKey: string;
    columnLabel: string;
    isOpen: boolean;
    side: 'left' | 'right';
  }>({ columnKey: '', columnLabel: '', isOpen: false, side: 'left' });

  const [unpinConflictModal, setUnpinConflictModal] = useState<{
    columnKey: string;
    columnLabel: string;
    isOpen: boolean;
    side: 'left' | 'right';
  }>({ columnKey: '', columnLabel: '', isOpen: false, side: 'left' });

  const [orderConflict, setOrderConflict] = useState<{
    description: string;
    isOpen: boolean;
    pendingOrder: ColumnOrderState;
    pendingPinning: ColumnPinningState;
  }>({
    description: '',
    isOpen: false,
    pendingOrder: [] as unknown as ColumnOrderState,
    pendingPinning: { left: [], right: [] },
  });

  // Build ordered column list (use columnOrder if available, otherwise use column definition order)
  const orderedColumns =
    columnsOrder.length > 0
      ? columnsOrder
          .map((key) => columns.find((col) => col.key === key))
          .filter((col): col is (typeof columns)[0] => col !== undefined)
      : columns;

  // Add any columns not in columnOrder to the end
  const remainingColumns = columns.filter(
    (col) => !orderedColumns.some((orderedCol) => orderedCol.key === col.key),
  );
  const allOrderedColumns = [...orderedColumns, ...remainingColumns];

  const handleToggleVisibility = ({
    columnKey,
    isVisible,
  }: HandleToggleVisibilityArgs) => {
    const newVisibility = new Set(columnVisibility);
    if (isVisible) {
      newVisibility.delete(columnKey);
    } else {
      newVisibility.add(columnKey);
    }
    setColumnsVisibility(newVisibility);
  };

  const handleReorder = (reorderedItems: DraggableItem[]) => {
    const newColumnOrder = reorderedItems.map(
      (item) => item.id,
    ) as ColumnOrderState;

    // Recalculate pin sides based on new positions (closest edge)
    const recalculatedPinning = recalculatePinSides({
      columnPinning,
      newOrder: newColumnOrder,
    });

    if (
      !detectPinOrderConflict({
        columnPinning: recalculatedPinning,
        newOrder: newColumnOrder,
      })
    ) {
      setColumnsOrder(newColumnOrder);
      setColumnPinning(recalculatedPinning);
      return;
    }

    setOrderConflict({
      description:
        'Dragging this column broke the pinning layout. Pinned columns must stay at the edges. Choose how to proceed:',
      isOpen: true,
      pendingOrder: newColumnOrder,
      pendingPinning: recalculatedPinning,
    });
  };

  const isContiguousPin = ({
    columnKey,
    side,
  }: {
    columnKey: string;
    side: 'left' | 'right';
  }) => {
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    if (side === 'left') {
      // All columns from index 0 to index-1 must be pinned left
      for (let i = 0; i < index; i++) {
        if (!columnPinning.left.includes(allOrderedColumns[i]?.key ?? '')) {
          return false;
        }
      }
    } else {
      // All columns from index+1 to end must be pinned right
      for (let i = index + 1; i < allOrderedColumns.length; i++) {
        if (!columnPinning.right.includes(allOrderedColumns[i]?.key ?? '')) {
          return false;
        }
      }
    }

    return true;
  };

  const applyPin = ({
    columnKey,
    side,
  }: {
    columnKey: string;
    side: 'left' | 'right';
  }) => {
    const newPinning = {
      left: columnPinning.left.filter((k) => k !== columnKey),
      right: columnPinning.right.filter((k) => k !== columnKey),
    };

    if (side === 'left') {
      newPinning.left = [...newPinning.left, columnKey];
    } else {
      newPinning.right = [...newPinning.right, columnKey];
    }

    setColumnPinning(newPinning);
  };

  const handleTogglePin = ({
    columnKey,
    isPinning,
  }: {
    columnKey: string;
    isPinning: boolean;
  }) => {
    if (!isPinning) {
      const newPinning = {
        left: columnPinning.left.filter((k) => k !== columnKey),
        right: columnPinning.right.filter((k) => k !== columnKey),
      };

      const currentOrder = allOrderedColumns.map(
        (col) => col.key,
      ) as ColumnOrderState;

      if (
        !detectPinOrderConflict({
          columnPinning: newPinning,
          newOrder: currentOrder,
        })
      ) {
        setColumnPinning(newPinning);
        return;
      }

      const side = columnPinning.left.includes(columnKey) ? 'left' : 'right';
      const col = allOrderedColumns.find((c) => c.key === columnKey);
      setUnpinConflictModal({
        columnKey,
        columnLabel: col?.label ?? columnKey,
        isOpen: true,
        side,
      });
      return;
    }

    const col = allOrderedColumns.find((c) => c.key === columnKey);
    setPinSideModal({
      columnKey,
      columnLabel: col?.label ?? columnKey,
      isOpen: true,
    });
  };

  const resolveSide = ({
    columnKey,
    pinSide,
  }: {
    columnKey: string;
    pinSide: PinSide;
  }): 'left' | 'right' => {
    if (pinSide !== 'closest-edge') return pinSide;
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);
    const midpoint = Math.floor(allOrderedColumns.length / 2);
    return index < midpoint ? 'left' : 'right';
  };

  const handlePinSideAccept = (pinSide: PinSide) => {
    const { columnKey } = pinSideModal;
    const side = resolveSide({ columnKey, pinSide });

    if (isContiguousPin({ columnKey, side })) {
      applyPin({ columnKey, side });
    } else {
      const col = allOrderedColumns.find((c) => c.key === columnKey);
      setConflictModal({
        columnKey,
        columnLabel: col?.label ?? columnKey,
        isOpen: true,
        side,
      });
    }

    setPinSideModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handlePinSideCancel = () => {
    setPinSideModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleUnpinConflictAccept = (resolution: UnpinConflictResolution) => {
    const { columnKey, side } = unpinConflictModal;
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    if (resolution === 'unpin-beyond') {
      const newPinning = {
        left: [...columnPinning.left],
        right: [...columnPinning.right],
      };

      if (side === 'left') {
        // Unpin this column and all left-pinned columns after it (towards center)
        const keysToUnpin = new Set(
          allOrderedColumns
            .slice(index)
            .map((col) => col.key)
            .filter((key) => newPinning.left.includes(key)),
        );
        newPinning.left = newPinning.left.filter((k) => !keysToUnpin.has(k));
      } else {
        // Unpin this column and all right-pinned columns before it (towards center)
        const keysToUnpin = new Set(
          allOrderedColumns
            .slice(0, index + 1)
            .map((col) => col.key)
            .filter((key) => newPinning.right.includes(key)),
        );
        newPinning.right = newPinning.right.filter((k) => !keysToUnpin.has(k));
      }

      setColumnPinning(newPinning);
    } else {
      // reorder-to-fill: remove pin and move remaining pinned columns together
      const newPinning = {
        left: columnPinning.left.filter((k) => k !== columnKey),
        right: columnPinning.right.filter((k) => k !== columnKey),
      };

      const newOrder = allOrderedColumns
        .filter((col) => col.key !== columnKey)
        .map((col) => col.key);

      if (side === 'left') {
        // Insert after the last left-pinned column
        let lastLeftPinnedIndex = -1;
        for (const [i, key] of newOrder.entries()) {
          if (newPinning.left.includes(key)) {
            lastLeftPinnedIndex = i;
          }
        }
        newOrder.splice(lastLeftPinnedIndex + 1, 0, columnKey);
      } else {
        // Insert before the first right-pinned column
        const firstRightPinnedIndex = newOrder.findIndex((key) =>
          newPinning.right.includes(key),
        );
        const insertAt =
          firstRightPinnedIndex === -1
            ? newOrder.length
            : firstRightPinnedIndex;
        newOrder.splice(insertAt, 0, columnKey);
      }

      setColumnsOrder(newOrder as ColumnOrderState);
      setColumnPinning(newPinning);
    }

    setUnpinConflictModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleUnpinConflictCancel = () => {
    setUnpinConflictModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConflictAccept = (resolution: PinConflictResolution) => {
    const { columnKey, side } = conflictModal;
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    if (resolution === 'move-column') {
      // Move the column to be adjacent to existing pinned columns on that side
      const newOrder = allOrderedColumns
        .filter((col) => col.key !== columnKey)
        .map((col) => col.key);
      const column = allOrderedColumns[index];
      if (column?.key) {
        if (side === 'left') {
          // Insert after the last left-pinned column
          let lastLeftPinnedIndex = -1;
          for (const [i, key] of newOrder.entries()) {
            if (columnPinning.left.includes(key)) {
              lastLeftPinnedIndex = i;
            }
          }
          newOrder.splice(lastLeftPinnedIndex + 1, 0, column.key);
        } else {
          // Insert before the first right-pinned column
          const firstRightPinnedIndex = newOrder.findIndex((key) =>
            columnPinning.right.includes(key),
          );
          const insertAt =
            firstRightPinnedIndex === -1
              ? newOrder.length
              : firstRightPinnedIndex;
          newOrder.splice(insertAt, 0, column.key);
        }
      }

      setColumnsOrder(newOrder);
      applyPin({ columnKey, side });
    } else {
      // Pin all columns between the edge and this column
      const newPinning = {
        left: [...columnPinning.left],
        right: [...columnPinning.right],
      };

      if (side === 'left') {
        for (let i = 0; i <= index; i++) {
          const key = allOrderedColumns[i]?.key ?? '';
          if (!newPinning.left.includes(key)) {
            // Remove from right if present
            newPinning.right = newPinning.right.filter((k) => k !== key);
            newPinning.left.push(key);
          }
        }
      } else {
        for (let i = index; i < allOrderedColumns.length; i++) {
          const key = allOrderedColumns[i]?.key ?? '';
          if (!newPinning.right.includes(key)) {
            // Remove from left if present
            newPinning.left = newPinning.left.filter((k) => k !== key);
            newPinning.right.push(key);
          }
        }
      }

      setColumnPinning(newPinning);
    }

    setConflictModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConflictCancel = () => {
    setConflictModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOrderBySorting = () => {
    const sortedKeys = sorting.map((s) => s.columnKey);
    const remainingKeys = columnsOrder.filter(
      (key) => !sortedKeys.includes(key),
    );
    const newOrder = [...sortedKeys, ...remainingKeys] as ColumnOrderState;

    if (!detectPinOrderConflict({ columnPinning, newOrder })) {
      setColumnsOrder(newOrder);
      return;
    }

    setOrderConflict({
      description:
        'Reordering columns by sorting will move pinned columns out of their pinned positions. Choose how to proceed:',
      isOpen: true,
      pendingOrder: newOrder,
      pendingPinning: columnPinning,
    });
  };

  const handleOrderConflictAccept = (resolution: OrderConflictResolution) => {
    const result = resolvePinOrderConflict({
      columnPinning: orderConflict.pendingPinning,
      newOrder: orderConflict.pendingOrder,
      resolution,
    });

    setColumnsOrder(result.columnOrder);
    setColumnPinning(result.columnPinning);
    setOrderConflict((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOrderConflictCancel = () => {
    setOrderConflict((prev) => ({ ...prev, isOpen: false }));
  };

  // Convert columns to draggable items
  const draggableItems: DraggableItem[] = allOrderedColumns.map((col) => {
    const isPinned =
      columnPinning.left.includes(col.key) ||
      columnPinning.right.includes(col.key);

    return {
      content: (
        <div {...stylex.props(styles.columnItem)}>
          <span {...stylex.props(styles.columnLabel)}>{col.label}</span>
          <ToggleSwitch
            isChecked={isPinned}
            label='Pin'
            onChange={(isChecked) => {
              handleTogglePin({ columnKey: col.key, isPinning: isChecked });
            }}
          />
          <ToggleSwitch
            isChecked={!columnVisibility.has(col.key)}
            label='Show'
            onChange={(isChecked) => {
              handleToggleVisibility({
                columnKey: col.key,
                isVisible: isChecked,
              });
            }}
          />
        </div>
      ),
      id: col.key,
    };
  });

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <SidePanelSectionHeader
        title={`Column Order & Visibility (${allOrderedColumns.length - columnVisibility.size}/${allOrderedColumns.length})`}
        toolbar={
          <ColumnOrderSectionFooter
            onOrderBySorting={handleOrderBySorting}
            variant='toolbar'
          />
        }
      />
      <DraggableList items={draggableItems} onOrderChange={handleReorder} />

      <ColumnOrderSectionFooter onOrderBySorting={handleOrderBySorting} />
      <PinSideModal
        columnLabel={pinSideModal.columnLabel}
        isOpen={pinSideModal.isOpen}
        onAccept={handlePinSideAccept}
        onCancel={handlePinSideCancel}
      />
      <PinConflictModal
        columnLabel={conflictModal.columnLabel}
        isOpen={conflictModal.isOpen}
        onAccept={handleConflictAccept}
        onCancel={handleConflictCancel}
        side={conflictModal.side}
      />
      <UnpinConflictModal
        columnLabel={unpinConflictModal.columnLabel}
        isOpen={unpinConflictModal.isOpen}
        onAccept={handleUnpinConflictAccept}
        onCancel={handleUnpinConflictCancel}
        side={unpinConflictModal.side}
      />
      <OrderConflictModal
        description={orderConflict.description}
        isOpen={orderConflict.isOpen}
        onAccept={handleOrderConflictAccept}
        onCancel={handleOrderConflictCancel}
      />
    </div>
  );
};
