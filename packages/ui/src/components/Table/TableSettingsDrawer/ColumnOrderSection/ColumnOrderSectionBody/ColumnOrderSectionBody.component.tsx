import type { DraggableItem } from '#ui/components/DraggableList';

import { DraggableList } from '#ui/components/DraggableList';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetColumnVisibility,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';

import type { ColumnOrderSectionBodyProps } from './ColumnOrderSectionBody.types';

import { useReorderColumns } from '../ColumnOrderSectionContext/actions';
import {
  buildAllOrderedColumns,
  createDraggableItems,
  filterSettingsColumns,
} from '../utils';
import { ColumnOrderItemContent } from './ColumnOrderItemContent/ColumnOrderItemContent.component';

export const ColumnOrderSectionBody = ({
  isBusy = false,
}: ColumnOrderSectionBodyProps) => {
  const columns = useGetColumns();
  const columnsOrder = useGetColumnOrder();
  const columnPinning = useGetColumnPinning();
  const columnVisibility = useGetColumnVisibility();
  const groupingKeys = useGetTableGroupingKeys();
  const reorderColumns = useReorderColumns();

  const settingsColumns = filterSettingsColumns(columns);
  const allOrderedColumns = buildAllOrderedColumns({
    columns: settingsColumns,
    columnsOrder,
  });

  const draggableItems: readonly DraggableItem[] = createDraggableItems({
    allOrderedColumns,
    columnPinning,
    columnVisibility,
    groupingKeys,
    renderItemContent: (itemContentProps) => (
      <ColumnOrderItemContent {...itemContentProps} isBusy={isBusy} />
    ),
  });

  return (
    <DraggableList
      isBusy={isBusy}
      items={draggableItems}
      onOrderChange={reorderColumns}
    />
  );
};
