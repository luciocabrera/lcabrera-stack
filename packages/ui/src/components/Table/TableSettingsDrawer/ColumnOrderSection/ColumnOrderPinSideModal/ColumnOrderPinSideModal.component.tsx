import { PinSideModal } from '#ui/components/PinSideModal';

import {
  useAcceptPinSide,
  useCancelPinSide,
} from '../ColumnOrderSectionContext/actions';
import { useGetPinSideModal } from '../ColumnOrderSectionContext/selectors';

export const ColumnOrderPinSideModal = () => {
  const { columnLabel, isOpen } = useGetPinSideModal();
  const acceptPinSide = useAcceptPinSide();
  const cancelPinSide = useCancelPinSide();

  return (
    <PinSideModal
      columnLabel={columnLabel}
      isOpen={isOpen}
      onAccept={acceptPinSide}
      onCancel={cancelPinSide}
    />
  );
};
