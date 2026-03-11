import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

import type { SortOrderConflictResolution } from '../utils';
import type { SortOrderConflictModalProps } from './SortOrderConflictModal.types';

import { pinConflictModalStyles } from '../PinConflictModal/PinConflictModal.stylex';

const RESOLUTIONS: {
  description: string;
  label: string;
  value: SortOrderConflictResolution;
}[] = [
  {
    description:
      'Apply the new sorting order and remove any pinning that no longer matches.',
    label: 'Apply order & remove conflicting pins',
    value: 'remove-conflicting-pins',
  },
  {
    description:
      'Apply the new sorting order and clear all column pinning.',
    label: 'Apply order & reset all pins',
    value: 'reset-all-pins',
  },
  {
    description:
      'Move pinned columns to the edges so both the new order and all existing pins are preserved.',
    label: 'Apply order & keep all pins',
    value: 'pin-to-match-order',
  },
];

export const SortOrderConflictModal = ({
  isOpen,
  onAccept,
  onCancel,
}: SortOrderConflictModalProps) => {
  const [selectedResolution, setSelectedResolution] =
    useState<SortOrderConflictResolution>('remove-conflicting-pins');

  const handleAccept = () => {
    onAccept(selectedResolution);
    setSelectedResolution('remove-conflicting-pins');
  };

  const handleCancel = () => {
    onCancel();
    setSelectedResolution('remove-conflicting-pins');
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
      title='Sorting & Pinning Conflict'
    >
      <p {...stylex.props(pinConflictModalStyles.description)}>
        Reordering columns by sorting will move pinned columns out of their
        pinned positions. Choose how to proceed:
      </p>
      <div {...stylex.props(pinConflictModalStyles.options)}>
        {RESOLUTIONS.map((res) => (
          <label
            key={res.value}
            {...stylex.props(
              pinConflictModalStyles.option,
              selectedResolution === res.value &&
                pinConflictModalStyles.optionSelected,
            )}
          >
            <input
              {...stylex.props(pinConflictModalStyles.radio)}
              checked={selectedResolution === res.value}
              name='sort-order-conflict-resolution'
              onChange={() => {
                setSelectedResolution(res.value);
              }}
              type='radio'
              value={res.value}
            />
            <span>
              <span {...stylex.props(pinConflictModalStyles.optionLabel)}>
                {res.label}
              </span>
              <br />
              <span {...stylex.props(pinConflictModalStyles.description)}>
                {res.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  );
};
