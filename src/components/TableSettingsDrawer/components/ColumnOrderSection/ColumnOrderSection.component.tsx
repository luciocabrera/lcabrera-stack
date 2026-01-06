import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '@/components/DraggableList';

import { DraggableList } from '@/components/DraggableList';
import { ToggleSwitch } from '@/components/ToggleSwitch';

import type { ColumnOrderSectionProps } from './ColumnOrderSection.types';

import { styles } from './ColumnOrderSection.stylex';

export const ColumnOrderSection = ({
  columnOrder,
  columns,
  columnVisibility,
  onColumnOrderChange,
  onColumnVisibilityChange,
  ...props
}: ColumnOrderSectionProps) => {
  // Build ordered column list (use columnOrder if available, otherwise use column definition order)
  const orderedColumns =
    columnOrder.length > 0
      ? columnOrder
          .map((key) => columns.find((col) => col.key === key))
          .filter((col): col is typeof columns[0] => col !== undefined)
      : columns;

  // Add any columns not in columnOrder to the end
  const remainingColumns = columns.filter(
    (col) => !orderedColumns.some((orderedCol) => orderedCol.key === col.key),
  );
  const allOrderedColumns = [...orderedColumns, ...remainingColumns];

  const handleToggleVisibility = ({
    columnKey,
    isVisible,
  }: {
    columnKey: string;
    isVisible: boolean;
  }) => {
    const newVisibility = new Set(columnVisibility);
    if (isVisible) {
      newVisibility.delete(columnKey);
    } else {
      newVisibility.add(columnKey);
    }
    onColumnVisibilityChange(newVisibility);
  };

  const handleReorder = (reorderedItems: DraggableItem[]) => {
    const newColumnOrder = reorderedItems.map((item) => item.id);
    onColumnOrderChange(newColumnOrder);
  };

  // Convert columns to draggable items
  const draggableItems: DraggableItem[] = allOrderedColumns.map((col) => ({
    content: (
      <div {...stylex.props(styles.columnItem)}>
        <span {...stylex.props(styles.columnLabel)}>{col.label}</span>
        <ToggleSwitch
          isChecked={!columnVisibility.has(col.key)}
          label='Show'
          onChange={(isChecked) => {
            handleToggleVisibility({ columnKey: col.key, isVisible: isChecked });
          }}
        />
      </div>
    ),
    id: col.key,
  }));

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <h3 {...stylex.props(styles.header)}>Column Order & Visibility</h3>
      <DraggableList items={draggableItems} onOrderChange={handleReorder} />
    </div>
  );
};
