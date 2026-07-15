import { ActionButtons } from '@repo/ui/components/ActionButtons';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { PIN_CONFLICT_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { PinConflictResolution } from '../ColumnOrderSection.types';

import {
  useAcceptPinConflict,
  useCancelPinConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetConflictModal } from '../ColumnOrderSectionContext/selectors';
import { styles } from './PinConflictModal.stylex';

/**
 * Conflict-resolution modal shown when pinning a column that is not adjacent
 * to the existing pinned group. Owns its store wiring: reads the pin-conflict
 * modal slice and dispatches the accept/cancel actions itself.
 */
export const PinConflictModal = () => {
  const { columnLabel, isOpen, side } = useGetConflictModal();
  const acceptPinConflict = useAcceptPinConflict();
  const cancelPinConflict = useCancelPinConflict();

  const [selectedResolution, setSelectedResolution] =
    useState<PinConflictResolution>('move-column');

  const options = PIN_CONFLICT_OPTIONS.map((option) => {
    if (option.value === 'move-column') {
      return {
        ...option,
        label: `Move column next to ${side}-pinned columns`,
      };
    }

    return option;
  });

  const handleAccept = () => {
    acceptPinConflict(selectedResolution);
    setSelectedResolution('move-column');
  };

  const handleCancel = () => {
    cancelPinConflict();
    setSelectedResolution('move-column');
  };

  return (
    <Modal
      footer={
        <ActionButtons
          actions={[
            { label: 'Accept', onClick: handleAccept, variant: 'primary' },
            { label: 'Cancel', onClick: handleCancel },
          ]}
        />
      }
      isOpen={isOpen}
      onClose={handleCancel}
      title='Pin Conflict'
    >
      <p {...stylex.props(styles.description)}>
        <strong>{columnLabel}</strong> is not adjacent to the {side}-pinned
        columns. Choose how to resolve this:
      </p>
      <RadioOptionGroup
        name='pin-conflict-resolution'
        onChange={setSelectedResolution}
        options={options}
        value={selectedResolution}
      />
    </Modal>
  );
};
