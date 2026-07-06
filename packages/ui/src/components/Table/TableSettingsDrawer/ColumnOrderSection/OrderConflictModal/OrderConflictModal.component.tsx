import { Button } from '@repo/ui/components/Button';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { ORDER_CONFLICT_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { OrderConflictResolution } from '../ColumnOrderSection.types';
import type { OrderConflictModalProps } from './OrderConflictModal.types';

import {
  useAcceptOrderConflict,
  useCancelOrderConflict,
} from '../ColumnOrderSectionContext/actions';
import { styles } from './OrderConflictModal.stylex';

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
        options={ORDER_CONFLICT_OPTIONS}
        value={selectedResolution}
      />
    </Modal>
  );
};
