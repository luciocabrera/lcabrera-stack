import { ChoiceModal } from '#ui/components/ChoiceModal';
import { UNPIN_CONFLICT_OPTIONS } from '#ui/constants/pinningPreferences.constants';

import {
  useAcceptUnpinConflict,
  useCancelUnpinConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetUnpinConflictModal } from '../ColumnOrderSectionContext/selectors';

export const UnpinConflictModal = () => {
  const { columnLabel, isOpen, side } = useGetUnpinConflictModal();
  const acceptUnpinConflict = useAcceptUnpinConflict();
  const cancelUnpinConflict = useCancelUnpinConflict();

  return (
    <ChoiceModal
      defaultValue='unpin-beyond'
      description={
        <>
          Unpinning <strong>{columnLabel}</strong> would leave a gap in the{' '}
          {side}-pinned columns. Choose how to resolve this:
        </>
      }
      isOpen={isOpen}
      onAccept={acceptUnpinConflict}
      onCancel={cancelUnpinConflict}
      options={UNPIN_CONFLICT_OPTIONS}
      radioName='unpin-conflict-resolution'
      title='Unpin Conflict'
    />
  );
};
