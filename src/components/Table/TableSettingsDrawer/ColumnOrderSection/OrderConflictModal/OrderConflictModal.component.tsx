import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type { OrderConflictResolution } from '../ColumnOrderSection.types';
import type { OrderConflictModalProps } from './OrderConflictModal.types';

import { RESOLUTIONS } from './OrderConflictModal.constants';
import { styles } from './OrderConflictModal.stylex';

export const OrderConflictModal = ({
  description,
  isOpen,
  onAccept,
  onCancel,
}: OrderConflictModalProps) => {
  const [selectedResolution, setSelectedResolution] =
    useState<OrderConflictResolution>('remove-conflicting-pins');

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
      title='Order & Pinning Conflict'
    >
      <p {...stylex.props(styles.description)}>{description}</p>
      <RadioOptionGroup
        name='sort-order-conflict-resolution'
        onChange={(value) => {
          setSelectedResolution(value as OrderConflictResolution);
        }}
        options={RESOLUTIONS}
        value={selectedResolution}
      />
    </Modal>
  );
};
