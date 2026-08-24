import { ActionButtons } from '#ui/components/ActionButtons';
import { Modal } from '#ui/components/Modal';

import type { ConfirmDialogProps } from './ConfirmDialog.types';

export const ConfirmDialog = ({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) => (
  <Modal
    footer={
      <ActionButtons
        actions={[
          {
            key: 'confirm',
            label: confirmLabel,
            onClick: onConfirm,
            variant: 'error',
          },
          {
            key: 'cancel',
            label: cancelLabel,
            onClick: onCancel,
            variant: 'outline',
          },
        ]}
      />
    }
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
  >
    {Boolean(description) && <p>{description}</p>}
  </Modal>
);
