import { ColumnOrderPinSideModal } from '../ColumnOrderPinSideModal/ColumnOrderPinSideModal.component';
import { OrderConflictModal } from '../OrderConflictModal/OrderConflictModal.component';
import { PinConflictModal } from '../PinConflictModal/PinConflictModal.component';
import { UnpinConflictModal } from '../UnpinConflictModal/UnpinConflictModal.component';

/**
 * Hosts the four pin/order conflict-resolution modals of the column order
 * section. Pure composition: every modal owns its own store wiring.
 */
export const ColumnOrderSectionModals = () => {
  return (
    <>
      <ColumnOrderPinSideModal />
      <PinConflictModal />
      <UnpinConflictModal />
      <OrderConflictModal />
    </>
  );
};
