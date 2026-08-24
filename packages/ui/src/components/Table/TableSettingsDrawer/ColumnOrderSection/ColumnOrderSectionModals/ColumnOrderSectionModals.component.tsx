import { ColumnOrderPinSideModal } from '../ColumnOrderPinSideModal/ColumnOrderPinSideModal.component';
import { OrderConflictModal } from '../OrderConflictModal/OrderConflictModal.component';
import { PinConflictModal } from '../PinConflictModal/PinConflictModal.component';
import { UnpinConflictModal } from '../UnpinConflictModal/UnpinConflictModal.component';

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
