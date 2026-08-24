import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { ActionButtons } from '#ui/components/ActionButtons';
import { Modal } from '#ui/components/Modal';
import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';

import type { ChoiceModalProps } from './ChoiceModal.types';

import { styles } from './ChoiceModal.stylex';

export const ChoiceModal = <TValue extends string>({
  defaultValue,
  description,
  isOpen,
  onAccept,
  onCancel,
  options,
  radioName,
  title,
}: ChoiceModalProps<TValue>) => {
  const [selectedValue, setSelectedValue] = useState<TValue>(defaultValue);

  const handleAccept = () => {
    onAccept(selectedValue);
    setSelectedValue(defaultValue);
  };

  const handleCancel = () => {
    onCancel();
    setSelectedValue(defaultValue);
  };

  return (
    <Modal
      footer={
        <ActionButtons
          actions={[
            { label: 'Accept', onClick: handleAccept, variant: 'primary' },
            { label: 'Cancel', onClick: handleCancel },
          ]}
        />
      }
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
    >
      <p {...stylex.props(styles.description)}>{description}</p>
      <RadioOptionGroup
        name={radioName}
        onChange={setSelectedValue}
        options={options}
        value={selectedValue}
      />
    </Modal>
  );
};
