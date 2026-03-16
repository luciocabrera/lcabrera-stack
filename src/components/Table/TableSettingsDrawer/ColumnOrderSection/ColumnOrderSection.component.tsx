import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '@/components/DraggableList';

import { DraggableList } from '@/components/DraggableList';
import { LockIcon } from '@/components/Icons';
import { PinSideModal } from '@/components/PinSideModal';
import { SidePanelSectionHeader } from '@/components/SidePanel';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import {
  useGetColumnOrder,
  useGetColumnPinning,
  useGetColumnVisibility,
} from '@/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';
import { ToggleSwitch } from '@/components/ToggleSwitch';

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
import { ColumnOrderSectionFooter } from './ColumnOrderSectionFooter';
import { OrderConflictModal } from './OrderConflictModal';
import { PinConflictModal } from './PinConflictModal';
import { UnpinConflictModal } from './UnpinConflictModal';
import { buildAllOrderedColumns } from './utils';

export const ColumnOrderSection = ({ ...props }: ColumnOrderSectionProps) => {
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
  const allOrderedColumns = buildAllOrderedColumns({ columns: settingsColumns, columnsOrder });

  // Convert columns to draggable items
  const draggableItems: DraggableItem[] = allOrderedColumns.map((col) => {
    const isPinned =
      columnPinning.left.includes(col.key) ||
      columnPinning.right.includes(col.key);
    const isStatic = col.isStatic === true;

    return {
      content: (
        <div {...stylex.props(styles.columnItem)}>
          {isStatic && <LockIcon size={14} />}
          <span {...stylex.props(styles.columnLabel)}>{col.label}</span>
          <ToggleSwitch
            isChecked={isPinned}
            isDisabled={isStatic}
            label='Pin'
            onChange={(isChecked) => {
              toggleColumnPin({ columnKey: col.key, isPinning: isChecked });
            }}
          />
          <ToggleSwitch
            isChecked={!columnVisibility.has(col.key)}
            isDisabled={isStatic}
            label='Show'
            onChange={(isChecked) => {
              toggleColumnVisibility({
                columnKey: col.key,
                isVisible: isChecked,
              });
            }}
          />
        </div>
      ),
      id: col.key,
      isDraggable: !isStatic,
    };
  });

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <SidePanelSectionHeader
        title={`Column Order & Visibility (${allOrderedColumns.length - columnVisibility.size}/${allOrderedColumns.length})`}
        toolbar={<ColumnOrderSectionFooter variant='toolbar' />}
      />
      <DraggableList items={draggableItems} onOrderChange={reorderColumns} />

      <ColumnOrderSectionFooter />
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
    </div>
  );
};
