import type { DraggableItem } from '@repo/ui/components/DraggableList';

import { DraggableList } from '@repo/ui/components/DraggableList';
import { LockIcon } from '@repo/ui/components/Icons';
import { PinSideModal } from '@repo/ui/components/PinSideModal';
import {
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@repo/ui/components/SidePanel';
import { useGetColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetColumnVisibility,
} from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';
import { ToggleSwitch } from '@repo/ui/components/ToggleSwitch';
import * as stylex from '@stylexjs/stylex';

import type { ColumnOrderSectionProps } from './ColumnOrderSection.types';

import { styles } from './ColumnOrderSection.stylex';
import {
  useAcceptPinConflict,
  useAcceptPinSide,
  useCancelPinConflict,
  useCancelPinSide,
  useReorderColumns,
  useToggleColumnPin,
  useToggleColumnVisibility,
} from './ColumnOrderSectionContext/actions';
import {
  useGetConflictModal,
  useGetOrderConflict,
  useGetPinSideModal,
  useGetUnpinConflictModal,
} from './ColumnOrderSectionContext/selectors';
import { ColumnOrderSectionToolbar } from './ColumnOrderSectionToolbar';
import { OrderConflictModal } from './OrderConflictModal';
import { PinConflictModal } from './PinConflictModal';
import { UnpinConflictModal } from './UnpinConflictModal';
import { buildAllOrderedColumns, createDraggableItems } from './utils';

export const ColumnOrderSection = ({
  isBusy = false,
  ...props
}: ColumnOrderSectionProps) => {
  const columns = useGetColumns();
  const columnsOrder = useGetColumnOrder();
  const columnPinning = useGetColumnPinning();
  const columnVisibility = useGetColumnVisibility();
  const pinSideModal = useGetPinSideModal();
  const conflictModal = useGetConflictModal();
  const unpinConflictModal = useGetUnpinConflictModal();
  const orderConflict = useGetOrderConflict();

  const toggleColumnVisibility = useToggleColumnVisibility();
  const reorderColumns = useReorderColumns();
  const toggleColumnPin = useToggleColumnPin();
  const acceptPinSide = useAcceptPinSide();
  const cancelPinSide = useCancelPinSide();
  const acceptPinConflict = useAcceptPinConflict();
  const cancelPinConflict = useCancelPinConflict();

  const settingsColumns = columns.filter((col) => !col.render || col.isStatic);
  const allOrderedColumns = buildAllOrderedColumns({
    columns: settingsColumns,
    columnsOrder,
  });

  const draggableItems: readonly DraggableItem[] = createDraggableItems({
    allOrderedColumns,
    columnPinning,
    columnVisibility,
    renderItemContent: ({
      columnKey,
      isPinned,
      isStatic,
      isVisible,
      label,
    }) => {
      return (
        <div {...stylex.props(styles.columnItem)}>
          {isStatic && <LockIcon size={14} />}
          <span {...stylex.props(styles.columnLabel)}>{label}</span>
          <ToggleSwitch
            isBusy={isBusy}
            isChecked={isPinned}
            isDisabled={isStatic}
            label='Pin'
            onChange={(isChecked) => {
              toggleColumnPin({ columnKey, isPinning: isChecked });
            }}
          />
          <ToggleSwitch
            isBusy={isBusy}
            isChecked={isVisible}
            isDisabled={isStatic}
            label='Show'
            onChange={(isChecked) => {
              toggleColumnVisibility({
                columnKey,
                isVisible: isChecked,
              });
            }}
          />
        </div>
      );
    },
  });

  return (
    <SidePanelSectionMain {...props}>
      <SidePanelSectionHeader
        title={`Column Order & Visibility (${allOrderedColumns.length - columnVisibility.size}/${allOrderedColumns.length})`}
        toolbar={
          <ColumnOrderSectionToolbar isBusy={isBusy} variant='toolbar' />
        }
      />
      <DraggableList
        isBusy={isBusy}
        items={draggableItems}
        onOrderChange={reorderColumns}
      />

      <ColumnOrderSectionToolbar isBusy={isBusy} />
      <PinSideModal
        columnLabel={pinSideModal.columnLabel}
        isOpen={pinSideModal.isOpen}
        onAccept={acceptPinSide}
        onCancel={cancelPinSide}
      />
      <PinConflictModal
        columnLabel={conflictModal.columnLabel}
        isOpen={conflictModal.isOpen}
        onAccept={acceptPinConflict}
        onCancel={cancelPinConflict}
        side={conflictModal.side}
      />
      <UnpinConflictModal
        columnLabel={unpinConflictModal.columnLabel}
        isOpen={unpinConflictModal.isOpen}
        side={unpinConflictModal.side}
      />
      <OrderConflictModal
        description={orderConflict.description}
        isOpen={orderConflict.isOpen}
      />
    </SidePanelSectionMain>
  );
};
