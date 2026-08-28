import type { DraggableItem } from '#ui/components/DraggableList';

import { DraggableList } from '#ui/components/DraggableList';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetGroupingKeys,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';

import type { ColumnOrderSectionBodyProps } from './ColumnOrderSectionBody.types';

import { useReorderColumns } from '../ColumnOrderSectionContext/actions';
import { useGetRenderedColumnKeys } from '../hooks';
import {
  buildAllOrderedColumns,
  createDraggableItems,
  filterSettingsColumns,
  hoistRenderedColumns,
} from '../utils';
import { ColumnOrderItemContent } from './ColumnOrderItemContent/ColumnOrderItemContent.component';

export const ColumnOrderSectionBody = ({
  isBusy = false,
}: ColumnOrderSectionBodyProps) => {
  const columns = useGetColumns();
  const columnsOrder = useGetColumnOrder();
  const columnPinning = useGetColumnPinning();
  const groupingKeys = useGetGroupingKeys();
  const renderedColumnKeys = useGetRenderedColumnKeys();
  const reorderColumns = useReorderColumns();

  const settingsColumns = filterSettingsColumns(columns);
  const allOrderedColumns = hoistRenderedColumns({
    columns: buildAllOrderedColumns({ columns: settingsColumns, columnsOrder }),
    groupingKeys,
    renderedColumnKeys,
  });

  const draggableItems: readonly DraggableItem[] = createDraggableItems({
    allOrderedColumns,
    columnPinning,
    groupingKeys,
    renderedColumnKeys: new Set(renderedColumnKeys),
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
