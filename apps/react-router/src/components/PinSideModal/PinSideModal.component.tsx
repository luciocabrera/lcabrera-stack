import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { PinSide } from '@/types/ui.types';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type { PinSideModalProps } from './PinSideModal.types';

import { styles } from './PinSideModal.stylex';

export const PinSideModal = ({
  columnLabel,
  isOpen,
  onAccept,
  onCancel,
}: PinSideModalProps) => {
  const [selectedSide, setSelectedSide] = useState<PinSide>('closest-edge');

  const handleAccept = () => {
    onAccept(selectedSide);
    setSelectedSide('closest-edge');
  };

  const handleCancel = () => {
    onCancel();
    setSelectedSide('closest-edge');
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
      title='Pin Column'
    >
      <p {...stylex.props(styles.description)}>
        Choose which side to pin <strong>{columnLabel}</strong> to:
      </p>
      <RadioOptionGroup
        name='pin-side-selection'
        onChange={(value) => {
          setSelectedSide(value);
        }}
        options={[
          {
            description: 'Pin to the nearest edge based on column position',
            label: 'Closest edge',
            value: 'closest-edge',
          },
          {
            label: 'Pin to the left',
            value: 'left',
          },
          {
            label: 'Pin to the right',
            value: 'right',
          },
        ]}
        value={selectedSide}
      />
    </Modal>
  );
};
