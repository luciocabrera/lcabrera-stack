import { ActionButtons } from '@repo/ui/components/ActionButtons';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { ORDER_CONFLICT_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { OrderConflictResolution } from '../ColumnOrderSection.types';

import {
  useAcceptOrderConflict,
  useCancelOrderConflict,
} from '../ColumnOrderSectionContext/actions';
import { useGetOrderConflict } from '../ColumnOrderSectionContext/selectors';
import { styles } from './OrderConflictModal.stylex';

/**
 * Conflict-resolution modal shown when a proposed column order breaks pin
 * contiguity. Owns its store wiring: reads the order-conflict slice and
 * dispatches the accept/cancel actions itself.
 */
export const OrderConflictModal = () => {
  const { description, isOpen } = useGetOrderConflict();
  const acceptOrderConflict = useAcceptOrderConflict();
  const cancelOrderConflict = useCancelOrderConflict();

  const [selectedResolution, setSelectedResolution] =
    useState<OrderConflictResolution>('remove-conflicting-pins');

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
        <ActionButtons
          actions={[
            { label: 'Accept', onClick: handleAccept },
            { label: 'Cancel', onClick: handleCancel, variant: 'outline' },
          ]}
        />
      }
      isOpen={isOpen}
      onClose={handleCancel}
      title='Order & Pinning Conflict'
    >
      <p {...stylex.props(styles.description)}>{description}</p>
      <RadioOptionGroup
        name='sort-order-conflict-resolution'
        onChange={setSelectedResolution}
        options={ORDER_CONFLICT_OPTIONS}
        value={selectedResolution}
      />
    </Modal>
  );
};
