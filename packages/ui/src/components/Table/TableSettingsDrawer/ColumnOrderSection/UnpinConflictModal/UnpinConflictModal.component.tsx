import { Button } from '@repo/ui/components/Button';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { UNPIN_CONFLICT_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { UnpinConflictResolution } from '../ColumnOrderSection.types';

import {
  useAcceptUnpinConflict,
  useCancelUnpinConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetUnpinConflictModal } from '../ColumnOrderSectionContext/selectors';
import { styles } from './UnpinConflictModal.stylex';

/**
 * Conflict-resolution modal shown when unpinning a column would leave a gap
 * in its pinned group. Owns its store wiring: reads the unpin-conflict modal
 * slice and dispatches the accept/cancel actions itself.
 */
export const UnpinConflictModal = () => {
  const { columnLabel, isOpen, side } = useGetUnpinConflictModal();
  const acceptUnpinConflict = useAcceptUnpinConflict();
  const cancelUnpinConflict = useCancelUnpinConflict();

  const [selectedResolution, setSelectedResolution] =
    useState<UnpinConflictResolution>('unpin-beyond');

  const handleAccept = () => {
    acceptUnpinConflict(selectedResolution);
    setSelectedResolution('unpin-beyond');
  };

  const handleCancel = () => {
    cancelUnpinConflict();
    setSelectedResolution('unpin-beyond');
  };

  const handleResolutionChange = (value: UnpinConflictResolution) => {
    setSelectedResolution(value);
  };

  return (
    <Modal
      footer={
        <>
          <Button color='outline' onClick={handleCancel} size='sm'>
            Cancel
          </Button>
          <Button color='primary' onClick={handleAccept} size='sm'>
            Accept
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={handleCancel}
      title='Unpin Conflict'
    >
      <p {...stylex.props(styles.description)}>
        Unpinning <strong>{columnLabel}</strong> would leave a gap in the {side}
        -pinned columns. Choose how to resolve this:
      </p>
      <RadioOptionGroup
        name='unpin-conflict-resolution'
        onChange={handleResolutionChange}
        options={UNPIN_CONFLICT_OPTIONS}
        value={selectedResolution}
      />
    </Modal>
  );
};
