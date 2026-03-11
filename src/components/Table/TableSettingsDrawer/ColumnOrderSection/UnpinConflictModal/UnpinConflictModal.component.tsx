import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type { UnpinConflictResolution } from '../ColumnOrderSection.types';
import type { UnpinConflictModalProps } from './UnpinConflictModal.types';

import { styles } from './UnpinConflictModal.stylex';

export const UnpinConflictModal = ({
  columnLabel,
  isOpen,
  onAccept,
  onCancel,
  side,
}: UnpinConflictModalProps) => {
  const [selectedResolution, setSelectedResolution] =
    useState<UnpinConflictResolution>('unpin-beyond');

  const handleAccept = () => {
    onAccept(selectedResolution);
    setSelectedResolution('unpin-beyond');
  };

  const handleCancel = () => {
    onCancel();
    setSelectedResolution('unpin-beyond');
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
      title='Unpin Conflict'
    >
      <p {...stylex.props(styles.description)}>
        Unpinning <strong>{columnLabel}</strong> would leave a gap in the{' '}
        {side}-pinned columns. Choose how to resolve this:
      </p>
      <RadioOptionGroup
        name='unpin-conflict-resolution'
        onChange={(value) => {
          setSelectedResolution(value as UnpinConflictResolution);
        }}
        options={[
          {
            description:
              'Also unpin columns between this one and the center of the table',
            label: 'Unpin this and columns beyond',
            value: 'unpin-beyond',
          },
          {
            description:
              'Move remaining pinned columns together to keep them contiguous',
            label: 'Reorder to fill the gap',
            value: 'reorder-to-fill',
          },
        ]}
        value={selectedResolution}
      />
    </Modal>
  );
};
