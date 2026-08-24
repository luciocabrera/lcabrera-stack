import { ChoiceModal } from '#ui/components/ChoiceModal';
import { ORDER_CONFLICT_OPTIONS } from '#ui/constants/pinningPreferences.constants';

import {
  useAcceptOrderConflict,
  useCancelOrderConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetOrderConflict } from '../ColumnOrderSectionContext/selectors';

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
