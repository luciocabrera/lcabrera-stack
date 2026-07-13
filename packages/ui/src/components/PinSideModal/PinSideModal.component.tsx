import type { PinSide } from '@repo/ui/types/ui.types';

import { ActionButtons } from '@repo/ui/components/ActionButtons';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { PIN_SIDE_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

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
        <ActionButtons
          actions={[
            { label: 'Accept', onClick: handleAccept },
            { color: 'outline', label: 'Cancel', onClick: handleCancel },
          ]}
        />
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
        onChange={setSelectedSide}
        options={PIN_SIDE_OPTIONS}
        value={selectedSide}
      />
    </Modal>
  );
};
