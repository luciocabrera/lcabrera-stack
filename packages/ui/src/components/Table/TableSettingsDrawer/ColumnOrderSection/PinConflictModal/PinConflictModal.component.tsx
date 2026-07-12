import { Button } from '@repo/ui/components/Button';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { PIN_CONFLICT_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { PinConflictResolution } from '../ColumnOrderSection.types';
import type { PinConflictModalProps } from './PinConflictModal.types';

import { styles } from './PinConflictModal.stylex';

export const PinConflictModal = ({
  columnLabel,
  isOpen,
  onAccept,
  onCancel,
  side,
}: PinConflictModalProps) => {
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
    onAccept(selectedResolution);
    setSelectedResolution('move-column');
  };

  const handleCancel = () => {
    onCancel();
    setSelectedResolution('move-column');
  };

  const handleResolutionChange = (value: PinConflictResolution) => {
    setSelectedResolution(value);
  };

  return (
    <Modal
      footer={
        <>
          <Button color='primary' onClick={handleAccept} size='sm'>
            Accept
          </Button>
          <Button color='outline' onClick={handleCancel} size='sm'>
            Cancel
          </Button>
        </>
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
        onChange={handleResolutionChange}
        options={options}
        value={selectedResolution}
      />
    </Modal>
  );
};
