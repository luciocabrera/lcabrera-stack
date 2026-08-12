import { ChoiceModal } from '#ui/components/ChoiceModal';
import { UNPIN_CONFLICT_OPTIONS } from '#ui/constants/pinningPreferences.constants';

import {
  useAcceptUnpinConflict,
  useCancelUnpinConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetUnpinConflictModal } from '../ColumnOrderSectionContext/selectors';

/**
 * Conflict-resolution modal shown when unpinning a column would leave a gap
 * in its pinned group. Owns its store wiring: reads the unpin-conflict modal
 * slice and dispatches the accept/cancel actions itself, delegating the shell
 * to the shared {@link ChoiceModal}.
 */
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
