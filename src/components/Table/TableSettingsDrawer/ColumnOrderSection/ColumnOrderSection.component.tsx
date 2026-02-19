import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '@/components/DraggableList';

import { DraggableList } from '@/components/DraggableList';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ToggleSwitch } from '@/components/ToggleSwitch';

import type {
  ColumnOrderSectionProps,
  HandleToggleVisibilityArgs,
} from './ColumnOrderSection.types';

import {
  useSetColumnsOrder,
  useSetColumnsVisibility,
} from '../TableDrawerContext/hooks/store/columns/actions';
import {
  useGetColumnOrder,
  useGetColumnVisibility,
} from '../TableDrawerContext/hooks/store/columns/selectors';
import { styles } from './ColumnOrderSection.stylex';

export const ColumnOrderSection = ({ ...props }: ColumnOrderSectionProps) => {
  const columns = useGetColumns();
  const columnsOrder = useGetColumnOrder();
  const columnVisibility = useGetColumnVisibility();

  const onColumnOrderChange = useSetColumnsOrder();
  const onColumnVisibilityChange = useSetColumnsVisibility();
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
            handleToggleVisibility({
              columnKey: col.key,
              isVisible: isChecked,
            });
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
