import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

import type {
  PinConflictModalProps,
  PinConflictResolution,
} from './PinConflictModal.types';

import { pinConflictModalStyles } from './PinConflictModal.stylex';

export const PinConflictModal = ({
  columnLabel,
  isOpen,
  onAccept,
  onCancel,
  side,
}: PinConflictModalProps) => {
  const [selectedResolution, setSelectedResolution] =
    useState<PinConflictResolution>('move-column');

  const handleAccept = () => {
    onAccept(selectedResolution);
    setSelectedResolution('move-column');
  };

  const handleCancel = () => {
    onCancel();
    setSelectedResolution('move-column');
  };
// TODO: create components for the options, to avoid repeating the same structure and styles for each option, and to make the code more readable --- IGNORE ---
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
      <p {...stylex.props(pinConflictModalStyles.description)}>
        <strong>{columnLabel}</strong> is not adjacent to the {side}-pinned
        columns. Choose how to resolve this:
      </p>
      <div {...stylex.props(pinConflictModalStyles.options)}>
        <label
          {...stylex.props(
            pinConflictModalStyles.option,
            selectedResolution === 'move-column' &&
              pinConflictModalStyles.optionSelected,
          )}
        >
          <input
            {...stylex.props(pinConflictModalStyles.radio)}
            checked={selectedResolution === 'move-column'}
            name='pin-conflict-resolution'
            onChange={() => {
              setSelectedResolution('move-column');
            }}
            type='radio'
            value='move-column'
          />
          <span {...stylex.props(pinConflictModalStyles.optionLabel)}>
            Move column next to {side}-pinned columns
          </span>
        </label>
        <label
          {...stylex.props(
            pinConflictModalStyles.option,
            selectedResolution === 'pin-all-between' &&
              pinConflictModalStyles.optionSelected,
          )}
        >
          <input
            {...stylex.props(pinConflictModalStyles.radio)}
            checked={selectedResolution === 'pin-all-between'}
            name='pin-conflict-resolution'
            onChange={() => {
              setSelectedResolution('pin-all-between');
            }}
            type='radio'
            value='pin-all-between'
          />
          <span {...stylex.props(pinConflictModalStyles.optionLabel)}>
            Pin all columns between edge and this column
          </span>
        </label>
      </div>
    </Modal>
  );
};
