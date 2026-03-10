import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { DraggableItem } from '@/components/DraggableList';

import { DraggableList } from '@/components/DraggableList';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ToggleSwitch } from '@/components/ToggleSwitch';

import type {
  ColumnOrderSectionProps,
  HandleToggleVisibilityArgs,
} from './ColumnOrderSection.types';
import type { PinConflictResolution } from './PinConflictModal';

import {
  useSetColumnPinning,
  useSetColumnsOrder,
  useSetColumnsVisibility,
} from '../TableDrawerContext/actions';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetColumnVisibility,
} from '../TableDrawerContext/selectors';
import { styles } from './ColumnOrderSection.stylex';
import { ColumnOrderSectionFooter } from './ColumnOrderSectionFooter';
import { PinConflictModal } from './PinConflictModal';

export const ColumnOrderSection = ({ ...props }: ColumnOrderSectionProps) => {
  const columns = useGetColumns();
  const columnsOrder = useGetColumnOrder();
  const columnPinning = useGetColumnPinning();
  const columnVisibility = useGetColumnVisibility();

  const setColumnPinning = useSetColumnPinning();
  const setColumnsOrder = useSetColumnsOrder();
  const setColumnsVisibility = useSetColumnsVisibility();

  const [conflictModal, setConflictModal] = useState<{
    columnKey: string;
    columnLabel: string;
    isOpen: boolean;
    side: 'left' | 'right';
  }>({ columnKey: '', columnLabel: '', isOpen: false, side: 'left' });

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
    const newColumnOrder = reorderedItems.map((item) => item.id);
    setColumnsOrder(newColumnOrder);
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
        if (!columnPinning.left.includes(allOrderedColumns[i].key)) {
          return false;
        }
      }
    } else {
      // All columns from index+1 to end must be pinned right
      for (let i = index + 1; i < allOrderedColumns.length; i++) {
        if (!columnPinning.right.includes(allOrderedColumns[i].key)) {
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
      // Unpinning — just remove
      setColumnPinning({
        left: columnPinning.left.filter((k) => k !== columnKey),
        right: columnPinning.right.filter((k) => k !== columnKey),
      });
      return;
    }

    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);
    const midpoint = Math.floor(allOrderedColumns.length / 2);
    const side = index < midpoint ? 'left' : 'right';

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

      if (side === 'left') {
        // Insert after the last left-pinned column
        let lastLeftPinnedIndex = -1;
        for (let i = 0; i < newOrder.length; i++) {
          if (columnPinning.left.includes(newOrder[i])) {
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
          firstRightPinnedIndex === -1 ? newOrder.length : firstRightPinnedIndex;
        newOrder.splice(insertAt, 0, column.key);
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
          const key = allOrderedColumns[i].key;
          if (!newPinning.left.includes(key)) {
            // Remove from right if present
            newPinning.right = newPinning.right.filter((k) => k !== key);
            newPinning.left.push(key);
          }
        }
      } else {
        for (let i = index; i < allOrderedColumns.length; i++) {
          const key = allOrderedColumns[i].key;
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
      <div {...stylex.props(styles.headerRow)}>
        <h3 {...stylex.props(styles.headerTitle)}>
          Column Order & Visibility (
          {allOrderedColumns.length - columnVisibility.size}/
          {allOrderedColumns.length})
        </h3>
        <ColumnOrderSectionFooter variant='toolbar' />
      </div>
      <DraggableList items={draggableItems} onOrderChange={handleReorder} />

      <ColumnOrderSectionFooter />
      <PinConflictModal
        columnLabel={conflictModal.columnLabel}
        isOpen={conflictModal.isOpen}
        onAccept={handleConflictAccept}
        onCancel={handleConflictCancel}
        side={conflictModal.side}
      />
    </div>
  );
};
