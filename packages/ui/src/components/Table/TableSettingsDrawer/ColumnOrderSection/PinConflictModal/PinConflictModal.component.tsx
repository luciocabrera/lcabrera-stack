import { ChoiceModal } from '@lcabrera/ui/components/ChoiceModal';
import { PIN_CONFLICT_OPTIONS } from '@lcabrera/ui/constants/pinningPreferences.constants';

import {
  useAcceptPinConflict,
  useCancelPinConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetConflictModal } from '../ColumnOrderSectionContext/selectors';

/**
 * Conflict-resolution modal shown when pinning a column that is not adjacent
 * to the existing pinned group. Owns its store wiring: reads the pin-conflict
 * modal slice and dispatches the accept/cancel actions itself, delegating the
 * shell to the shared {@link ChoiceModal}.
 */
export const PinConflictModal = () => {
  const { columnLabel, isOpen, side } = useGetConflictModal();
  const acceptPinConflict = useAcceptPinConflict();
  const cancelPinConflict = useCancelPinConflict();

  const options = PIN_CONFLICT_OPTIONS.map((option) => {
    if (option.value === 'move-column') {
      return {
        ...option,
        label: `Move column next to ${side}-pinned columns`,
      };
    }

    return option;
  });

  return (
    <ChoiceModal
      defaultValue='move-column'
      description={
        <>
          <strong>{columnLabel}</strong> is not adjacent to the {side}-pinned
          columns. Choose how to resolve this:
        </>
      }
      isOpen={isOpen}
      onAccept={acceptPinConflict}
      onCancel={cancelPinConflict}
      options={options}
      radioName='pin-conflict-resolution'
      title='Pin Conflict'
    />
  );
};
