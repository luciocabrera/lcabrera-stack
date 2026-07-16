import { PinSideModal } from '@repo/ui/components/PinSideModal';

import {
  useAcceptPinSide,
  useCancelPinSide,
} from '../ColumnOrderSectionContext/actions';
import { useGetPinSideModal } from '../ColumnOrderSectionContext/selectors';

/**
 * Store-connected wrapper around the shared presentational PinSideModal.
 * Owns its store wiring: reads the pin-side modal slice and dispatches the
 * accept/cancel actions itself, keeping the shared component decoupled from
 * the column order section store.
 */
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
