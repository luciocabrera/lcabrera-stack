import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type { OrderConflictResolution } from '../ColumnOrderSection.types.ts';
import type { OrderConflictModalProps } from './OrderConflictModal.types.ts';

import {
  useAcceptOrderConflict,
  useCancelOrderConflict,
} from '../ColumnOrderSectionContext/actions/index.ts';
import { RESOLUTIONS } from './OrderConflictModal.constants.ts';
import { styles } from './OrderConflictModal.stylex.ts';

export const OrderConflictModal = ({
  description,
  isOpen,
}: OrderConflictModalProps) => {
  const [selectedResolution, setSelectedResolution] =
    useState<OrderConflictResolution>('remove-conflicting-pins');
  const acceptOrderConflict = useAcceptOrderConflict();
  const cancelOrderConflict = useCancelOrderConflict();

  const handleAccept = () => {
    acceptOrderConflict(selectedResolution);
    setSelectedResolution('remove-conflicting-pins');
  };

  const handleCancel = () => {
    cancelOrderConflict();
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
          setSelectedResolution(value);
        }}
        options={RESOLUTIONS}
        value={selectedResolution}
      />
    </Modal>
  );
};
