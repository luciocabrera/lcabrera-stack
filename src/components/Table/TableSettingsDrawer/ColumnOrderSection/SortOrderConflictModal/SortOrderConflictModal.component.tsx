import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type { SortOrderConflictResolution } from '../ColumnOrderSection.types';
import type { SortOrderConflictModalProps } from './SortOrderConflictModal.types';

import { RESOLUTIONS } from './SortOrderConflictModal.constants';
import { styles } from './SortOrderConflictModal.stylex';

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
      <p {...stylex.props(styles.description)}>
        Reordering columns by sorting will move pinned columns out of their
        pinned positions. Choose how to proceed:
      </p>
      <RadioOptionGroup
        name='sort-order-conflict-resolution'
        onChange={(value) => {
          setSelectedResolution(value as SortOrderConflictResolution);
        }}
        options={RESOLUTIONS}
        value={selectedResolution}
      />
    </Modal>
  );
};
