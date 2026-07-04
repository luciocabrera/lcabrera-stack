import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@repo/ui/components/Button';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { UNPIN_CONFLICT_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';

import type { UnpinConflictResolution } from '../ColumnOrderSection.types';
import type { UnpinConflictModalProps } from './UnpinConflictModal.types';

import {
  useAcceptUnpinConflict,
  useCancelUnpinConflict,
} from '../ColumnOrderSectionContext/actions';
import { styles } from './UnpinConflictModal.stylex';

export const UnpinConflictModal = ({
  columnLabel,
  isOpen,
  side,
}: UnpinConflictModalProps) => {
  const [selectedResolution, setSelectedResolution] =
    useState<UnpinConflictResolution>('unpin-beyond');
  const acceptUnpinConflict = useAcceptUnpinConflict();
  const cancelUnpinConflict = useCancelUnpinConflict();

  const handleAccept = () => {
    acceptUnpinConflict(selectedResolution);
    setSelectedResolution('unpin-beyond');
  };

  const handleCancel = () => {
    cancelUnpinConflict();
    setSelectedResolution('unpin-beyond');
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
        onChange={(value) => {
          setSelectedResolution(value);
        }}
        options={UNPIN_CONFLICT_OPTIONS}
        value={selectedResolution}
      />
    </Modal>
  );
};
