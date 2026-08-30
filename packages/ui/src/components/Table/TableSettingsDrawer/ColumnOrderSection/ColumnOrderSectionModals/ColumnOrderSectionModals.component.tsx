import { ColumnGroupingPromptModal } from '../ColumnGroupingPromptModal/ColumnGroupingPromptModal.component';
import { ColumnOrderPinSideModal } from '../ColumnOrderPinSideModal/ColumnOrderPinSideModal.component';
import { OrderConflictModal } from '../OrderConflictModal/OrderConflictModal.component';
import { PinConflictModal } from '../PinConflictModal/PinConflictModal.component';
import { UnpinConflictModal } from '../UnpinConflictModal/UnpinConflictModal.component';

export const ColumnOrderSectionModals = () => {
  return (
    <>
      <ColumnGroupingPromptModal />
      <ColumnOrderPinSideModal />
      <PinConflictModal />
      <UnpinConflictModal />
      <OrderConflictModal />
    </>
  );
};
