import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type { PinConflictResolution } from '../ColumnOrderSection.types.ts';
import type { PinConflictModalProps } from './PinConflictModal.types.ts';

import { styles } from './PinConflictModal.stylex.ts';

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
        options={[
          {
            label: `Move column next to ${side}-pinned columns`,
            value: 'move-column',
          },
          {
            label: 'Pin all columns between edge and this column',
            value: 'pin-all-between',
          },
          {
            label: 'Pin without changing column order',
            value: 'pin-only',
          },
        ]}
        value={selectedResolution}
      />
    </Modal>
  );
};
