import { ChoiceModal } from '@repo/ui/components/ChoiceModal';
import { ORDER_CONFLICT_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';

import {
  useAcceptOrderConflict,
  useCancelOrderConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetOrderConflict } from '../ColumnOrderSectionContext/selectors';

/**
 * Conflict-resolution modal shown when a proposed column order breaks pin
 * contiguity. Owns its store wiring: reads the order-conflict slice and
 * dispatches the accept/cancel actions itself, delegating the shell to the
 * shared {@link ChoiceModal}.
 */
export const OrderConflictModal = () => {
  const { description, isOpen } = useGetOrderConflict();
  const acceptOrderConflict = useAcceptOrderConflict();
  const cancelOrderConflict = useCancelOrderConflict();

  return (
    <ChoiceModal
      defaultValue='remove-conflicting-pins'
      description={description}
      isOpen={isOpen}
      onAccept={acceptOrderConflict}
      onCancel={cancelOrderConflict}
      options={ORDER_CONFLICT_OPTIONS}
      radioName='sort-order-conflict-resolution'
      title='Order & Pinning Conflict'
    />
  );
};
