import { ActionButtons } from '@repo/ui/components/ActionButtons';
import { Modal } from '@repo/ui/components/Modal';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { ChoiceModalProps } from './ChoiceModal.types';

import { styles } from './ChoiceModal.stylex';

/**
 * Shared presentational modal for resolving a single-choice prompt: renders a
 * description, a radio group of options, and Accept/Cancel actions. Owns the
 * ephemeral selection state, which resets to `defaultValue` after accept or
 * cancel so the modal opens fresh next time. Pure and store-agnostic — feature
 * modals wrap it with their own data wiring and copy.
 */
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
