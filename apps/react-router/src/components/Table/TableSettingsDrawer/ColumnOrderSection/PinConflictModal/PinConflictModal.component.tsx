import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';
import { PIN_CONFLICT_OPTIONS } from '@/constants/pinningPreferences.constants';

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
      title='Pin Conflict'
    >
      <p {...stylex.props(styles.description)}>
        <strong>{columnLabel}</strong> is not adjacent to the {side}-pinned
        columns. Choose how to resolve this:
      </p>
      <RadioOptionGroup
        name='pin-conflict-resolution'
        onChange={(value) => {
          setSelectedResolution(value);
        }}
        options={options}
        value={selectedResolution}
      />
    </Modal>
  );
};
